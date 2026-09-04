import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  School,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  coveragePercent,
  gapScore,
  growingSkills,
  growthPercent,
  roleDemandQueryOptions,
  skillCategoryLabels,
  skillDemandQueryOptions,
  skillGaps,
  topSkills,
} from "@/lib/demand";
import { opportunityTypeLabels } from "@/lib/opportunities";

export const Route = createFileRoute("/_authenticated/institution/skill-demand")({
  head: () => ({
    meta: [
      { title: "Industry skill demand — ABILITY360" },
      {
        name: "description",
        content:
          "Aggregated employer skill demand, growing skills, most demanded roles and cohort skill gaps.",
      },
      { property: "og:title", content: "Industry skill demand — ABILITY360" },
      {
        property: "og:description",
        content: "See what industry is hiring for and where your cohort has gaps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SkillDemandPage,
});

const nav = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard/institution" },
  { label: "Skill demand", icon: TrendingUp, to: "/institution/skill-demand", active: true },
  { label: "Cohorts", icon: Users },
  { label: "Students", icon: GraduationCap },
  { label: "Faculty", icon: School },
  { label: "Employers", icon: Building2 },
  { label: "Outcomes", icon: LineChart },
];

function SkillDemandPage() {
  const { data: skills, isLoading } = useQuery(skillDemandQueryOptions);
  const { data: roles } = useQuery(roleDemandQueryOptions);

  const rows = skills ?? [];
  const roleRows = roles ?? [];
  const top = topSkills(rows);
  const growing = growingSkills(rows);
  const gaps = skillGaps(rows);
  const totalRequirements = rows.reduce((sum, row) => sum + row.demand_count, 0);

  return (
    <DashboardShell
      role="institution"
      title="Industry skill demand intelligence"
      subtitle="Aggregated employer requirements across every published opportunity."
      nav={nav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Skills in demand"
          value={String(rows.length)}
          hint="Mapped to the shared skill catalogue"
          icon={TrendingUp}
        />
        <StatCard
          label="Skill requirements"
          value={String(totalRequirements)}
          hint="Across all live opportunities"
          icon={LineChart}
        />
        <StatCard
          label="Roles tracked"
          value={String(roleRows.length)}
          hint="Distinct role titles hiring now"
          icon={Building2}
        />
        <StatCard
          label="Priority gaps"
          value={String(gaps.length)}
          hint="Demand exceeds cohort supply"
          icon={GraduationCap}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PanelCard
            title="Top demanded skills"
            description="Ranked by how many live opportunities require the skill."
          >
            {isLoading ? (
              <EmptyState message="Loading demand data…" />
            ) : top.length === 0 ? (
              <EmptyState
                title="No demand signal yet"
                description="Skill demand appears once employers publish opportunities with listed skills."
              />
            ) : (
              <ul className="space-y-4">
                {top.map((row) => (
                  <li key={row.skill_id}>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{row.skill_name}</span>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">{skillCategoryLabels[row.category]}</Badge>
                        <span className="text-muted-foreground">
                          {row.demand_count} opening{row.demand_count === 1 ? "" : "s"}
                        </span>
                      </span>
                    </div>
                    <Progress
                      value={Math.round((row.demand_count / top[0].demand_count) * 100)}
                      className="mt-2"
                      aria-label={`${row.skill_name} demand share`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard
            title="Most demanded roles"
            description="Role titles employers are hiring for, with the number of hiring organisations."
          >
            {roleRows.length === 0 ? (
              <EmptyState
                title="No roles published yet"
                description="Role demand builds up as employers post opportunities."
              />
            ) : (
              <ul className="space-y-2">
                {roleRows.slice(0, 8).map((row) => (
                  <li
                    key={row.role_title}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <span className="font-medium">{row.role_title}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {opportunityTypeLabels[row.opportunity_type]}
                      </Badge>
                      <span className="text-muted-foreground">
                        {row.demand_count} opening{row.demand_count === 1 ? "" : "s"} ·{" "}
                        {row.employer_count} employer{row.employer_count === 1 ? "" : "s"}
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round(Number(row.remote_share) * 100)}% remote/hybrid
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard
            title="Growing skills"
            description="Demand in the last 90 days versus the 90 days before."
          >
            {growing.length === 0 ? (
              <EmptyState message="No growth trend detected yet." />
            ) : (
              <ul className="space-y-2">
                {growing.map((row) => (
                  <li
                    key={row.skill_id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <span className="font-medium">{row.skill_name}</span>
                    <Badge variant="secondary">+{growthPercent(row)}%</Badge>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard
            title="Cohort skill gaps"
            description="Where employer demand outpaces students holding the skill."
          >
            {gaps.length === 0 ? (
              <EmptyState message="No significant gaps right now." />
            ) : (
              <ul className="space-y-4">
                {gaps.map((row) => (
                  <li key={row.skill_id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{row.skill_name}</span>
                      <span className="text-muted-foreground">gap {gapScore(row)}</span>
                    </div>
                    <Progress
                      value={coveragePercent(row)}
                      className="mt-2"
                      aria-label={`${row.skill_name} cohort coverage`}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.student_supply} student{row.student_supply === 1 ? "" : "s"} ready ·{" "}
                      {row.demand_count} required
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard title="How this data is handled" description="Privacy by design.">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Only aggregated counts are shown. No employer names, contacts, salaries or individual
              postings are exposed, and student data is counted, never listed.
            </p>
          </PanelCard>
        </div>
      </div>
    </DashboardShell>
  );
}
