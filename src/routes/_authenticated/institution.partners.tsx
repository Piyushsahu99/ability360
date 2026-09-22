import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, HeartHandshake, Send, Trophy } from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { institutionNav } from "@/lib/nav";
import { institutionPartnershipsQueryOptions } from "@/lib/institution";

export const Route = createFileRoute("/_authenticated/institution/partners")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Industry partnerships — ABILITY360" },
      { name: "description", content: "See which employers hire from your college and how your students progress with them." },
      { property: "og:title", content: "Industry partnerships — ABILITY360" },
      { property: "og:description", content: "Employer engagement, applications and offers for your college." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const { data } = useQuery(institutionPartnershipsQueryOptions);
  const rows = [...(data ?? [])].sort(
    (a, b) => Number(b.offers) - Number(a.offers) || Number(b.applications) - Number(a.applications),
  );
  const engaged = rows.filter((row) => Number(row.applications) > 0);
  const total = (pick: (row: (typeof rows)[number]) => number) => rows.reduce((sum, row) => sum + pick(row), 0);

  return (
    <DashboardShell
      role="institution"
      title="Industry partnerships"
      subtitle="Employers publishing opportunities, and how your students are progressing with each of them."
      nav={institutionNav("/institution/partners")}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Employers listed" value={String(rows.length)} hint="Publishing live opportunities" icon={Building2} />
        <StatCard label="Active partners" value={String(engaged.length)} hint="Your students have applied" icon={HeartHandshake} />
        <StatCard label="Applications sent" value={String(total((row) => Number(row.applications)))} hint="From your college" icon={Send} />
        <StatCard label="Offers received" value={String(total((row) => Number(row.offers)))} hint="Selected or completed" icon={Trophy} />
      </div>

      <PanelCard title="Partner engagement" description="Opportunity volume and conversion per employer.">
        {rows.length === 0 ? (
          <EmptyState
            title="No employer activity yet"
            description="Partner organisations appear here as soon as they publish opportunities."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <caption className="sr-only">Industry partnerships</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="py-2 pr-3">Organisation</th>
                  <th scope="col" className="py-2 pr-3">Opportunities</th>
                  <th scope="col" className="py-2 pr-3">Applications</th>
                  <th scope="col" className="py-2 pr-3">Shortlisted</th>
                  <th scope="col" className="py-2 pr-3">Interviews</th>
                  <th scope="col" className="py-2">Offers</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.organisation} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3">
                      <span className="font-medium">{row.organisation}</span>
                      {row.inclusive ? (
                        <Badge variant="secondary" className="ml-2">
                          Inclusive employer
                        </Badge>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">{row.opportunity_count}</td>
                    <td className="py-2 pr-3">{row.applications}</td>
                    <td className="py-2 pr-3">{row.shortlisted}</td>
                    <td className="py-2 pr-3">{row.interviews}</td>
                    <td className="py-2">{row.offers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </DashboardShell>
  );
}
