import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Accessibility, ArrowRight, BadgeCheck, Briefcase, CalendarClock, CheckCircle2, Circle, ExternalLink, GraduationCap, HeartHandshake, Target, UserRound } from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { accessibilityPrefsQueryOptions, prefFields, supportResources } from "@/lib/accessibility";
import { useMe } from "@/lib/auth";
import { studentNav } from "@/lib/nav";
import { careerRolesQueryOptions, formatLpa, targetRoleQueryOptions } from "@/lib/careers";
import { formatDeadline, opportunitiesQueryOptions, opportunityTypeLabels } from "@/lib/opportunities";
import {
  activeStatuses,
  applicationsQueryOptions,
  closedStatuses,
  daysUntil,
  statusLabels,
} from "@/lib/applications";
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
  const { data: a11yPrefs } = useQuery(accessibilityPrefsQueryOptions);
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

  /* Divyangjan hub tailoring */
  const activeAccommodations = a11yPrefs ? prefFields.filter((field) => a11yPrefs[field.key]).length : 0;
  const inclusiveOpportunities = (opportunities ?? []).filter((item) => item.is_inclusive_employer);
  const tailoredOpportunities = a11yPrefs?.remote_participation
    ? inclusiveOpportunities.filter((item) => item.mode === "remote")
    : inclusiveOpportunities;
  const shownInclusive = tailoredOpportunities.slice(0, 3);
  const shownResources = supportResources.slice(0, 3);

  /* Real application pipeline */
  const { data: applications } = useQuery(applicationsQueryOptions);
  const allApplications = applications ?? [];
  const liveApplications = allApplications.filter((item) => activeStatuses.includes(item.status));
  const closedApplications = allApplications.filter((item) => closedStatuses.includes(item.status));
  const upcoming = allApplications
    .map((item) => ({ item, days: daysUntil(item.deadline ?? item.opportunities?.deadline ?? null) }))
    .filter((entry) => entry.days !== null && entry.days >= 0)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
    .slice(0, 4);

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
        <StatCard
          label="Applications"
          value={String(allApplications.length)}
          hint={
            allApplications.length === 0
              ? "Nothing saved yet"
              : `${liveApplications.length} in progress · ${closedApplications.length} closed`
          }
          icon={Briefcase}
        />
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

      <PanelCard
        title="Divyangjan resources hub"
        description={
          activeAccommodations > 0
            ? `Tailored to your ${activeAccommodations} saved accommodation${activeAccommodations === 1 ? "" : "s"} — private to you.`
            : "Schemes, rights and inclusive employers for specially abled students."
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <HeartHandshake className="size-4 text-primary" aria-hidden="true" />
              Schemes &amp; rights for you
            </p>
            <ul className="mt-3 space-y-3">
              {shownResources.map((resource) => (
                <li key={resource.title}>
                  <p className="text-sm font-medium">{resource.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{resource.body}</p>
                  {resource.href && (
                    <a
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-4"
                      href={resource.href}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {resource.action}
                      <ExternalLink className="size-3" aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <BadgeCheck className="size-4 text-primary" aria-hidden="true" />
              {a11yPrefs?.remote_participation
                ? "Remote inclusive roles for you"
                : "Inclusive employers hiring now"}
            </p>
            {shownInclusive.length === 0 ? (
              <EmptyState message="No matching inclusive roles right now — check back soon." />
            ) : (
              <ul className="mt-3 space-y-2">
                {shownInclusive.map((item) => (
                  <li key={item.id} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.organisation} · {item.location} · Apply by {formatDeadline(item.deadline)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button asChild className="min-h-11">
            <Link to="/accessibility">
              <Accessibility aria-hidden="true" />
              Open the accessibility hub
            </Link>
          </Button>
          {activeAccommodations === 0 && (
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/accessibility">Set my accommodations</Link>
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Helpline for persons with disabilities: 1800-11-1265
          </p>
        </div>
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

          <PanelCard title="Skill progress" description="Your saved skills and their confidence level.">
            {(roadmap?.skills.length ?? 0) === 0 ? (
              <EmptyState message="No skills saved yet — add them in your Student DNA." />
            ) : (
              <ul className="space-y-4">
                {(roadmap?.skills ?? []).slice(0, 5).map((skill, index) => (
                  <li key={`${skill.skills?.name ?? "skill"}-${index}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{skill.skills?.name ?? "Skill"}</span>
                      <span className="text-muted-foreground">{skill.level * 20}%</span>
                    </div>
                    <Progress
                      value={skill.level * 20}
                      className="mt-2"
                      aria-label={`${skill.skills?.name ?? "Skill"} progress`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard
            title="Upcoming deadlines"
            description={
              upcoming.length === 0
                ? "Nothing due from your saved list."
                : `${upcoming.length} deadline${upcoming.length === 1 ? "" : "s"} ahead.`
            }
          >
            {upcoming.length === 0 ? (
              <EmptyState message="Save an opportunity to see its deadline here." />
            ) : (
              <ul className="space-y-3">
                {upcoming.map(({ item, days }) => (
                  <li key={item.id} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium">{item.opportunities?.title ?? "Opportunity"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {statusLabels[item.status]} ·{" "}
                      {days === 0 ? "Closes today" : `${days} day${days === 1 ? "" : "s"} left`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" className="mt-4 min-h-11">
              <Link to="/applications">Open my applications</Link>
            </Button>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              Deadlines sync automatically once you save or apply.
            </p>
          </PanelCard>
        </div>
      </div>
    </DashboardShell>
  );
}
