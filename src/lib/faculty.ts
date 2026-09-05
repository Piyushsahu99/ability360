import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { normalise } from "@/lib/roadmap";

export type FacultyStudent = Database["public"]["Functions"]["faculty_directory"]["Returns"][number];
export type ProjectRow = Database["public"]["Tables"]["student_projects"]["Row"];
export type FeedbackRow = Database["public"]["Tables"]["faculty_feedback"]["Row"];
export type RecommendationRow = Database["public"]["Tables"]["faculty_recommendations"]["Row"] & {
  opportunities: { title: string; organisation: string } | null;
};
export type CareerRole = Database["public"]["Tables"]["career_roles"]["Row"];
export type SkillVerification = Database["public"]["Enums"]["skill_verification"];

export type StudentSkill = {
  id: string;
  level: number;
  verification_status: SkillVerification;
  skills: { name: string; category: Database["public"]["Enums"]["skill_category"] } | null;
};

export const feedbackKinds = ["general", "skill", "project", "roadmap"] as const;
export const feedbackKindLabels: Record<string, string> = {
  general: "General guidance",
  skill: "Skill development",
  project: "Project review",
  roadmap: "Roadmap check-in",
};

export const facultyDirectoryQueryOptions = queryOptions({
  queryKey: ["faculty", "directory"],
  queryFn: async (): Promise<FacultyStudent[]> => {
    const { data, error } = await supabase.rpc("faculty_directory");
    if (error) throw error;
    return (data ?? []) as FacultyStudent[];
  },
  staleTime: 60_000,
});

export type StudentDetail = {
  skills: StudentSkill[];
  projects: ProjectRow[];
  role: CareerRole | null;
  roadmapCompleted: string[];
  attempts: Database["public"]["Tables"]["assessment_attempts"]["Row"][];
  feedback: FeedbackRow[];
  recommendations: RecommendationRow[];
};

export function studentDetailQueryOptions(studentId: string | null) {
  return queryOptions({
    queryKey: ["faculty", "student", studentId],
    enabled: Boolean(studentId),
    queryFn: async (): Promise<StudentDetail | null> => {
      if (!studentId) return null;

      const [skills, projects, profile, progress, attempts, feedback, recommendations] = await Promise.all([
        supabase
          .from("student_skills")
          .select("id, level, verification_status, skills(name, category)")
          .eq("student_id", studentId),
        supabase
          .from("student_projects")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false }),
        supabase.from("student_profiles").select("target_role_id").eq("id", studentId).maybeSingle(),
        supabase.from("roadmap_progress").select("task_key").eq("student_id", studentId),
        supabase
          .from("assessment_attempts")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false }),
        supabase
          .from("faculty_feedback")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false }),
        supabase
          .from("faculty_recommendations")
          .select("*, opportunities(title, organisation)")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false }),
      ]);

      if (skills.error) throw skills.error;
      if (projects.error) throw projects.error;

      let role: CareerRole | null = null;
      if (profile.data?.target_role_id) {
        const { data } = await supabase
          .from("career_roles")
          .select("*")
          .eq("id", profile.data.target_role_id)
          .maybeSingle();
        role = data ?? null;
      }

      return {
        skills: (skills.data ?? []) as unknown as StudentSkill[],
        projects: projects.data ?? [],
        role,
        roadmapCompleted: (progress.data ?? []).map((row) => row.task_key),
        attempts: attempts.data ?? [],
        feedback: feedback.data ?? [],
        recommendations: (recommendations.data ?? []) as unknown as RecommendationRow[],
      };
    },
  });
}

export function skillGapsFor(role: CareerRole | null, skills: StudentSkill[]) {
  if (!role) return { matched: [] as string[], missing: [] as string[], coverage: 0 };
  const owned = new Set(skills.map((skill) => (skill.skills ? normalise(skill.skills.name) : "")));
  const matched = role.skills.filter((skill) => owned.has(normalise(skill)));
  const missing = role.skills.filter((skill) => !owned.has(normalise(skill)));
  const coverage = role.skills.length === 0 ? 0 : Math.round((matched.length / role.skills.length) * 100);
  return { matched, missing, coverage };
}

export async function currentFacultyId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export async function setSkillVerification(skillRowId: string, status: SkillVerification) {
  const { error } = await supabase
    .from("student_skills")
    .update({ verification_status: status })
    .eq("id", skillRowId);
  if (error) throw error;
}

export async function setProjectVerified(projectId: string, verified: boolean) {
  const facultyId = await currentFacultyId();
  const { error } = await supabase
    .from("student_projects")
    .update({
      verified_by: verified ? facultyId : null,
      verified_at: verified ? new Date().toISOString() : null,
    })
    .eq("id", projectId);
  if (error) throw error;
}

export async function addFeedback(values: {
  studentId: string;
  kind: string;
  label?: string;
  body: string;
}) {
  const facultyId = await currentFacultyId();
  const { error } = await supabase.from("faculty_feedback").insert({
    faculty_id: facultyId,
    student_id: values.studentId,
    subject_kind: values.kind,
    subject_label: values.label || null,
    body: values.body,
  });
  if (error) throw error;
}

export async function deleteFeedback(id: string) {
  const { error } = await supabase.from("faculty_feedback").delete().eq("id", id);
  if (error) throw error;
}

export async function recommendOpportunity(studentId: string, opportunityId: string, note: string) {
  const facultyId = await currentFacultyId();
  const { error } = await supabase.from("faculty_recommendations").insert({
    faculty_id: facultyId,
    student_id: studentId,
    opportunity_id: opportunityId,
    note,
  });
  if (error) throw error;
}

export async function removeRecommendation(id: string) {
  const { error } = await supabase.from("faculty_recommendations").delete().eq("id", id);
  if (error) throw error;
}
