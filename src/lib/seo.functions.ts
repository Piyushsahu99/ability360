import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export type CompetitionSeo = {
  id: string;
  title: string;
  summary: string;
  organisation: string;
  location: string;
  mode: string;
  starts_on: string | null;
  ends_on: string | null;
};

export const getCompetitionSeo = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<CompetitionSeo | null> => {
    const client = publicClient();
    if (!client) return null;
    const { data: row } = await client
      .from("competitions")
      .select("id, title, summary, organisation, location, mode, starts_on, ends_on")
      .eq("id", data.id)
      .eq("is_published", true)
      .maybeSingle();
    return row ? { ...row, mode: String(row.mode) } : null;
  });
