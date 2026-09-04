import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { GraduationCap, Layers, Target, TrendingUp } from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { InstitutionFilters } from "@/components/institution-filters";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { institutionNav } from "@/lib/nav";
import {
  cohortBreakdown,
  emptyFilters,
  filterDirectory,
  institutionDirectoryQueryOptions,
  readinessBands,
  summarise,
} from "@/lib/institution";

export const Route = createFileRoute("/_authenticated/institution/cohorts")({
  head: () => ({
    meta: [
      { title: "Cohort readiness — ABILITY360" },
      { name: "description", content: "Compare cohorts by department and year on readiness, roadmap progress and outcomes." },
      { property: "og:title", content: "Cohort readiness — ABILITY360" },
      { property: "og:description", content: "Department and year cohorts with live readiness and placement data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CohortsPage,
});

function CohortsPage() {
  const { data } = useQuery(institutionDirectoryQueryOptions);
  const [filters, setFilters] = useState(emptyFilters);
  const rows = data ?? [];
  const filtered = useMemo(() => filterDirectory(rows, filters), [rows, filters]);
  const cohorts = cohortBreakdown(filtered);
  const summary = summarise(filtered);
  const bands = readinessBands(filtered);

  return (
    <DashboardShell
      role="institution"
      title="Cohorts"
      subtitle="Department and year groups, scored on live skill readiness and roadmap progress."
      nav={institutionNav("/institution/cohorts")}
    >
      <InstitutionFilters rows={rows} filters={filters} onChange={setFilters} showSearch={false} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cohorts" value={String(cohorts.length)} hint="Department × year groups" icon={Layers} />
        <StatCard label="Students covered" value={String(summary.students)} hint={`${summary.onboarded} onboarded`} icon={GraduationCap} />
        <StatCard label="Average readiness" value={`${summary.avgReadiness}%`} hint="Skills matched to target roles" icon={TrendingUp} />
        <StatCard label="Roadmap active" value={String(summary.roadmapActive)} hint="Students completing roadmap tasks" icon={Target} />
      </div>

      <PanelCard title="Placement readiness" description="Distribution of students across career stages.">
        <ul className="space-y-4">
          {bands.map((band) => (
            <li key={band.label}>
              <div className="flex items-center justify-between text-sm">
                <span>{band.label}</span>
                <span className="text-muted-foreground">
                  {band.count} students · {band.percent}%
                </span>
              </div>
              <Progress value={band.percent} className="mt-2" aria-label={`${band.label} share`} />
            </li>
          ))}
        </ul>
      </PanelCard>

      <PanelCard title="Cohort comparison" description="Readiness, roadmap engagement and outcomes per cohort.">
        {cohorts.length === 0 ? (
          <EmptyState message="No cohorts match these filters yet." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {cohorts.map((cohort) => (
              <li key={cohort.key} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{cohort.department}</p>
                  <Badge variant="secondary">{cohort.year ? `Year ${cohort.year}` : "Year not set"}</Badge>
                </div>
                <Progress value={cohort.summary.avgReadiness} className="mt-3" aria-label={`${cohort.department} readiness`} />
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <dt>Students</dt>
                    <dd className="text-sm font-medium text-foreground">{cohort.summary.students}</dd>
                  </div>
                  <div>
                    <dt>Avg readiness</dt>
                    <dd className="text-sm font-medium text-foreground">{cohort.summary.avgReadiness}%</dd>
                  </div>
                  <div>
                    <dt>Applications</dt>
                    <dd className="text-sm font-medium text-foreground">{cohort.summary.applications}</dd>
                  </div>
                  <div>
                    <dt>Placements</dt>
                    <dd className="text-sm font-medium text-foreground">{cohort.summary.placements}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </DashboardShell>
  );
}
