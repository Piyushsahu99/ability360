import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type SathiDb = SupabaseClient<Database>;
export type SathiUser = { db: SathiDb; userId: string };

/** Build a backend client that acts as the caller, so row-level security applies. */
function clientForToken(token: string): SathiDb {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Backend is not configured.");
  return createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

/** Verify a user access token with the auth server. Returns null when it is not valid. */
export async function verifySathiToken(token: string | null | undefined): Promise<SathiUser | null> {
  if (!token || token.length > 4096 || token.split(".").length !== 3) return null;
  const db = clientForToken(token);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  return { db, userId: data.user.id };
}

export function bearerFrom(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

/** Simple per-user limits backed by the user's own stored messages. */
export async function checkSathiRateLimit(user: SathiUser): Promise<string | null> {
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [minute, day] = await Promise.all([
    user.db
      .from("sathi_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.userId)
      .eq("role", "user")
      .gt("created_at", minuteAgo),
    user.db
      .from("sathi_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.userId)
      .eq("role", "user")
      .gt("created_at", dayAgo),
  ]);
  if ((minute.count ?? 0) >= 10) return "You're sending messages quickly. Please wait a minute and try again.";
  if ((day.count ?? 0) >= 200) return "You've reached today's Sathi limit. Please come back tomorrow.";
  return null;
}
