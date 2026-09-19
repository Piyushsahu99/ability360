import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateIN } from "@/lib/india";
import { markThreadRead, sendChatMessage, type ChatThread } from "@/lib/chat";
import { cn } from "@/lib/utils";

export function ChatPanel({
  threads,
  viewerId,
  as,
  queryKey,
}: {
  threads: ChatThread[];
  viewerId: string;
  as: "student" | "employer";
  queryKey: readonly unknown[];
}) {
  const queryClient = useQueryClient();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const active = useMemo(
    () => threads.find((thread) => thread.key === activeKey) ?? threads[0] ?? null,
    [threads, activeKey],
  );

  useEffect(() => {
    if (!active || !viewerId) return;
    void markThreadRead(active, viewerId).then(() => {
      if (active.unread > 0) void queryClient.invalidateQueries({ queryKey });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.key, active?.unread, viewerId]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("Select a conversation first.");
      await sendChatMessage({
        companyId: active.companyId,
        studentId: active.studentId,
        opportunityId: active.lastMessage.opportunity_id,
        body: draft,
        as,
      });
    },
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (threads.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        description={
          as === "employer"
            ? "Students who message you about an opportunity will appear here."
            : "Open an opportunity and message the employer to start a conversation."
        }
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <ul className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Conversations">
        {threads.map((thread) => {
          const label = as === "employer" ? thread.studentName : thread.companyName;
          const isActive = active?.key === thread.key;
          return (
            <li key={thread.key} className="shrink-0 md:shrink">
              <button
                type="button"
                onClick={() => setActiveKey(thread.key)}
                className={cn(
                  "w-full min-h-11 rounded-xl border border-border px-3 py-2 text-left text-sm",
                  isActive ? "bg-primary-soft text-primary" : "hover:bg-secondary",
                )}
                aria-current={isActive ? "true" : undefined}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{label}</span>
                  {thread.unread > 0 && <Badge variant="default">{thread.unread}</Badge>}
                </span>
                {thread.opportunityTitle && (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {thread.opportunityTitle}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl border border-border">
        <div
          className="flex max-h-96 flex-col gap-3 overflow-y-auto p-4"
          role="log"
          aria-live="polite"
          aria-label="Conversation messages"
        >
          {active?.messages.map((message) => {
            const mine = message.sender_id === viewerId;
            return (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  mine
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-secondary text-foreground",
                )}
              >
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className={cn("mt-1 text-[11px]", mine ? "opacity-80" : "text-muted-foreground")}>
                  {formatDateIN(message.created_at)}
                </p>
              </div>
            );
          })}
        </div>

        <form
          className="flex items-end gap-2 border-t border-border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim().length === 0) return;
            mutation.mutate();
          }}
        >
          <label className="sr-only" htmlFor="chat-draft">
            Your message
          </label>
          <Textarea
            id="chat-draft"
            rows={2}
            maxLength={4000}
            value={draft}
            placeholder="Write a message…"
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
            <Send className="size-4" aria-hidden="true" />
            {mutation.isPending ? "Sending…" : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
