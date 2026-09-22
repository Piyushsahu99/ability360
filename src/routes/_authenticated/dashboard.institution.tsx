import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Briefcase, Building2, GraduationCap, TrendingUp, Users } from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { skillDemandQueryOptions, skillGaps, topSkills } from "@/lib/demand";
import { institutionNav } from "@/lib/nav";
import {
  cohortBreakdown,
  departmentBreakdown,
  institutionDirectoryQueryOptions,
  institutionPartnershipsQueryOptions,
  readinessBands,
  summarise,
} from "@/lib/institution";
import { useMe } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard/institution")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Institution dashboard — ABILITY360" },
      { name: "description", content: "Track cohort readiness, faculty activity and placement outcomes." },
      { property: "og:title", content: "Institution dashboard — ABILITY360" },
      { property: "og:description", content: "College career intelligence: readiness, cohorts, applications and placements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstitutionDashboard,
});

function InstitutionDashboard() {
  const { data: me } = useMe();
  const { data: demand } = useQuery(skillDemandQueryOptions);
  const { data: directory, isLoading } = useQuery(institutionDirectoryQueryOptions);
  const { data: partners } = useQuery(institutionPartnershipsQueryOptions);

  const rows = directory ?? [];
  const summary = summarise(rows);
  const bands = readinessBands(rows);
  const departments = departmentBreakdown(rows).slice(0, 5);
  const cohorts = cohortBreakdown(rows).slice(0, 4);
  const topPartners = [...(partners ?? [])]
    .filter((row) => Number(row.applications) > 0)
    .sort((a, b) => Number(b.offers) - Number(a.offers) || Number(b.applications) - Number(a.applications))
    .slice(0, 5);

  const demandRows = demand ?? [];
  const top = topSkills(demandRows, 5);
  const gaps = skillGaps(demandRows, 4);

  return (
    <DashboardShell
      role="institution"
      title={me?.fullName ? `${me.fullName.split(" ")[0]}'s institution workspace` : "Institution workspace"}
      subtitle="One view of cohort readiness, student outcomes and employer engagement."
      nav={institutionNav("/dashboard/institution")}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Enrolled students"
          value={String(summary.students)}
          hint={`${summary.onboarded} completed onboarding`}
          icon={GraduationCap}
        />
        <StatCard label="Average readiness" value={`${summary.avgReadiness}%`} hint="Skills matched to target roles" icon={TrendingUp} />
        <StatCard label="Active applications" value={String(summary.activeApplications)} hint={`${summary.applications} total sent`} icon={Briefcase} />
        <StatCard label="Placements" value={String(summary.placements)} hint={`${summary.placementRate}% of students placed`} icon={Award} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PanelCard
            title="Placement readiness"
            description="Distribution of students across career stages."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/institution/cohorts">Open cohorts</Link>
              </Button>
            }
          >
            {isLoading ? (
              <EmptyState message="Loading college data…" />
            ) : summary.students === 0 ? (
              <EmptyState
                title="No students linked yet"
                description="Students appear here once they register with your college."
              />
            ) : (
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
            )}
          </PanelCard>

          <PanelCard
            title="Departments"
            description="Readiness and outcomes by department."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/institution/students">Student directory</Link>
              </Button>
            }
          >
            {departments.length === 0 ? (
              <EmptyState message="Department data appears once students complete onboarding." />
            ) : (
              <ul className="space-y-3">
                {departments.map((item) => (
                  <li key={item.department} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{item.department}</span>
                      <span className="text-muted-foreground">
                        {item.summary.students} students · {item.summary.placements} placements
                      </span>
                    </div>
                    <Progress value={item.summary.avgReadiness} className="mt-2" aria-label={`${item.department} readiness`} />
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard
            title="Cohorts"
            description="Department and year groups with the highest activity."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/institution/outcomes">Outcomes</Link>
              </Button>
            }
          >
            {cohorts.length === 0 ? (
              <EmptyState message="Cohorts form automatically from department and year of study." />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {cohorts.map((cohort) => (
                  <li key={cohort.key} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{cohort.department}</span>
                      <Badge variant="secondary">{cohort.year ? `Year ${cohort.year}` : "Year not set"}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {cohort.summary.students} students · {cohort.summary.avgReadiness}% ready · {cohort.summary.applications} applications
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard
            title="Industry skill demand"
            description="Aggregated employer requirements — no employer details."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/institution/skill-demand">Open intelligence</Link>
              </Button>
            }
          >
            {top.length === 0 ? (
              <EmptyState message="Demand data appears once employers publish opportunities." />
            ) : (
              <ul className="space-y-2">
                {top.map((row) => (
                  <li
                    key={row.skill_id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <span className="font-medium">{row.skill_name}</span>
                    <Badge variant="secondary">{row.demand_count} openings</Badge>
                  </li>
                ))}
              </ul>
            )}
            {gaps.length > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Top cohort gaps: {gaps.map((row) => row.skill_name).join(", ")}
              </p>
            ) : null}
          </PanelCard>

          <PanelCard
            title="Industry partnerships"
            description="Employers your students are engaging with."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/institution/partners">All partners</Link>
              </Button>
            }
          >
            {topPartners.length === 0 ? (
              <EmptyState message="Partners appear once your students apply to employer opportunities." />
            ) : (
              <ul className="space-y-2">
                {topPartners.map((row) => (
                  <li key={row.organisation} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                    <span className="font-medium">{row.organisation}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.applications} applications · {row.offers} offers
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard title="Career goals" description="Students with a chosen target role.">
            <p className="text-2xl font-semibold">{summary.withTargetRole}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              of {summary.students} students have selected a career goal and started a roadmap.
            </p>
            <Progress
              value={summary.students === 0 ? 0 : Math.round((summary.withTargetRole / summary.students) * 100)}
              className="mt-3"
              aria-label="Share of students with a target role"
            />
          </PanelCard>

          <PanelCard title="Verified evidence" description="Skills verified through assessments or mentors.">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-teal" aria-hidden="true" />
              <p className="text-2xl font-semibold">{summary.verifiedSkills}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.roadmapActive} students are actively completing roadmap tasks.
            </p>
          </PanelCard>

          <PanelCard title="Employer directory" description="Browse live opportunities open to your students.">
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/opportunities">
                <Building2 aria-hidden="true" />
                Open opportunities
              </Link>
            </Button>
          </PanelCard>
        </div>
      </div>
    </DashboardShell>
  );
}
