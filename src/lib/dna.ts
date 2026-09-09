import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProjectRow = Database["public"]["Tables"]["student_projects"]["Row"];
export type ExperienceRow = Database["public"]["Tables"]["student_experiences"]["Row"];
export type AchievementRow = Database["public"]["Tables"]["student_achievements"]["Row"];
export type AttemptRow = Database["public"]["Tables"]["assessment_attempts"]["Row"];
export type SkillCategory = Database["public"]["Enums"]["skill_category"];

export const experienceKinds = ["internship", "job", "research", "volunteering", "freelance"] as const;
export const experienceKindLabels: Record<string, string> = {
  internship: "Internship",
  job: "Job",
  research: "Research",
  volunteering: "Volunteering",
  freelance: "Freelance",
};

export const achievementCategories = ["award", "competition", "certification", "publication"] as const;
export const achievementCategoryLabels: Record<string, string> = {
  award: "Award",
  competition: "Competition",
  certification: "Certification",
  publication: "Publication",
};

export const verificationLabels: Record<string, string> = {
  self_declared: "Self declared",
  assessment_verified: "Assessment verified",
  faculty_verified: "Faculty verified",
  industry_verified: "Industry verified",
};

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Add a project title").max(120),
  description: z.string().trim().max(1000).optional(),
  role: z.string().trim().max(80).optional(),
  technologies: z.string().trim().max(200).optional(),
  link: z.string().trim().url("Enter a valid URL").max(300).optional().or(z.literal("")),
});
export type ProjectValues = z.infer<typeof projectSchema>;

export const experienceSchema = z.object({
  organisation: z.string().trim().min(2, "Add the organisation").max(120),
  role: z.string().trim().min(2, "Add your role").max(120),
  kind: z.enum(experienceKinds),
  description: z.string().trim().max(1000).optional(),
});
export type ExperienceValues = z.infer<typeof experienceSchema>;

export const achievementSchema = z.object({
  title: z.string().trim().min(2, "Add a title").max(120),
  issuer: z.string().trim().max(120).optional(),
  category: z.enum(achievementCategories),
  description: z.string().trim().max(1000).optional(),
});
export type AchievementValues = z.infer<typeof achievementSchema>;

export type DnaData = {
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  student: Database["public"]["Tables"]["student_profiles"]["Row"] | null;
  institutionName: string | null;
  skills: {
    id: string;
    skillId: string;
    level: number;
    verification: string;
    name: string;
    category: SkillCategory;
  }[];
  interests: string[];
  projects: ProjectRow[];
  experiences: ExperienceRow[];
  achievements: AchievementRow[];
  attempts: AttemptRow[];
  accessibilityCount: number;
};

export const dnaQueryOptions = queryOptions({
  queryKey: ["student", "dna"],
  queryFn: async (): Promise<DnaData | null> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;

    const [profile, student, skills, interests, projects, experiences, achievements, attempts, access] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("student_profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("student_skills")
          .select("id, skill_id, level, verification_status, skills(name, category)")
          .eq("student_id", user.id),
        supabase.from("student_interests").select("interest").eq("student_id", user.id),
        supabase
          .from("student_projects")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("student_experiences")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("student_achievements")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("assessment_attempts")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("accessibility_preferences").select("*").eq("id", user.id).maybeSingle(),
      ]);

    let institutionName: string | null = null;
    if (profile.data?.institution_id) {
      const { data } = await supabase
        .from("institutions")
        .select("name")
        .eq("id", profile.data.institution_id)
        .maybeSingle();
      institutionName = data?.name ?? null;
    }
    if (!institutionName) institutionName = student.data?.institution_other ?? null;

    const prefs = access.data as Record<string, unknown> | null;
    const accessibilityCount = prefs
      ? Object.entries(prefs).filter(([key, value]) => value === true && key !== "id").length
      : 0;

    return {
      profile: profile.data ?? null,
      student: student.data ?? null,
      institutionName,
      skills: (skills.data ?? []).map((row) => {
        const skill = row.skills as unknown as { name: string; category: SkillCategory } | null;
        return {
          id: row.id,
          skillId: row.skill_id,
          level: row.level,
          verification: row.verification_status,
          name: skill?.name ?? "Skill",
          category: skill?.category ?? "technical",
        };
      }),
      interests: (interests.data ?? []).map((row) => row.interest),
      projects: projects.data ?? [],
      experiences: experiences.data ?? [],
      achievements: achievements.data ?? [],
      attempts: attempts.data ?? [],
      accessibilityCount,
    };
  },
});

export function dnaStrength(dna: DnaData) {
  const strengths = dna.skills.filter((s) => s.level >= 4).sort((a, b) => b.level - a.level);
  const developing = dna.skills.filter((s) => s.level <= 2).sort((a, b) => a.level - b.level);
  return { strengths, developing };
}

export function profileCompleteness(dna: DnaData) {
  const checks = [
    Boolean(dna.profile?.full_name),
    Boolean(dna.student?.degree),
    Boolean(dna.student?.career_goal),
    dna.skills.length > 0,
    dna.interests.length > 0,
    dna.projects.length > 0,
    dna.experiences.length > 0,
    dna.achievements.length > 0,
    dna.attempts.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export async function addProject(values: ProjectValues) {
  const studentId = await currentUserId();
  const { error } = await supabase.from("student_projects").insert({
    student_id: studentId,
    title: values.title,
    description: values.description ?? "",
    role: values.role || null,
    link: values.link || null,
    technologies: (values.technologies ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  });
  if (error) throw error;
}

export async function addExperience(values: ExperienceValues) {
  const studentId = await currentUserId();
  const { error } = await supabase.from("student_experiences").insert({
    student_id: studentId,
    organisation: values.organisation,
    role: values.role,
    kind: values.kind,
    description: values.description ?? "",
  });
  if (error) throw error;
}

export async function addAchievement(values: AchievementValues) {
  const studentId = await currentUserId();
  const { error } = await supabase.from("student_achievements").insert({
    student_id: studentId,
    title: values.title,
    issuer: values.issuer || null,
    category: values.category,
    description: values.description ?? "",
  });
  if (error) throw error;
}

export async function deleteRow(
  table: "student_projects" | "student_experiences" | "student_achievements",
  id: string,
) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export const skillLevelLabels: Record<number, string> = {
  1: "Just starting",
  2: "Learning",
  3: "Practising",
  4: "Confident",
  5: "Advanced",
};

/** Add a skill the student declares themselves, or raise the level if it already exists. */
export async function addSkill(skillId: string, level: number) {
  const studentId = await currentUserId();
  const { data: existing, error: findError } = await supabase
    .from("student_skills")
    .select("id, level")
    .eq("student_id", studentId)
    .eq("skill_id", skillId)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase.from("student_skills").update({ level }).eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("student_skills").insert({
    student_id: studentId,
    skill_id: skillId,
    level,
    verification_status: "self_declared",
  });
  if (error) throw error;
}

export async function updateSkillLevel(rowId: string, level: number) {
  const { error } = await supabase.from("student_skills").update({ level }).eq("id", rowId);
  if (error) throw error;
}

export async function removeSkill(rowId: string) {
  const { error } = await supabase.from("student_skills").delete().eq("id", rowId);
  if (error) throw error;
}
