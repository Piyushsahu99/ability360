import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

const SITE = "https://ability360.lovable.app";
const STATIC = ["/", "/opportunities", "/roles", "/resources", "/competitions", "/community", "/experience", "/highest-paying-engineering-jobs", "/government-jobs"];

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        const urls: string[] = STATIC.map((p) => SITE + p);
        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (url && key) {
          const db = createClient<Database>(url, key, {
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          });
          const now = new Date().toISOString();
          const [c, r] = await Promise.all([
            db.from("competitions").select("id").eq("is_published", true).limit(1000),
            db
              .from("resources")
              .select("slug")
              .eq("is_published", true)
              .or(`expires_at.is.null,expires_at.gt.${now}`)
              .limit(1000),
          ]);
          for (const row of c.data ?? []) urls.push(`${SITE}/competitions/${row.id}`);
          for (const row of r.data ?? []) urls.push(`${SITE}/resources/${encodeURIComponent(row.slug)}`);
        }
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${u.replace(/&/g, "&amp;")}</loc></url>`)
          .join("\n")}\n</urlset>\n`;
        return new Response(body, {
          headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});
