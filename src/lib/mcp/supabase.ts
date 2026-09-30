import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

type TokenCtx = { getToken: () => string | undefined | null };

function base() {
  const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
  if (!url || !key) throw new Error("Backend is not configured.");
  return { url, key };
}

/** Client that acts as the calling user, so row-level security applies. */
export function supabaseForUser(ctx: TokenCtx) {
  const token = ctx.getToken();
  if (!token) throw new Error("Sign-in required.");
  const { url, key } = base();
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export function userIdFrom(ctx: TokenCtx): string {
  const token = ctx.getToken() ?? "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.sub === "string") return payload.sub;
  } catch {
    /* fall through */
  }
  throw new Error("Sign-in required.");
}
