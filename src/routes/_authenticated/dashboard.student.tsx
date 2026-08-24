import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Briefcase,
  CalendarClock,
  Compass,
  GraduationCap,
  LayoutDashboard,
  Target,
  UserRound,
} from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { formatDeadline, opportunitiesQueryOptions, opportunityTypeLabels } from "@/lib/opportunities";

export const Route = createFileRoute("/_authenticated/dashboard/student")({
  beforeLoad: async ({ context }) => {
    const userId = (context as { user?: { id: string } }).user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("student_profiles")
      .select("onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle();
    if (!data?.onboarding_completed_at) throw redirect({ to: "/onboarding" });
  },
  head: () => ({
    meta: [
      { title: "Student dashboard — ABILITY360" },
      { name: "description", content: "Track your readiness, skills and matched opportunities." },
    ],
  }),
  component: StudentDashboard,
});

const nav = [
  { label: "Overview", icon: LayoutDashboard, active: true, to: "/dashboard/student" },
  { label: "Student DNA", icon: UserRound, to: "/dna" },
  { label: "Skills", icon: Target, to: "/assessment" },
  { label: "Learning", icon: BookOpen },
  { label: "Applications", icon: Briefcase },
  { label: "Opportunities", icon: Compass, to: "/opportunities" },
];

const skills = [
  { name: "Programming fundamentals", value: 72 },
  { name: "Communication", value: 58 },
  { name: "Domain projects", value: 40 },
];

function StudentDashboard() {
  const { data: me } = useMe();
  const { data: opportunities, isPending } = useQuery(opportunitiesQueryOptions);
  const recommended = (opportunities ?? []).slice(0, 3);

  return (
    <DashboardShell
      role="student"
      title={`Welcome${me?.fullName ? `, ${me.fullName.split(" ")[0]}` : ""}`}
      subtitle="Your semester-by-semester path from learning to first career."
      nav={nav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Profile completeness" value="45%" hint="Add projects to reach 70%" icon={UserRound} />
        <StatCard label="Skills tracked" value="8" hint="3 verified by faculty" icon={Target} />
        <StatCard label="Applications" value="0" hint="Nothing submitted yet" icon={Briefcase} />
        <StatCard label="Career readiness" value="Level 2" hint="Develop stage" icon={GraduationCap} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PanelCard title="Recommended opportunities" description="Based on your course stage and interests.">
            {isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : recommended.length === 0 ? (
              <EmptyState message="No opportunities available yet." />
            ) : (
              <ul className="space-y-3">
                {recommended.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.organisation} · {item.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{opportunityTypeLabels[item.type]}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDeadline(item.deadline)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" className="mt-4 min-h-11">
              <Link to="/opportunities">Browse all opportunities</Link>
            </Button>
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard title="Skill progress" description="Updated as you complete work.">
            <ul className="space-y-4">
              {skills.map((skill) => (
                <li key={skill.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{skill.name}</span>
                    <span className="text-muted-foreground">{skill.value}%</span>
                  </div>
                  <Progress
                    value={skill.value}
                    className="mt-2"
                    aria-label={`${skill.name} progress`}
                  />
                </li>
              ))}
            </ul>
          </PanelCard>

          <PanelCard title="Upcoming deadlines" description="Nothing tracked yet.">
            <EmptyState message="Save an opportunity to see its deadline here." />
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              Deadlines sync automatically once you apply.
            </p>
          </PanelCard>
        </div>
      </div>
    </DashboardShell>
  );
}
