import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { z } from "zod";

import { bearerFrom, checkSathiRateLimit, verifySathiToken } from "./auth.server";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id.server";
import { buildSathiTools, SATHI_SYSTEM } from "./tools.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const bodySchema = z.object({
  threadId: z.string().uuid(),
  message: z.object({
    id: z.string().min(1).max(100),
    role: z.literal("user"),
    parts: z
      .array(z.object({ type: z.literal("text"), text: z.string().trim().min(1).max(2000) }))
      .min(1)
      .max(4),
  }),
});

const json = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });

function friendlyError(error: unknown) {
  const status = (error as { statusCode?: number })?.statusCode;
  if (status === 429) return "Sathi is busy right now. Please try again in a minute.";
  if (status === 402) return "Sathi is out of AI credits. Please ask the site admin to add credits.";
  if (status === 403) return "Sathi can't answer this request.";
  return "Sathi couldn't finish that answer. Please try again.";
}

export async function handleSathiChat(request: Request) {
  if ((Number(request.headers.get("content-length")) || 0) > 32_000) return json(413, "Message is too long.");
  const user = await verifySathiToken(bearerFrom(request));
  if (!user) return json(401, "Please sign in to chat with Sathi.");

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return json(500, "Sathi is not configured.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, "Please type a message of up to 2000 characters.");
  const { threadId, message } = parsed.data;

  const { data: thread } = await user.db
    .from("sathi_threads")
    .select("id, title")
    .eq("id", threadId)
    .eq("user_id", user.userId)
    .maybeSingle();
  if (!thread) return json(404, "This chat was not found.");

  const limited = await checkSathiRateLimit(user);
  if (limited) return json(429, limited);

  // History always comes from the database, never from the browser.
  const { data: rows, error: historyError } = await user.db
    .from("sathi_messages")
    .select("message")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (historyError) return json(500, "Could not load this chat.");
  const history = (rows ?? []).reverse().map((r) => r.message as unknown as UIMessage);

  const userMessage: UIMessage = { id: message.id, role: "user", parts: message.parts };
  const { error: saveError } = await user.db.from("sathi_messages").insert({
    thread_id: threadId,
    user_id: user.userId,
    ui_id: message.id,
    role: "user",
    message: userMessage as never,
  });
  if (saveError) return json(500, "Could not save your message.");

  const firstText = message.parts[0]?.text ?? "";
  await user.db
    .from("sathi_threads")
    .update({
      updated_at: new Date().toISOString(),
      ...(thread.title === "New chat" ? { title: firstText.slice(0, 60) } : {}),
    })
    .eq("id", threadId);

  const messages = [...history, userMessage];
  const tools = buildSathiTools(user);
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    system: SATHI_SYSTEM,
    messages: await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true }),
    tools,
    stopWhen: stepCountIs(50),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const response = result.toUIMessageStreamResponse({
    originalMessages: messages,
    sendReasoning: true,
    generateMessageId: () => crypto.randomUUID(),
    onError: friendlyError,
    onFinish: async ({ responseMessage, isAborted }) => {
      if (!responseMessage?.parts?.length) return;
      const { error } = await user.db.from("sathi_messages").insert({
        thread_id: threadId,
        user_id: user.userId,
        ui_id: responseMessage.id,
        role: "assistant",
        message: responseMessage as never,
      });
      if (error) console.error("Sathi: failed to save reply", error.message, { isAborted });
    },
  });
  return withLovableAiGatewayRunIdHeader(response, runIdFetch);
}
