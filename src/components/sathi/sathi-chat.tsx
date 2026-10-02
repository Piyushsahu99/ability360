import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { BookOpen, Briefcase, Compass, Mic, Square, Target, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import sathiMark from "@/assets/sathi-mark.png";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { recordWav } from "@/lib/record-wav";
import { sathiAccessToken, sathiThreadsQueryOptions, speakText, stopSpeaking, transcribeClip } from "@/lib/sathi";

const SUGGESTIONS = [
  { icon: Briefcase, text: "Find remote internships for a B.Tech student" },
  { icon: BookOpen, text: "Which scholarships are open for students with disabilities?" },
  { icon: Compass, text: "What are the highest-paying roles for BCA graduates?" },
  { icon: Target, text: "What should I do next on my applications and goals?" },
];

const TOOL_LABELS: Record<string, string> = {
  search_opportunities: "Searched opportunities",
  search_resources: "Searched scholarships & programs",
  search_career_roles: "Looked up career roles",
  my_applications: "Checked your applications",
  my_goals: "Checked your goals",
};

function textOf(message: UIMessage) {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

export function SathiChat({ threadId, initialMessages }: { threadId: string; initialMessages: UIMessage[] }) {
  return (
    <PromptInputProvider>
      <SathiChatInner threadId={threadId} initialMessages={initialMessages} />
    </PromptInputProvider>
  );
}

function SathiChatInner({ threadId, initialMessages }: { threadId: string; initialMessages: UIMessage[] }) {
  const queryClient = useQueryClient();
  const input = usePromptInputController();
  const [autoRead, setAutoRead] = useState(false);
  const [recording, setRecording] = useState<{ stop: () => Promise<File> } | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/sathi/chat",
        headers: async (): Promise<Record<string, string>> => {
          const token = await sathiAccessToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        prepareSendMessagesRequest: ({ messages, headers }) => ({
          headers,
          body: { threadId, message: messages[messages.length - 1] },
        }),
      }),
    [threadId],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (err) => toast.error(readableError(err)),
    onFinish: ({ message }) => {
      void queryClient.invalidateQueries({ queryKey: sathiThreadsQueryOptions.queryKey });
      if (autoRead && message.role === "assistant") speakText(textOf(message));
      textareaRef.current?.focus();
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    textareaRef.current?.focus();
    return () => stopSpeaking();
  }, []);

  function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    if (value.length > 2000) {
      toast.error("Please keep your message under 2000 characters.");
      return;
    }
    void sendMessage({ text: value });
    input.textInput.clear();
  }

  async function toggleRecording() {
    if (recording) {
      setRecording(null);
      setTranscribing(true);
      try {
        const file = await recording.stop();
        const text = await transcribeClip(file);
        input.textInput.setInput(input.textInput.value ? `${input.textInput.value} ${text}` : text);
        textareaRef.current?.focus();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not use the recording.");
      } finally {
        setTranscribing(false);
      }
      return;
    }
    try {
      setRecording(await recordWav());
    } catch {
      toast.error("Please allow microphone access to speak to Sathi.");
    }
  }

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[480px] flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="gap-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<img src={sathiMark} alt="" width={64} height={64} className="h-16 w-16" />}
              title="Namaste! I'm Sathi."
              description="Ask me about internships, jobs, scholarships, government schemes, career roles or your own applications. You can type or speak."
            >
              <div className="mt-2 flex flex-col items-center gap-3">
                <img src={sathiMark} alt="" width={64} height={64} className="h-16 w-16" />
                <h2 className="text-lg font-semibold">Namaste! I'm Sathi.</h2>
                <p className="max-w-md text-center text-sm text-muted-foreground">
                  Ask me about internships, jobs, scholarships, government schemes, career roles or your own
                  applications. Type, or tap the microphone to speak.
                </p>
                <div className="mt-2 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map(({ icon: Icon, text }) => (
                    <Button
                      key={text}
                      variant="outline"
                      className="h-auto justify-start whitespace-normal py-3 text-left text-sm"
                      onClick={() => submit(text)}
                    >
                      <Icon className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      {text}
                    </Button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return message.role === "assistant" ? (
                        <MessageResponse key={i}>{part.text}</MessageResponse>
                      ) : (
                        <p key={i} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      );
                    }
                    if (isToolUIPart(part)) {
                      const name = part.type.replace(/^tool-/, "");
                      return (
                        <Tool key={i} defaultOpen={false}>
                          <ToolHeader type={part.type} state={part.state} title={TOOL_LABELS[name] ?? name} />
                          <ToolContent>
                            <ToolInput input={part.input} />
                            <ToolOutput output={part.output} errorText={part.errorText} />
                          </ToolContent>
                        </Tool>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
                {message.role === "assistant" && textOf(message) && !busy ? (
                  <MessageActions>
                    <MessageAction tooltip="Read aloud" label="Read aloud" onClick={() => speakText(textOf(message))}>
                      <Volume2 className="h-4 w-4" />
                    </MessageAction>
                  </MessageActions>
                ) : null}
              </Message>
            ))
          )}
          {status === "submitted" ? (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Sathi is thinking…</Shimmer>
              </MessageContent>
            </Message>
          ) : null}
          {error && !busy ? (
            <p role="alert" className="text-sm text-destructive">
              {readableError(error)}
            </p>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={(msg) => submit(msg.text ?? "")} className="mt-3">
        <PromptInputTextarea
          ref={textareaRef}
          placeholder={recording ? "Listening… tap stop when done" : "Ask Sathi anything…"}
          maxLength={2000}
          aria-label="Message Sathi"
        />
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton
              onClick={() => void toggleRecording()}
              disabled={transcribing || busy}
              aria-label={recording ? "Stop recording" : "Speak your question"}
              aria-pressed={Boolean(recording)}
              className={recording ? "text-destructive" : undefined}
            >
              {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span className="text-xs">{recording ? "Stop" : transcribing ? "Writing…" : "Speak"}</span>
            </PromptInputButton>
            <PromptInputButton
              onClick={() => {
                if (autoRead) stopSpeaking();
                setAutoRead((v) => !v);
              }}
              aria-pressed={autoRead}
              aria-label="Read replies aloud automatically"
            >
              {autoRead ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="text-xs">{autoRead ? "Reading replies" : "Read replies"}</span>
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !input.textInput.value.trim()} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function readableError(err: Error) {
  try {
    const parsed = JSON.parse(err.message) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    /* plain text */
  }
  return err.message || "Something went wrong. Please try again.";
}
