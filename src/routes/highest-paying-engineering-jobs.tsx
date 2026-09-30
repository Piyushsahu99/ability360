import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { careerRolesQueryOptions, formatLpa } from "@/lib/careers";

const URL = "https://ability360.lovable.app/highest-paying-engineering-jobs";
const TITLE = "Highest-Paying Engineering Jobs in India (2026) — ABILITY360";
const DESC =
  "Engineering careers in India ranked by salary: fresher and experienced pay in LPA, key skills, demand and how to get there.";

export const Route = createFileRoute("/highest-paying-engineering-jobs")({
  staticData: { sitemap: true },
  loader: ({ context }) => context.queryClient.ensureQueryData(careerRolesQueryOptions),
  head: () => ({
    links: [{ rel: "canonical", href: URL }],
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(careerRolesQueryOptions);
  const roles = [...data]
    .sort((a, b) => b.experienced_max_lpa - a.experienced_max_lpa || b.fresher_max_lpa - a.fresher_max_lpa)
    .slice(0, 20);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <article className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
          <h1 className="text-2xl font-bold sm:text-4xl">Highest-paying engineering jobs in India</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            The top engineering roles on ABILITY360, ranked by experienced salary. Figures are typical
            ranges in lakhs per annum (LPA) and vary by city, company and skills.
          </p>
          <ol className="mt-8 space-y-4">
            {roles.map((role, i) => (
              <li key={role.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold">
                    {i + 1}. {role.title}
                  </h2>
                  <Badge variant="outline">{role.demand} demand</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {role.course} · {role.branch}
                </p>
                <p className="mt-2 text-sm">{role.summary}</p>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Fresher</dt>
                    <dd className="font-medium">{formatLpa(role.fresher_min_lpa, role.fresher_max_lpa)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Experienced ({role.experienced_label})</dt>
                    <dd className="font-medium">
                      {formatLpa(role.experienced_min_lpa, role.experienced_max_lpa)}
                    </dd>
                  </div>
                </dl>
                {role.skills.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Key skills: {role.skills.slice(0, 6).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/roles">Explore all career roles</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/opportunities">Browse opportunities</Link>
            </Button>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
