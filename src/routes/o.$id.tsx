import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Wallet } from "lucide-react";

import { OpportunityShareActions } from "@/components/opportunity-share";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDateIN } from "@/lib/india";
import { opportunityTypeLabels, workModeLabels } from "@/lib/opportunities";
import { useSession } from "@/lib/auth";

const opportunityQuery = (id: string) =>
  queryOptions({
    queryKey: ["opportunity", id],
    queryFn: async () => {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const Route = createFileRoute("/o/$id")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Shared opportunity — ABILITY360" },
      { name: "description", content: "A friend shared a career opportunity with you on ABILITY360." },
      { property: "og:title", content: "A friend shared an opportunity with you — ABILITY360" },
      { property: "og:description", content: "Join ABILITY360 to view the details and apply on the official website." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SharedOpportunityPage,
});

function SharedOpportunityPage() {
  const { id } = Route.useParams();
  const { data: item, isPending, isError } = useQuery(opportunityQuery(id));
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-16">
        <p className="text-sm font-medium text-primary">Shared with you on ABILITY360</p>
        {isPending ? (
          <p className="mt-6 text-muted-foreground">Loading opportunity…</p>
        ) : isError || !item ? (
          <div className="mt-6">
            <h1 className="text-3xl">This opportunity is no longer available</h1>
            <p className="mt-3 text-muted-foreground">It may have closed or been removed.</p>
            <Button asChild className="mt-6"><Link to="/opportunities">Browse current opportunities</Link></Button>
          </div>
        ) : (
          <article className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{opportunityTypeLabels[item.type]}</Badge>
              <Badge variant="outline">{workModeLabels[item.mode]}</Badge>
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl">{item.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{item.organisation}</p>
            <dl className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <div className="flex items-center gap-2"><MapPin className="size-4" aria-hidden="true" /><dt className="sr-only">Location</dt><dd>{item.location}</dd></div>
              <div className="flex items-center gap-2"><Wallet className="size-4" aria-hidden="true" /><dt className="sr-only">Compensation</dt><dd>{item.stipend || "Not specified"}</dd></div>
              <div className="flex items-center gap-2"><CalendarDays className="size-4" aria-hidden="true" /><dt className="sr-only">Apply by</dt><dd>{item.deadline ? formatDateIN(item.deadline) : "Rolling"}</dd></div>
            </dl>
            <p className="mt-6 whitespace-pre-line leading-relaxed">{item.description}</p>
            {!session && (
              <div className="mt-8 rounded-lg border border-border bg-card p-5">
                <p className="font-medium">Create a free account to continue</p>
                <p className="mt-1 text-sm text-muted-foreground">After signing up you'll come straight back here and can open the official website to apply.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild><Link to="/register" search={{ next: `/o/${item.id}` }}>Create account</Link></Button>
                  <Button asChild variant="outline"><Link to="/login" search={{ next: `/o/${item.id}` }}>Sign in</Link></Button>
                </div>
              </div>
            )}
            <div className="mt-6">
              {session || !item.apply_url ? <OpportunityShareActions opportunity={item} /> : null}
              {session && !item.apply_url && (
                <Button asChild variant="link" className="px-0"><Link to="/opportunities" hash={`opportunity-${item.id}`}>Apply on ABILITY360</Link></Button>
              )}
            </div>
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
