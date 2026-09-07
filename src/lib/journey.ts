import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { statusLabels } from "@/lib/applications";
import { roadmapWeeks } from "@/lib/roadmap";

export type JourneyKind =
  | "application"
  | "roadmap"
  | "achievement"
  | "project"
  | "assessment"
  | "experience";

export type JourneyEvent = {
  id: string;
  kind: JourneyKind;
  title: string;
  detail: string;
  at: string;
};

export const journeyKindLabels: Record<JourneyKind, string> = {
  application: "Application",
  roadmap: "Roadmap",
  achievement: "Achievement",
  project: "Project",
  assessment: "Assessment",
  experience: "Experience",
};

const roadmapTaskTitles: Record<string, string> = Object.fromEntries(
  roadmapWeeks.flatMap((week) => week.items.map((item) => [item.key, item.title])),
);

export type JourneySummary = {
  events: JourneyEvent[];
  counts: Record<JourneyKind, number>;
  lastUpdated: string | null;
  weekCount: number;
};

export const journeyQueryOptions = queryOptions({
  queryKey: ["student", "journey"],
  queryFn: async (): Promise<JourneySummary> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    const empty: JourneySummary = {
      events: [],
      counts: {
        application: 0,
        roadmap: 0,
        achievement: 0,
        project: 0,
        assessment: 0,
        experience: 0,
      },
      lastUpdated: null,
      weekCount: 0,
    };
    if (!user) return empty;

    const [applications, roadmap, achievements, projects, assessments, experiences] = await Promise.all([
      supabase
        .from("opportunity_applications")
        .select("id, status, status_changed_at, opportunities(title, organisation)")
        .eq("student_id", user.id),
      supabase.from("roadmap_progress").select("id, task_key, completed_at").eq("student_id", user.id),
      supabase
        .from("student_achievements")
        .select("id, title, issuer, verified_at, created_at")
        .eq("student_id", user.id),
      supabase.from("student_projects").select("id, title, role, created_at").eq("student_id", user.id),
      supabase
        .from("assessment_attempts")
        .select("id, category, score, level, created_at")
        .eq("student_id", user.id),
      supabase
        .from("student_experiences")
        .select("id, role, organisation, kind, created_at")
        .eq("student_id", user.id),
    ]);

    const events: JourneyEvent[] = [];

    for (const row of applications.data ?? []) {
      const opportunity = row.opportunities as { title: string; organisation: string } | null;
      events.push({
        id: `application-${row.id}`,
        kind: "application",
        title: `${statusLabels[row.status]} — ${opportunity?.title ?? "Opportunity"}`,
        detail: opportunity?.organisation ?? "",
        at: row.status_changed_at,
      });
    }

    for (const row of roadmap.data ?? []) {
      events.push({
        id: `roadmap-${row.id}`,
        kind: "roadmap",
        title: roadmapTaskTitles[row.task_key] ?? "Roadmap step completed",
        detail: "Roadmap step marked as done",
        at: row.completed_at,
      });
    }

    for (const row of achievements.data ?? []) {
      events.push({
        id: `achievement-${row.id}`,
        kind: "achievement",
        title: row.title,
        detail: row.verified_at ? `Verified by ${row.issuer ?? "issuer"}` : (row.issuer ?? "Self recorded"),
        at: row.verified_at ?? row.created_at,
      });
    }

    for (const row of projects.data ?? []) {
      events.push({
        id: `project-${row.id}`,
        kind: "project",
        title: row.title,
        detail: row.role ? `Project — ${row.role}` : "Project added to your profile",
        at: row.created_at,
      });
    }

    for (const row of assessments.data ?? []) {
      events.push({
        id: `assessment-${row.id}`,
        kind: "assessment",
        title: `${row.category} assessment scored ${row.score}%`,
        detail: `Level ${row.level} recorded`,
        at: row.created_at,
      });
    }

    for (const row of experiences.data ?? []) {
      events.push({
        id: `experience-${row.id}`,
        kind: "experience",
        title: `${row.role} at ${row.organisation}`,
        detail: row.kind ? `${row.kind} experience` : "Experience added",
        at: row.created_at,
      });
    }

    events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    const counts = { ...empty.counts };
    for (const event of events) counts[event.kind] += 1;

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekCount = events.filter((event) => new Date(event.at).getTime() >= weekAgo).length;

    return {
      events,
      counts,
      lastUpdated: events[0]?.at ?? null,
      weekCount,
    };
  },
  staleTime: 30_000,
});
