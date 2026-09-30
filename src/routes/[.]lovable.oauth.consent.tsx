import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type Details = { client?: { name?: string; client_name?: string }; client_name?: string; scope?: string; redirect_url?: string; redirect_uri?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const oauth = () => (supabase.auth as any).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Allow access — ABILITY360" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Approve an AI assistant's access to your ABILITY360 account." },
    ],
  }),
  component: ConsentPage,
});

function ConsentPage() {
  const { authorization_id } = Route.useSearch();
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!authorization_id) return setError("This link is missing its request details.");
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const next = window.location.pathname + window.location.search;
        window.location.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      const res = await oauth().getAuthorizationDetails(authorization_id);
      if (res.error) return setError(res.error.message);
      const d = res.data as Details;
      const redirect = d.redirect_url ?? (d as { redirect_to?: string }).redirect_to;
      if (redirect && !d.client && !d.client_name) {
        window.location.assign(redirect);
        return;
      }
      setDetails(d);
    })();
  }, [authorization_id]);

  async function decide(approve: boolean) {
    setBusy(true);
    const res = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (res.error) {
      setBusy(false);
      setError(res.error.message);
      return;
    }
    const to = res.data?.redirect_url ?? res.data?.redirect_to;
    if (to) window.location.assign(to);
  }

  const name = details?.client?.name ?? details?.client?.client_name ?? details?.client_name ?? "An AI assistant";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
          <CardTitle className="mt-2">Allow access to ABILITY360?</CardTitle>
          <CardDescription>
            {details
              ? `${name} wants to search opportunities and career roles and read your applications and goals, as you.`
              : "Checking the request…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
          {!details && !error && <Loader2 className="animate-spin" aria-label="Loading" />}
          {details && (
            <div className="flex gap-3">
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>Allow</Button>
              <Button className="flex-1" variant="outline" disabled={busy} onClick={() => decide(false)}>Deny</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
