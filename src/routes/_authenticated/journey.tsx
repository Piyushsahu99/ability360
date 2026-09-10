import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Briefcase,
  CalendarClock,
  FolderKanban,
  Route as RouteIcon,
  Sparkles,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

import journeyTrack from "@/assets/journey-track.jpg";
import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDateTimeIN } from "@/lib/india";
import { journeyKindLabels, journeyQueryOptions, type JourneyKind } from "@/lib/journey";
import { studentNav } from "@/lib/nav";
import { missingSkills, readinessScore, roadmapQueryOptions } from "@/lib/roadmap";

export const Route = createFileRoute("/_authenticated/journey")({
  head: () => ({
    meta: [
      { title: "My journey — ABILITY360" },
      {
        name: "description",
        content: "Track every update on your career journey — applications, roadmap steps, projects, assessments and verified achievements.",
      },
      { property: "og:title", content: "My journey — ABILITY360" },
      { property: "og:description", content: "A single timeline of every step from first semester to first career." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JourneyPage,
});

const nav = studentNav("/journey");

const kindIcons: Record<JourneyKind, LucideIcon> = {
  application: Briefcase,
  roadmap: RouteIcon,
  achievement: Award,
  project: FolderKanban,
  assessment: Target,
  experience: Sparkles,
};

const filters: Array<{ value: JourneyKind | "all"; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "application", label: journeyKindLabels.application },
  { value: "roadmap", label: journeyKindLabels.roadmap },
  { value: "achievement", label: journeyKindLabels.achievement },
  { value: "project", label: journeyKindLabels.project },
  { value: "assessment", label: journeyKindLabels.assessment },
  { value: "experience", label: journeyKindLabels.experience },
];

function JourneyPage() {
  const { data, isPending, isError, refetch } = useQuery(journeyQueryOptions);
  const { data: roadmap } = useQuery(roadmapQueryOptions);
  const [filter, setFilter] = useState<JourneyKind | "all">("all");

  const events = useMemo(
    () => (data?.events ?? []).filter((event) => filter === "all" || event.kind === filter),
    [data, filter],
  );

  const readiness = readinessScore(roadmap?.role ?? null, roadmap?.skills ?? []);
  const gaps = missingSkills(roadmap?.role ?? null, roadmap?.skills ?? []);

  return (
    <DashboardShell
      role="student"
      title="My journey"
      subtitle="Every update from your first semester to your first career, in one timeline."
      nav={nav}
    >
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <img
          src={journeyTrack}
          alt="Illustration of a rising progress path with milestone checkpoints"
          width={1024}
          height={640}
          className="h-44 w-full object-cover"
        />
        <div className="p-5">
          <p className="text-sm font-medium">
            {roadmap?.role ? `Working towards ${roadmap.role.title}` : "Choose a target role to sharpen your journey"}
          </p>
          <Progress value={readiness} className="mt-3" aria-label="Role readiness" />
          <p className="mt-2 text-sm text-muted-foreground">
            {readiness}% ready
            {gaps.length > 0 ? ` · ${gaps.length} skill${gaps.length === 1 ? "" : "s"} still to build` : " · all listed skills covered"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/roadmap">Open my roadmap</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/roles">Change target role</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Updates this week"
          value={String(data?.weekCount ?? 0)}
          hint="New milestones in the last seven days"
          icon={CalendarClock}
        />
        <StatCard
          label="Applications tracked"
          value={String(data?.counts.application ?? 0)}
          hint="Every opportunity you are pursuing"
          icon={Briefcase}
        />
        <StatCard
          label="Roadmap steps done"
          value={String(data?.counts.roadmap ?? 0)}
          hint="Completed tasks on your plan"
          icon={RouteIcon}
        />
        <StatCard
          label="Verified achievements"
          value={String(data?.counts.achievement ?? 0)}
          hint="Entries in your Ability Passport"
          icon={Award}
        />
      </div>

      <PanelCard
        title="Journey timeline"
        description="Newest first. Filter to see one kind of progress at a time."
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/dna">Open Ability Passport</Link>
          </Button>
        }
      >
        <ul className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <li key={item.value}>
              <Button
                type="button"
                size="sm"
                variant={filter === item.value ? "default" : "outline"}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            </li>
          ))}
        </ul>

        {isPending && <p className="mt-4 text-sm text-muted-foreground">Loading your journey…</p>}

        {isError && (
          <div className="mt-4">
            <EmptyState
              title="We couldn't load your journey"
              description="Check your connection and try again."
              action={
                <Button size="sm" variant="outline" onClick={() => void refetch()}>
                  Try again
                </Button>
              }
            />
          </div>
        )}

        {!isPending && !isError && events.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="Nothing here yet"
              description="Save an opportunity, finish a roadmap step or add a project and it will appear on this timeline."
              action={
                <Button asChild size="sm">
                  <Link to="/opportunities">Browse opportunities</Link>
                </Button>
              }
            />
          </div>
        )}

        {events.length > 0 && (
          <ol className="mt-4 space-y-4 border-l border-border pl-5">
            {events.map((event) => {
              const Icon = kindIcons[event.kind];
              return (
                <li key={event.id} className="relative">
                  <span
                    className="absolute -left-[27px] flex size-5 items-center justify-center rounded-full bg-primary-soft text-primary"
                    aria-hidden="true"
                  >
                    <Icon className="size-3" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{event.title}</p>
                    <Badge variant="outline" className="font-normal">
                      {journeyKindLabels[event.kind]}
                    </Badge>
                  </div>
                  {event.detail && <p className="text-sm text-muted-foreground">{event.detail}</p>}
                  <p className="text-xs text-muted-foreground">{formatDateTimeIN(event.at)}</p>
                </li>
              );
            })}
          </ol>
        )}
      </PanelCard>
    </DashboardShell>
  );
}
