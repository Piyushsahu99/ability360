import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  School,
  TrendingUp,
  Users,
} from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { skillDemandQueryOptions, skillGaps, topSkills } from "@/lib/demand";
import { useMe } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard/institution")({
  head: () => ({
    meta: [
      { title: "Institution dashboard — ABILITY360" },
      { name: "description", content: "Track cohort readiness, faculty activity and placement outcomes." },
    ],
  }),
  component: InstitutionDashboard,
});

const nav = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard/institution", active: true },
  { label: "Skill demand", icon: TrendingUp, to: "/institution/skill-demand" },
  { label: "Cohorts", icon: Users },
  { label: "Students", icon: GraduationCap },
  { label: "Faculty", icon: School },
  { label: "Employers", icon: Building2 },
  { label: "Outcomes", icon: LineChart },
];

const readiness = [
  { label: "Discover stage", value: 0 },
  { label: "Develop stage", value: 0 },
  { label: "Demonstrate stage", value: 0 },
  { label: "Placement ready", value: 0 },
];

function InstitutionDashboard() {
  const { data: me } = useMe();
  const { data: demand } = useQuery(skillDemandQueryOptions);
  const rows = demand ?? [];
  const top = topSkills(rows, 5);
  const gaps = skillGaps(rows, 4);

  return (
    <DashboardShell
      role="institution"
      title={me?.fullName ? `${me.fullName.split(" ")[0]}'s institution workspace` : "Institution workspace"}
      subtitle="One view of cohort readiness, faculty mentoring and employer engagement."
      nav={nav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrolled students" value="0" hint="Invite your first cohort" icon={GraduationCap} />
        <StatCard label="Active cohorts" value="0" hint="Group by year and branch" icon={Users} />
        <StatCard label="Faculty mentors" value="0" hint="Assign mentors to students" icon={School} />
        <StatCard label="Employer partners" value="0" hint="Connect with industry" icon={Building2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PanelCard title="Placement readiness" description="Distribution of students across career stages.">
            <ul className="space-y-4">
              {readiness.map((item) => (
                <li key={item.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="mt-2" aria-label={`${item.label} share`} />
                </li>
              ))}
            </ul>
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

          <PanelCard title="Faculty activity" description="Mentoring and endorsements this month.">
            <EmptyState message="No faculty activity recorded yet." />
          </PanelCard>
          <PanelCard title="Recent outcomes" description="Offers, internships and conversions.">
            <EmptyState message="Outcomes appear once students start applying." />
          </PanelCard>
        </div>
      </div>
    </DashboardShell>
  );
}
