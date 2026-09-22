import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Accessibility, ArrowRight, BadgeCheck, Briefcase, CalendarClock, CheckCircle2, Circle, ExternalLink, GraduationCap, HeartHandshake, Route as RouteIcon, Target, UserRound } from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { StudentGoals } from "@/components/student-goals";
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
import { journeyQueryOptions } from "@/lib/journey";
import { formatDateTimeIN } from "@/lib/india";

export const Route = createFileRoute("/_authenticated/dashboard/student")({
  staticData: { sitemap: false },
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
      { property: "og:title", content: "Student dashboard — ABILITY360" },
      { property: "og:description", content: "Track your goals, readiness, roadmap, deadlines and career journey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const { data: journey } = useQuery(journeyQueryOptions);
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
      <section className="border-l-4 border-primary bg-card p-5 shadow-sm sm:p-6" aria-labelledby="current-direction-title">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">Your current direction</p>
            <h2 id="current-direction-title" className="mt-1 text-2xl sm:text-3xl">{targetRole?.title ?? "Choose the career you want to work towards"}</h2>
            <p className="mt-2 text-base text-muted-foreground">{targetRole ? `${readiness}% ready · ${gaps.length} priority skill gap${gaps.length === 1 ? "" : "s"}` : "Your roadmap and recommendations will adapt to your choice."}</p>
          </div>
          <Button asChild className="min-h-11 shrink-0"><Link to={targetRole ? "/roadmap" : "/roles"}>{targetRole ? "Continue my roadmap" : "Choose a target role"}<ArrowRight aria-hidden="true" /></Link></Button>
        </div>
        {targetRole ? <Progress value={readiness} className="mt-5" aria-label={`Career readiness ${readiness}%`} /> : null}
      </section>

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

      <div className="grid gap-6 lg:grid-cols-2">
      <PanelCard title="Next actions" description="Three small steps that build real evidence.">
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

      <PanelCard title="Personal goals" description="Your own priorities, alongside the guided roadmap.">
        <StudentGoals compact limit={3} title="My current goals" />
      </PanelCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PanelCard title="Upcoming deadlines" description={upcoming.length === 0 ? "Nothing due from your saved list." : `${upcoming.length} deadline${upcoming.length === 1 ? "" : "s"} ahead.`}>
          {upcoming.length === 0 ? <EmptyState message="Save an opportunity to see its deadline here." /> : <ul className="space-y-3">{upcoming.slice(0, 3).map(({ item, days }) => <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border pb-3 last:border-0"><div className="min-w-0"><p className="font-medium">{item.opportunities?.title ?? "Opportunity"}</p><p className="mt-1 text-sm text-muted-foreground">{statusLabels[item.status]}</p></div><Badge variant={days !== null && days <= 3 ? "default" : "secondary"}>{days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"}`}</Badge></li>)}</ul>}
          <Button asChild variant="outline" className="mt-4 min-h-11"><Link to="/applications">Open applications</Link></Button>
        </PanelCard>
        <PanelCard title="Recent journey updates" description="Your latest progress across ABILITY360.">
          {(journey?.events.length ?? 0) === 0 ? <EmptyState message="Your completed steps will appear here." /> : <ol className="space-y-3">{(journey?.events ?? []).slice(0, 4).map((event) => <li key={event.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-border pb-3 last:border-0"><RouteIcon className="mt-1 size-4 text-primary" aria-hidden="true" /><div className="min-w-0"><p className="font-medium">{event.title}</p><p className="mt-1 text-sm text-muted-foreground">{formatDateTimeIN(event.at)}</p></div></li>)}</ol>}
          <Button asChild variant="outline" className="mt-4 min-h-11"><Link to="/journey">View my journey</Link></Button>
        </PanelCard>
      </div>

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

          <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="size-4" aria-hidden="true" />Deadlines sync when you save or apply.</p>
        </div>
      </div>
    </DashboardShell>
  );
}
