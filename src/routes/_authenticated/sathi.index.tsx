import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { createSathiThread, sathiThreadsQueryOptions } from "@/lib/sathi";

export const Route = createFileRoute("/_authenticated/sathi/")({
  head: () => ({
    meta: [
      { title: "Ask Sathi — ABILITY360" },
      { name: "description", content: "Open your private Sathi conversation for career guidance and ABILITY360 opportunities." },
      { property: "og:title", content: "Ask Sathi — ABILITY360" },
      { property: "og:description", content: "Private career guidance and opportunity searches with Sathi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SathiIndex,
});

/** Opens the most recent chat, or starts the first one exactly once. */
function SathiIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const threads = await queryClient.fetchQuery(sathiThreadsQueryOptions);
        const id = threads[0]?.id ?? (await createSathiThread());
        await queryClient.invalidateQueries({ queryKey: sathiThreadsQueryOptions.queryKey });
        navigate({ to: "/sathi/$threadId", params: { threadId: id }, replace: true });
      } catch {
        setError("Could not open Sathi. Please refresh the page.");
      }
    })();
  }, [navigate, queryClient]);

  return <p className="text-sm text-muted-foreground">{error ?? "Opening Sathi…"}</p>;
}
