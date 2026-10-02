import { Mic, MicOff, Phone, PhoneOff, Play } from "lucide-react";
import { useCallback, useState } from "react";

import sathiMark from "@/assets/sathi-mark.png";
import { Button } from "@/components/ui/button";
import { useLiveVoice } from "@/hooks/use-live-voice";
import { sathiAccessToken } from "@/lib/sathi";

type Caption = { role: "user" | "assistant"; text: string };

export function SathiVoiceCall() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [working, setWorking] = useState(false);

  const onEvent = useCallback((event: { type: string; delta?: unknown }) => {
    if (event.type === "session.delegation.created") setWorking(true);
    if (event.type === "app.closed" || event.type === "app.error") setWorking(false);
    const role =
      event.type === "session.input_transcript.delta"
        ? "user"
        : event.type === "session.output_transcript.delta"
          ? "assistant"
          : null;
    if (!role || typeof event.delta !== "string") return;
    if (role === "assistant") setWorking(false);
    const delta = event.delta;
    setCaptions((rows) => {
      const last = rows[rows.length - 1];
      if (last && last.role === role) return [...rows.slice(0, -1), { role, text: last.text + delta }];
      return [...rows.slice(-30), { role, text: delta }];
    });
  }, []);

  const call = useLiveVoice({ onEvent: onEvent as never, getAccessToken: sathiAccessToken });
  const active = call.status === "connecting" || call.status === "connected" || call.status === "stopping";

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <img src={sathiMark} alt="" width={48} height={48} className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Talk to Sathi</h2>
          <p className="text-sm text-muted-foreground">
            A live voice call. Speak in English, Hindi or your language. Uses your microphone.
          </p>
        </div>
        {!active ? (
          <Button
            onClick={() => {
              setCaptions([]);
              call.start();
            }}
            className="min-h-11"
          >
            <Phone className="mr-2 h-4 w-4" aria-hidden /> Start call
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => call.setMuted(!call.muted)}
              aria-pressed={call.muted}
              disabled={call.status !== "connected"}
            >
              {call.muted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {call.muted ? "Unmute" : "Mute"}
            </Button>
            <Button variant="destructive" className="min-h-11" onClick={() => call.stop()}>
              <PhoneOff className="mr-2 h-4 w-4" aria-hidden /> End call
            </Button>
          </div>
        )}
      </div>

      <p className="mt-3 text-sm" role="status" aria-live="polite">
        {call.status === "connecting"
          ? "Connecting…"
          : call.status === "connected"
            ? working
              ? "Sathi is looking that up…"
              : "Connected — go ahead and speak."
            : call.status === "stopping"
              ? "Ending call…"
              : "Not in a call."}
      </p>
      {call.error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {call.error} You can try starting the call again.
        </p>
      ) : null}
      {call.playbackBlocked ? (
        <Button variant="outline" className="mt-2" onClick={() => call.resumePlayback()}>
          <Play className="mr-2 h-4 w-4" /> Play Sathi's voice
        </Button>
      ) : null}

      <audio ref={call.audioRef} controls className="mt-3 h-8 w-full max-w-sm" aria-label="Sathi's voice" />

      {captions.length ? (
        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-lg bg-muted/50 p-3 text-sm" aria-label="Live captions">
          {captions.map((c, i) => (
            <p key={i}>
              <span className="font-semibold">{c.role === "user" ? "You: " : "Sathi: "}</span>
              {c.text}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
