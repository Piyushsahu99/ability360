import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type RoadmapProgressRow = Database["public"]["Tables"]["roadmap_progress"]["Row"];
export type RoadmapRole = Database["public"]["Tables"]["career_roles"]["Row"];

type StudentSkillRow = {
  level: number;
  verification_status: Database["public"]["Enums"]["skill_verification"];
  skills: { name: string; category: Database["public"]["Enums"]["skill_category"] } | null;
};

export type RoadmapData = {
  role: RoadmapRole | null;
  studentSemester: number;
  skills: StudentSkillRow[];
  progress: RoadmapProgressRow[];
};

export const roadmapQueryOptions = queryOptions({
  queryKey: ["student", "roadmap"],
  queryFn: async (): Promise<RoadmapData | null> => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const user = userData.user;
    if (!user) return null;

    const [{ data: student, error: studentError }, { data: skills, error: skillsError }, { data: progress, error: progressError }] =
      await Promise.all([
        supabase.from("student_profiles").select("semester, target_role_id").eq("id", user.id).maybeSingle(),
        supabase
          .from("student_skills")
          .select("level, verification_status, skills(name, category)")
          .eq("student_id", user.id),
        supabase.from("roadmap_progress").select("*").eq("student_id", user.id),
      ]);

    if (studentError) throw studentError;
    if (skillsError) throw skillsError;
    if (progressError) throw progressError;

    let role: RoadmapRole | null = null;
    if (student?.target_role_id) {
      const { data, error } = await supabase
        .from("career_roles")
        .select("*")
        .eq("id", student.target_role_id)
        .maybeSingle();
      if (error) throw error;
      role = data;
    }

    return {
      role,
      studentSemester: student?.semester ?? 1,
      skills: (skills ?? []) as StudentSkillRow[],
      progress: progress ?? [],
    };
  },
  staleTime: 60_000,
});

export async function setRoadmapTask(taskKey: string, roleId: string, completed: boolean) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) throw new Error("You need to sign in to update your roadmap.");

  if (completed) {
    const { error } = await supabase.from("roadmap_progress").upsert(
      { student_id: user.id, task_key: taskKey, role_id: roleId },
      { onConflict: "student_id,task_key" },
    );
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("roadmap_progress")
    .delete()
    .eq("student_id", user.id)
    .eq("task_key", taskKey);
  if (error) throw error;
}

export function normalise(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function readinessScore(role: RoadmapRole | null, skills: StudentSkillRow[]) {
  if (!role || role.skills.length === 0) return 0;
  const owned = new Set(skills.map((skill) => skill.skills?.name ? normalise(skill.skills.name) : ""));
  const matched = role.skills.filter((skill) => owned.has(normalise(skill))).length;
  return Math.round((matched / role.skills.length) * 100);
}

export function missingSkills(role: RoadmapRole | null, skills: StudentSkillRow[]) {
  if (!role) return [];
  const owned = new Set(skills.map((skill) => skill.skills?.name ? normalise(skill.skills.name) : ""));
  return role.skills.filter((skill) => !owned.has(normalise(skill)));
}

export const roadmapWeeks = [
  {
    semester: "Now",
    label: "Build your foundation",
    items: [
      { key: "foundation-profile", title: "Complete your Student DNA", detail: "Add one project, one interest and your academic direction." },
      { key: "foundation-assessment", title: "Take one skill assessment", detail: "Turn a self-declared strength into verified evidence." },
      { key: "foundation-project", title: "Ship a small role-aligned project", detail: "Create something you can explain in a two-minute portfolio walkthrough." },
    ],
  },
  {
    semester: "Next 30 days",
    label: "Close your highest-priority gap",
    items: [
      { key: "gap-learning", title: "Learn your top missing skill", detail: "Spend three focused sessions on the first gap below." },
      { key: "gap-evidence", title: "Document your evidence", detail: "Add a project, certificate or achievement to your DNA." },
      { key: "gap-opportunity", title: "Apply to one aligned opportunity", detail: "Choose an internship, project or competition that builds the gap." },
    ],
  },
  {
    semester: "This semester",
    label: "Turn progress into proof",
    items: [
      { key: "semester-project", title: "Complete a substantial project", detail: "Use your target role skills to solve a real problem." },
      { key: "semester-network", title: "Get one feedback conversation", detail: "Ask a faculty member, mentor or industry professional to review your work." },
      { key: "semester-ready", title: "Refresh your roadmap", detail: "Retake an assessment and review your readiness score." },
    ],
  },
] as const;
