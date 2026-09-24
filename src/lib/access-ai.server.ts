const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function callTool<T>(opts: {
  system: string;
  user: string;
  toolName: string;
  parameters: Record<string, unknown>;
}): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured.");
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      tools: [{ type: "function", function: { name: opts.toolName, parameters: opts.parameters } }],
      tool_choice: { type: "function", function: { name: opts.toolName } },
    }),
  });
  if (res.status === 429) throw new Error("Too many AI requests right now. Please try again in a minute.");
  if (res.status === 402) throw new Error("AI credits have run out for this workspace.");
  if (!res.ok) throw new Error("The AI service could not respond. Please try again.");
  const json = (await res.json()) as {
    choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
  };
  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("The AI returned an empty answer.");
  return JSON.parse(args) as T;
}
