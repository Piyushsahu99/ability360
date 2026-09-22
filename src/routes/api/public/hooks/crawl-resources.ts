import { createFileRoute } from "@tanstack/react-router";

function authorise(request: Request): Response | null {
  const expected = process.env["CRAWL_HOOK_SECRET"];
  if (!expected) return new Response("Server configuration error", { status: 500 });

  const token = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token || token.length !== expected.length) return new Response("Unauthorized", { status: 401 });

  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0 ? null : new Response("Unauthorized", { status: 401 });
}

export const Route = createFileRoute("/api/public/hooks/crawl-resources")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = authorise(request);
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
