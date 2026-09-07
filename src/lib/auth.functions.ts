import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

/* Best-effort abuse brake. Workers are stateless, so this only slows down
   bursts hitting the same instance — the real limits live in the auth service. */
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export const checkEmailRegistered = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => emailSchema.parse(input))
  .handler(async ({ data }): Promise<{ registered: boolean; throttled?: boolean }> => {
    const ip =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (rateLimited(`ip:${ip}`) || rateLimited(`email:${data.email}`)) {
      return { registered: false, throttled: true };
    }

    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) return { registered: false };

    try {
      const response = await fetch(
        `${url}/auth/v1/admin/users?page=1&per_page=50&filter=${encodeURIComponent(data.email)}`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } },
      );
      if (!response.ok) return { registered: false };
      const payload = (await response.json()) as { users?: { email?: string | null }[] };
      const registered = (payload.users ?? []).some(
        (user) => (user.email ?? "").toLowerCase() === data.email,
      );
      return { registered };
    } catch (error) {
      console.error("email existence check failed", error);
      return { registered: false };
    }
  });
