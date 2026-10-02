import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Phone } from "lucide-react";
import { useState } from "react";

import { SathiChat } from "@/components/sathi/sathi-chat";
import { SathiVoiceCall } from "@/components/sathi/sathi-voice-call";
import { Button } from "@/components/ui/button";
import { sathiMessagesQueryOptions } from "@/lib/sathi";

export const Route = createFileRoute("/_authenticated/sathi/$threadId")({
  component: SathiThreadPage,
});

function SathiThreadPage() {
  const { threadId } = Route.useParams();
  const [mode, setMode] = useState<"chat" | "call">("chat");
  const { data, isPending, isError } = useQuery(sathiMessagesQueryOptions(threadId));

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border p-1" role="tablist" aria-label="How to talk to Sathi">
        <Button
          role="tab"
          aria-selected={mode === "chat"}
          variant={mode === "chat" ? "default" : "ghost"}
          size="sm"
          className="min-h-10"
          onClick={() => setMode("chat")}
        >
          <MessageCircle className="mr-2 h-4 w-4" aria-hidden /> Chat
        </Button>
        <Button
          role="tab"
          aria-selected={mode === "call"}
          variant={mode === "call" ? "default" : "ghost"}
          size="sm"
          className="min-h-10"
          onClick={() => setMode("call")}
        >
          <Phone className="mr-2 h-4 w-4" aria-hidden /> Voice call
        </Button>
      </div>

      {mode === "call" ? (
        <SathiVoiceCall />
      ) : isPending ? (
        <p className="text-sm text-muted-foreground">Loading chat…</p>
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">
          This chat could not be loaded.
        </p>
      ) : (
        <SathiChat key={threadId} threadId={threadId} initialMessages={data ?? []} />
      )}
    </div>
  );
}
