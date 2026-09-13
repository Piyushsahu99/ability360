import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/hooks/crawl-resources")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;

        try {
          const { runResourceCrawl } = await import("@/lib/crawler.server");
          const summary = await runResourceCrawl();
          return new Response(JSON.stringify(summary), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("[crawl-resources]", error);
          return new Response(JSON.stringify({ status: "error", message: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
