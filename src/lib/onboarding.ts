import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SkillRow = Database["public"]["Tables"]["skills"]["Row"];
export type SkillCategory = Database["public"]["Enums"]["skill_category"];
export type WorkMode = Database["public"]["Enums"]["work_mode"];

export const skillCategoryLabels: Record<SkillCategory, string> = {
  technical: "Technical",
  soft: "Soft skill",
  aptitude: "Aptitude",
  domain: "Domain",
};

export const skillLevelLabels: Record<number, string> = {
  1: "Beginner",
  2: "Learning",
  3: "Practising",
  4: "Confident",
  5: "Advanced",
};

export const totalSteps = 4;

export const academicStepSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(80),
  institutionId: z.string().optional(),
  institutionOther: z.string().trim().max(120).optional(),
  department: z.string().trim().min(2, "Enter your department").max(80),
  degree: z.string().trim().min(2, "Enter your degree").max(80),
  semester: z.coerce.number().int().min(1, "Select your semester").max(12),
  academicScoreType: z.enum(["cgpa", "percentage"]),
  academicScore: z.coerce.number().min(0, "Enter a valid score").max(100),
});

export const skillsStepSchema = z.object({
  skills: z
    .array(z.object({ skillId: z.string().uuid(), name: z.string(), level: z.number().int().min(1).max(5) }))
    .min(1, "Add at least one skill"),
  interests: z.array(z.string().trim().min(1)).max(20),
  preferredIndustries: z.array(z.string().trim().min(1)).max(20),
});

export const careerStepSchema = z.object({
  careerGoal: z.string().trim().min(2, "Tell us the role you are aiming for").max(120),
  preferredLocation: z.string().trim().max(120).optional(),
  preferredWorkMode: z.enum(["onsite", "remote", "hybrid"]),
});

export const accessibilityStepSchema = z.object({
  screenReader: z.boolean(),
  highContrast: z.boolean(),
  captions: z.boolean(),
  keyboardNavigation: z.boolean(),
  reducedMotion: z.boolean(),
  remoteParticipation: z.boolean(),
  accessibleVenue: z.boolean(),
  flexibleSchedule: z.boolean(),
  otherAccommodation: z.string().trim().max(280).optional(),
});

export type AcademicStepValues = z.infer<typeof academicStepSchema>;
export type SkillsStepValues = z.infer<typeof skillsStepSchema>;
export type CareerStepValues = z.infer<typeof careerStepSchema>;
export type AccessibilityStepValues = z.infer<typeof accessibilityStepSchema>;

export const accessibilityOptions = [
  { key: "screenReader", label: "Screen reader support", hint: "We keep labels and landmarks descriptive." },
  { key: "highContrast", label: "High contrast", hint: "Stronger colour separation across the app." },
  { key: "captions", label: "Captions", hint: "Prefer captioned video and media." },
  { key: "keyboardNavigation", label: "Keyboard navigation", hint: "Clear focus order and shortcuts." },
  { key: "reducedMotion", label: "Reduced motion", hint: "Minimise transitions and animation." },
  { key: "remoteParticipation", label: "Remote participation", hint: "Prioritise remote-friendly opportunities." },
  { key: "accessibleVenue", label: "Accessible venue", hint: "Highlight venue accessibility details." },
  { key: "flexibleSchedule", label: "Flexible schedule", hint: "Surface flexible timing options." },
] as const satisfies ReadonlyArray<{ key: keyof AccessibilityStepValues; label: string; hint: string }>;

export const interestSuggestions = [
  "Artificial Intelligence",
  "Data & Analytics",
  "Software Engineering",
  "Product & Design",
  "Sustainability",
  "Manufacturing",
  "Healthcare",
  "FinTech",
  "Research",
  "Entrepreneurship",
];

export const industrySuggestions = [
  "Information Technology",
  "Consulting",
  "Manufacturing",
  "Chemicals & Energy",
  "Banking & Finance",
  "Healthcare & Pharma",
  "Education",
  "Public Sector",
  "Startups",
];

export const institutionsQueryOptions = queryOptions({
  queryKey: ["institutions", "list"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("institutions")
      .select("id, name, city, state")
      .order("name");
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60_000,
});

export const skillsCatalogueQueryOptions = queryOptions({
  queryKey: ["skills", "catalogue"],
  queryFn: async (): Promise<SkillRow[]> => {
    const { data, error } = await supabase.from("skills").select("*").order("name");
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60_000,
});

export type OnboardingState = {
  profile: {
    fullName: string;
    institutionId: string | null;
    department: string | null;
  };
  student: Database["public"]["Tables"]["student_profiles"]["Row"] | null;
  skills: { skillId: string; name: string; level: number }[];
  interests: string[];
  accessibility: Database["public"]["Tables"]["accessibility_preferences"]["Row"] | null;
};

export function onboardingQueryOptions(userId: string | undefined) {
  return queryOptions({
    queryKey: ["onboarding", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<OnboardingState> => {
      const id = userId!;
      const [profile, student, skills, interests, accessibility] = await Promise.all([
        supabase.from("profiles").select("full_name, institution_id, department").eq("id", id).maybeSingle(),
        supabase.from("student_profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("student_skills").select("skill_id, level, skills(name)").eq("student_id", id),
        supabase.from("student_interests").select("interest").eq("student_id", id),
        supabase.from("accessibility_preferences").select("*").eq("id", id).maybeSingle(),
      ]);

      return {
        profile: {
          fullName: profile.data?.full_name ?? "",
          institutionId: profile.data?.institution_id ?? null,
          department: profile.data?.department ?? null,
        },
        student: student.data ?? null,
        skills: (skills.data ?? []).map((row) => ({
          skillId: row.skill_id,
          name: (row.skills as { name: string } | null)?.name ?? "Skill",
          level: row.level,
        })),
        interests: (interests.data ?? []).map((row) => row.interest),
        accessibility: accessibility.data ?? null,
      };
    },
  });
}

export function isOnboardingComplete(state: OnboardingState | null | undefined) {
  return Boolean(state?.student?.onboarding_completed_at);
}

export async function saveAcademicStep(userId: string, values: AcademicStepValues) {
  const institutionId = values.institutionId && values.institutionId !== "other" ? values.institutionId : null;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: values.fullName,
      institution_id: institutionId,
      department: values.department,
    })
    .eq("id", userId);
  if (profileError) throw profileError;

  const { error } = await supabase.from("student_profiles").upsert(
    {
      id: userId,
      degree: values.degree,
      semester: values.semester,
      academic_score: values.academicScore,
      academic_score_type: values.academicScoreType,
      onboarding_step: 1,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function saveSkillsStep(userId: string, values: SkillsStepValues) {
  const { error: deleteError } = await supabase.from("student_skills").delete().eq("student_id", userId);
  if (deleteError) throw deleteError;

  if (values.skills.length > 0) {
    const { error } = await supabase.from("student_skills").insert(
      values.skills.map((skill) => ({
        student_id: userId,
        skill_id: skill.skillId,
        level: skill.level,
      })),
    );
    if (error) throw error;
  }

  const { error: interestsDeleteError } = await supabase
    .from("student_interests")
    .delete()
    .eq("student_id", userId);
  if (interestsDeleteError) throw interestsDeleteError;

  if (values.interests.length > 0) {
    const { error } = await supabase
      .from("student_interests")
      .insert(values.interests.map((interest) => ({ student_id: userId, interest })));
    if (error) throw error;
  }

  const { error: studentError } = await supabase.from("student_profiles").upsert(
    { id: userId, preferred_industries: values.preferredIndustries, onboarding_step: 2 },
    { onConflict: "id" },
  );
  if (studentError) throw studentError;
}

export async function saveCareerStep(userId: string, values: CareerStepValues) {
  const { error } = await supabase.from("student_profiles").upsert(
    {
      id: userId,
      career_goal: values.careerGoal,
      preferred_location: values.preferredLocation ?? null,
      preferred_work_mode: values.preferredWorkMode,
      onboarding_step: 3,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function saveAccessibilityStep(userId: string, values: AccessibilityStepValues | null) {
  if (values) {
    const { error } = await supabase.from("accessibility_preferences").upsert(
      {
        id: userId,
        screen_reader: values.screenReader,
        high_contrast: values.highContrast,
        captions: values.captions,
        keyboard_navigation: values.keyboardNavigation,
        reduced_motion: values.reducedMotion,
        remote_participation: values.remoteParticipation,
        accessible_venue: values.accessibleVenue,
        flexible_schedule: values.flexibleSchedule,
        other_accommodation: values.otherAccommodation?.trim() ? values.otherAccommodation.trim() : null,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  const { error: completeError } = await supabase.from("student_profiles").upsert(
    { id: userId, onboarding_step: 4, onboarding_completed_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (completeError) throw completeError;
}
