import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Briefcase, CalendarClock, CheckCircle2, Circle, GraduationCap, Target, UserRound } from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { studentNav } from "@/lib/nav";
import { careerRolesQueryOptions, formatLpa, targetRoleQueryOptions } from "@/lib/careers";
import { formatDeadline, opportunitiesQueryOptions, opportunityTypeLabels } from "@/lib/opportunities";
import { missingSkills, readinessScore, roadmapQueryOptions, roadmapWeeks } from "@/lib/roadmap";

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

function StudentDashboard() {
  const { data: me } = useMe();
  const { data: opportunities, isPending } = useQuery(opportunitiesQueryOptions);
  const { data: target } = useQuery(targetRoleQueryOptions);
  const { data: roles } = useQuery(careerRolesQueryOptions);
  const { data: roadmap } = useQuery(roadmapQueryOptions);
  const targetRole = target?.target_role_id
    ? (roles ?? []).find((role) => role.id === target.target_role_id)
    : undefined;
  const recommended = (opportunities ?? []).slice(0, 3);

  const readiness = roadmap ? readinessScore(roadmap.role, roadmap.skills) : 0;
  const gaps = roadmap ? missingSkills(roadmap.role, roadmap.skills) : [];
  const doneKeys = new Set((roadmap?.progress ?? []).map((item) => item.task_key));
  const thisWeek = roadmapWeeks[0].items;
  const skillsTracked = roadmap?.skills.length ?? 0;
  const verified = (roadmap?.skills ?? []).filter((skill) => skill.verification_status !== "self_declared").length;

  return (
    <DashboardShell
      role="student"
      title={`Welcome${me?.fullName ? `, ${me.fullName.split(" ")[0]}` : ""}`}
      subtitle="Your semester-by-semester path from learning to first career."
      nav={studentNav("/dashboard/student")}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Career readiness"
          value={targetRole ? `${readiness}%` : "—"}
          hint={targetRole ? `Towards ${targetRole.title}` : "Choose a target role to unlock"}
          icon={GraduationCap}
        />
        <StatCard
          label="Skills tracked"
          value={String(skillsTracked)}
          hint={`${verified} verified by assessment`}
          icon={Target}
        />
        <StatCard
          label="Priority skill gaps"
          value={String(gaps.length)}
          hint={gaps[0] ? `Start with ${gaps[0]}` : "Nothing outstanding"}
          icon={UserRound}
        />
        <StatCard label="Applications" value="0" hint="Nothing submitted yet" icon={Briefcase} />
      </div>

      <PanelCard title="What should I do this week?" description="Three small steps that build real evidence.">
        {targetRole ? (
          <>
            <Progress value={readiness} className="mb-4" aria-label={`Career readiness ${readiness}%`} />
            <ul className="space-y-2">
              {thisWeek.map((item) => (
                <li key={item.key} className="flex items-start gap-3 rounded-md border border-border p-3">
                  {doneKeys.has(item.key) ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-4 min-h-11">
              <Link to="/roadmap">
                Open my graduation roadmap <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <EmptyState message="Pick a target role and your weekly plan appears here." />
            <Button asChild className="mt-4 min-h-11">
              <Link to="/roles">Choose a target role</Link>
            </Button>
          </>
        )}
      </PanelCard>

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
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="outline" className="min-h-11">
                <Link to="/opportunities">Browse all opportunities</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-11">
                <Link to="/dna">Open Student DNA</Link>
              </Button>
              <Button asChild className="min-h-11">
                <Link to="/assessment">Take a skill assessment</Link>
              </Button>
            </div>
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard title="Target role" description="Your roadmap is tuned to this role.">
            {targetRole ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">{targetRole.title}</p>
                <p className="text-xs text-muted-foreground">
                  {targetRole.course} · {targetRole.branch}
                </p>
                <p className="text-xs text-muted-foreground">
                  Fresher {formatLpa(targetRole.fresher_min_lpa, targetRole.fresher_max_lpa)}
                </p>
                <Button asChild variant="outline" className="mt-2 min-h-11">
                  <Link to="/roles">Change target role</Link>
                </Button>
              </div>
            ) : (
              <>
                <EmptyState message="You haven't chosen a target role yet." />
                <Button asChild className="mt-3 min-h-11">
                  <Link to="/roles">Explore roles &amp; responsibilities</Link>
                </Button>
              </>
            )}
          </PanelCard>

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
