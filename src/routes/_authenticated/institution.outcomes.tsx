import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Award, Briefcase, CalendarCheck, GraduationCap } from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { InstitutionFilters } from "@/components/institution-filters";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { institutionNav } from "@/lib/nav";
import {
  departmentBreakdown,
  emptyFilters,
  filterDirectory,
  institutionDirectoryQueryOptions,
  summarise,
} from "@/lib/institution";

export const Route = createFileRoute("/_authenticated/institution/outcomes")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Applications, internships and placements — ABILITY360" },
      { name: "description", content: "Track your college's applications, interviews, internships and placement outcomes." },
      { property: "og:title", content: "Placement outcomes — ABILITY360" },
      { property: "og:description", content: "Live application pipeline, internship conversions and placement rate by department." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OutcomesPage,
});

function OutcomesPage() {
  const { data } = useQuery(institutionDirectoryQueryOptions);
  const [filters, setFilters] = useState(emptyFilters);
  const rows = data ?? [];
  const filtered = useMemo(() => filterDirectory(rows, filters), [rows, filters]);
  const summary = summarise(filtered);
  const departments = departmentBreakdown(filtered);
  const mostActive = [...filtered]
    .filter((row) => Number(row.applications_total) > 0)
    .sort((a, b) => Number(b.applications_total) - Number(a.applications_total))
    .slice(0, 8);

  return (
    <DashboardShell
      role="institution"
      title="Applications, internships and placements"
      subtitle="The live outcome pipeline for your college, aggregated from student applications."
      nav={institutionNav("/institution/outcomes")}
    >
      <InstitutionFilters rows={rows} filters={filters} onChange={setFilters} showSearch={false} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Applications" value={String(summary.applications)} hint={`${summary.activeApplications} still active`} icon={Briefcase} />
        <StatCard label="Interview stage" value={String(summary.interviews)} hint="Students currently interviewing" icon={CalendarCheck} />
        <StatCard label="Internships" value={String(summary.internships)} hint="Internship offers and completions" icon={GraduationCap} />
        <StatCard label="Placements" value={String(summary.placements)} hint={`${summary.placementRate}% of students placed`} icon={Award} />
      </div>

      <PanelCard title="Outcomes by department" description="Where applications convert into offers.">
        {departments.length === 0 ? (
          <EmptyState message="No outcome data for these filters yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Outcomes by department</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="py-2 pr-3">Department</th>
                  <th scope="col" className="py-2 pr-3">Students</th>
                  <th scope="col" className="py-2 pr-3">Applications</th>
                  <th scope="col" className="py-2 pr-3">Interviews</th>
                  <th scope="col" className="py-2 pr-3">Internships</th>
                  <th scope="col" className="py-2 pr-3">Placements</th>
                  <th scope="col" className="py-2">Placement rate</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((item) => (
                  <tr key={item.department} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3 font-medium">{item.department}</td>
                    <td className="py-2 pr-3">{item.summary.students}</td>
                    <td className="py-2 pr-3">{item.summary.applications}</td>
                    <td className="py-2 pr-3">{item.summary.interviews}</td>
                    <td className="py-2 pr-3">{item.summary.internships}</td>
                    <td className="py-2 pr-3">{item.summary.placements}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Progress value={item.summary.placementRate} className="w-24" aria-label={`${item.department} placement rate`} />
                        <span className="text-xs text-muted-foreground">{item.summary.placementRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>

      <PanelCard title="Most active applicants" description="Students driving your placement pipeline right now.">
        {mostActive.length === 0 ? (
          <EmptyState message="No students have applied to opportunities yet." />
        ) : (
          <ul className="space-y-2">
            {mostActive.map((row) => (
              <li key={row.student_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{row.full_name || "Unnamed student"}</p>
                  <p className="text-xs text-muted-foreground">
                    {[row.department, row.year_of_study ? `Year ${row.year_of_study}` : null, row.target_role_title]
                      .filter(Boolean)
                      .join(" · ") || "Profile incomplete"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{row.applications_total} applications</Badge>
                  {Number(row.interviews) > 0 ? <Badge variant="outline">{row.interviews} interviews</Badge> : null}
                  {Number(row.placements) > 0 ? <Badge>{row.placements} offers</Badge> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </DashboardShell>
  );
}
