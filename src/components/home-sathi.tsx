import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, MessageSquarePlus, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import sathiMark from "@/assets/sathi-mark.png";
import { SathiChat } from "@/components/sathi/sathi-chat";
import { Button } from "@/components/ui/button";
import { createSathiThread, sathiMessagesQueryOptions, sathiThreadsQueryOptions } from "@/lib/sathi";

export function HomeSathi({ signedIn }: { signedIn: boolean }) {
  if (!signedIn) return <SignedOutSathi />;
  return <SignedInSathi />;
}

function SignedInSathi() {
  const queryClient = useQueryClient();
  const started = useRef(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const { data: threads, isPending: threadsPending, isError: threadsError } = useQuery(sathiThreadsQueryOptions);
  const { data: messages, isPending: messagesPending, isError: messagesError } = useQuery({
    ...sathiMessagesQueryOptions(threadId ?? "pending"),
    enabled: Boolean(threadId),
  });

  useEffect(() => {
    if (threadsPending || started.current) return;
    const existing = threads?.[0]?.id;
    if (existing) {
      started.current = true;
      setThreadId(existing);
      return;
    }
    started.current = true;
    void createSathiThread()
      .then((id) => {
        setThreadId(id);
        void queryClient.invalidateQueries({ queryKey: sathiThreadsQueryOptions.queryKey });
      })
      .catch(() => setCreationError("Sathi could not open a chat right now."));
  }, [queryClient, threads, threadsPending]);

  async function newChat() {
    setCreationError(null);
    try {
      const id = await createSathiThread();
      setThreadId(id);
      await queryClient.invalidateQueries({ queryKey: sathiThreadsQueryOptions.queryKey });
    } catch {
      setCreationError("Sathi could not start a new chat right now.");
    }
  }

  const error = creationError || (threadsError || messagesError ? "Sathi could not load your saved chat." : null);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img src={sathiMark} alt="" width={48} height={48} className="size-12 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xl">Ask Sathi</h3>
            <p className="text-sm text-muted-foreground">Your private chat, saved to your account.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void newChat()}>
            <MessageSquarePlus aria-hidden="true" /> New chat
          </Button>
          {threadId ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/sathi/$threadId" params={{ threadId }}>
                <Phone aria-hidden="true" /> Full chat &amp; voice
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
      {error ? (
        <div className="p-6 text-sm text-destructive" role="alert">{error}</div>
      ) : !threadId || messagesPending ? (
        <div className="flex min-h-80 items-center justify-center p-6 text-sm text-muted-foreground">Opening your chat…</div>
      ) : (
        <div className="p-3 sm:p-5">
          <SathiChat key={threadId} threadId={threadId} initialMessages={messages ?? []} variant="compact" />
        </div>
      )}
    </div>
  );
}

function SignedOutSathi() {
  return (
    <div className="grid overflow-hidden rounded-lg border border-border bg-card md:grid-cols-[0.8fr_1.2fr]">
      <div className="flex items-center justify-center bg-foreground p-8 text-background sm:p-10">
        <img src={sathiMark} alt="Sathi" width={176} height={176} className="w-32 sm:w-44" />
      </div>
      <div className="p-6 sm:p-10">
        <p className="text-sm font-semibold text-primary">PRIVATE, ACCOUNT-BASED GUIDANCE</p>
        <h3 className="mt-3 text-3xl">Ask the question you’re stuck on.</h3>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Sathi searches real ABILITY360 opportunities, scholarships, roles, your applications and goals. It can listen to your question and read answers aloud.
        </p>
        <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
          <li className="flex gap-2"><MessageCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />English, Hindi and Hinglish</li>
          <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />Text, microphone and voice call</li>
        </ul>
        <Button asChild className="mt-6 min-h-12">
          <Link to="/login" search={{ next: "/sathi" }}>Sign in to ask Sathi <ArrowRight aria-hidden="true" /></Link>
        </Button>
      </div>
    </div>
  );
}