import { createFileRoute } from "@tanstack/react-router";

import { bearerFrom, verifySathiToken } from "@/lib/sathi/auth.server";

const MAX_BYTES = 10 * 1024 * 1024;

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/sathi/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await verifySathiToken(bearerFrom(request));
        if (!user) return json(401, "Please sign in to use voice input.");
        const declared = Number(request.headers.get("content-length")) || 0;
        if (declared > MAX_BYTES + 64_000) return json(413, "Recording is too long. Please keep it under a minute.");
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json(500, "Voice input is not configured.");

        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        if (!(file instanceof File) || !file.size || file.size > MAX_BYTES || !file.type.startsWith("audio/")) {
          return json(400, "Please record a short voice message and try again.");
        }
        const upstream = new FormData();
        upstream.append("model", "google/gemini-3.5-transcribe");
        upstream.append("file", file, file.name || "recording.wav");
        upstream.append("response_format", "json");
        upstream.append("stream", "true");
        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: upstream,
          signal: request.signal,
        });
        return new Response(response.body, {
          status: response.status,
          headers: { "content-type": response.headers.get("content-type") ?? "text/event-stream" },
        });
      },
    },
  },
});
