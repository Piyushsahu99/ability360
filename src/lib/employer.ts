import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { ApplicationStatus } from "@/lib/applications";
import type { Opportunity, OpportunityType, WorkMode } from "@/lib/opportunities";

export type CompanyProfile = Database["public"]["Tables"]["company_profiles"]["Row"];

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in to manage your employer workspace.");
  return data.user.id;
}

/* ---------------- Company profile ---------------- */

export const companyProfileSchema = z.object({
  company_name: z.string().trim().min(2, "Company name is required").max(120),
  website: z.string().trim().url("Enter a valid URL").or(z.literal("")),
  industry: z.string().trim().max(80),
  company_size: z.string().trim().max(40),
  headquarters: z.string().trim().max(120),
  about: z.string().trim().max(2000),
  is_inclusive_employer: z.boolean(),
  accessibility_commitment: z.string().trim().max(1000),
});
export type CompanyProfileValues = z.infer<typeof companyProfileSchema>;

export const companyProfileQueryOptions = queryOptions({
  queryKey: ["employer", "company-profile"],
  queryFn: async (): Promise<CompanyProfile | null> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const { data, error } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  staleTime: 30_000,
});

export async function saveCompanyProfile(values: CompanyProfileValues) {
  const id = await requireUserId();
  const { error } = await supabase.from("company_profiles").upsert({
    id,
    company_name: values.company_name,
    website: values.website || null,
    industry: values.industry || null,
    company_size: values.company_size || null,
    headquarters: values.headquarters || null,
    about: values.about,
    is_inclusive_employer: values.is_inclusive_employer,
    accessibility_commitment: values.accessibility_commitment || null,
  });
  if (error) throw error;
}

export function companyProfileCompleteness(profile: CompanyProfile | null) {
  if (!profile) return 0;
  const fields = [
    profile.company_name,
    profile.website,
    profile.industry,
    profile.company_size,
    profile.headquarters,
    profile.about,
  ];
  const filled = fields.filter((value) => Boolean(value && String(value).trim())).length;
  return Math.round((filled / fields.length) * 100);
}

/* ---------------- Opportunities ---------------- */

export const opportunityFormSchema = z.object({
  title: z.string().trim().min(3, "Add a role title").max(120),
  organisation: z.string().trim().min(2, "Add the organisation name").max(120),
  type: z.enum([
    "internship",
    "job",
    "project",
    "training",
    "apprenticeship",
    "challenge",
    "mentorship",
  ]),
  mode: z.enum(["onsite", "remote", "hybrid"]),
  location: z.string().trim().min(2, "Add a location").max(120),
  description: z.string().trim().min(20, "Describe the opportunity in at least 20 characters"),
  tagsText: z.string().trim().max(300),
  stipend: z.string().trim().max(80),
  deadline: z.string().trim(),
  is_inclusive_employer: z.boolean(),
  accessibility_featuresText: z.string().trim().max(300),
  accessibility_note: z.string().trim().max(500),
  is_published: z.boolean(),
});
export type OpportunityFormValues = z.infer<typeof opportunityFormSchema>;

export function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const emptyOpportunityForm: OpportunityFormValues = {
  title: "",
  organisation: "",
  type: "internship",
  mode: "hybrid",
  location: "",
  description: "",
  tagsText: "",
  stipend: "",
  deadline: "",
  is_inclusive_employer: false,
  accessibility_featuresText: "",
  accessibility_note: "",
  is_published: false,
};

export function opportunityToForm(opportunity: Opportunity): OpportunityFormValues {
  return {
    title: opportunity.title,
    organisation: opportunity.organisation,
    type: opportunity.type as OpportunityFormValues["type"],
    mode: opportunity.mode as WorkMode,
    location: opportunity.location,
    description: opportunity.description,
    tagsText: (opportunity.tags ?? []).join(", "),
    stipend: opportunity.stipend ?? "",
    deadline: opportunity.deadline ?? "",
    is_inclusive_employer: opportunity.is_inclusive_employer,
    accessibility_featuresText: (opportunity.accessibility_features ?? []).join(", "),
    accessibility_note: opportunity.accessibility_note ?? "",
    is_published: opportunity.is_published,
  };
}

function formToRow(values: OpportunityFormValues) {
  return {
    title: values.title,
    organisation: values.organisation,
    type: values.type as OpportunityType,
    mode: values.mode as WorkMode,
    location: values.location,
    description: values.description,
    tags: splitList(values.tagsText),
    stipend: values.stipend || null,
    deadline: values.deadline || null,
    is_inclusive_employer: values.is_inclusive_employer,
    accessibility_features: splitList(values.accessibility_featuresText),
    accessibility_note: values.accessibility_note || null,
    is_published: values.is_published,
  };
}

export const employerOpportunitiesQueryOptions = queryOptions({
  queryKey: ["employer", "opportunities"],
  queryFn: async (): Promise<Opportunity[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return [];
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("posted_by", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 15_000,
});

export async function createOpportunity(values: OpportunityFormValues) {
  const postedBy = await requireUserId();
  const { error } = await supabase
    .from("opportunities")
    .insert({ ...formToRow(values), posted_by: postedBy });
  if (error) throw error;
}

export async function updateOpportunity(id: string, values: OpportunityFormValues) {
  const { error } = await supabase.from("opportunities").update(formToRow(values)).eq("id", id);
  if (error) throw error;
}

export async function setOpportunityPublished(id: string, isPublished: boolean) {
  const { error } = await supabase
    .from("opportunities")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteOpportunity(id: string) {
  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Applicants ---------------- */

export type ApplicantRow = Database["public"]["Tables"]["opportunity_applications"]["Row"] & {
  opportunities: Opportunity;
  profiles: {
    full_name: string;
    headline: string | null;
    department: string | null;
    year_of_study: number | null;
  } | null;
  academic: {
    degree: string | null;
    semester: number | null;
    academic_score: number | null;
    career_goal: string | null;
    preferred_work_mode: WorkMode | null;
  } | null;
};

export const employerApplicantsQueryOptions = queryOptions({
  queryKey: ["employer", "applicants"],
  queryFn: async (): Promise<ApplicantRow[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return [];

    const { data, error } = await supabase
      .from("opportunity_applications")
      .select("*, opportunities!inner(*), profiles(full_name, headline, department, year_of_study)")
      .eq("opportunities.posted_by", user.id)
      .neq("status", "saved")
      .order("status_changed_at", { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as unknown as ApplicantRow[];
    const studentIds = [...new Set(rows.map((row) => row.student_id))];
    if (studentIds.length === 0) return rows;

    const { data: academics } = await supabase
      .from("student_profiles")
      .select("id, degree, semester, academic_score, career_goal, preferred_work_mode")
      .in("id", studentIds);

    const byId = new Map((academics ?? []).map((item) => [item.id, item]));
    return rows.map((row) => ({ ...row, academic: byId.get(row.student_id) ?? null }));
  },
  staleTime: 15_000,
});

export function applicantDocumentsQueryOptions(applicationId: string) {
  return queryOptions({
    queryKey: ["employer", "applicant-documents", applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_documents")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15_000,
  });
}

export async function updateApplicationStage(id: string, status: ApplicationStatus) {
  const { error } = await supabase.from("opportunity_applications").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function saveCandidateFeedback(input: {
  id: string;
  feedback: string;
  rating: number | null;
  interviewAt: string | null;
}) {
  const { error } = await supabase
    .from("opportunity_applications")
    .update({
      employer_feedback: input.feedback || null,
      employer_rating: input.rating,
      interview_at: input.interviewAt || null,
    })
    .eq("id", input.id);
  if (error) throw error;
}

/** Stages an employer can move a candidate through. */
export const employerStages: ApplicationStatus[] = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
  "completed",
];

export const pipelineStages: ApplicationStatus[] = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
];

/* ---------------- Company verification ---------------- */

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export const verificationLabels: Record<VerificationStatus, string> = {
  unverified: "Not verified",
  pending: "Verification in review",
  verified: "Verified employer",
  rejected: "Verification declined",
};

export const verificationHints: Record<VerificationStatus, string> = {
  unverified:
    "Complete your company profile and request verification so students can trust your postings.",
  pending: "Our team is reviewing your details. You can keep posting while this is in review.",
  verified: "Your company is verified. Students see a verified badge on every opportunity.",
  rejected: "We could not verify these details. Update your profile and request a review again.",
};

export function verificationStatusOf(profile: CompanyProfile | null): VerificationStatus {
  const value = (profile?.verification_status ?? "unverified") as VerificationStatus;
  return (["unverified", "pending", "verified", "rejected"] as const).includes(value)
    ? value
    : "unverified";
}

export async function requestCompanyVerification() {
  const id = await requireUserId();
  const { error } = await supabase
    .from("company_profiles")
    .update({ verification_status: "pending", verification_requested_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/* ---------------- Applicant passport ---------------- */

export type ApplicantPassport = {
  skills: { id: string; level: number; verification_status: string; name: string }[];
  projects: Database["public"]["Tables"]["student_projects"]["Row"][];
  achievements: Database["public"]["Tables"]["student_achievements"]["Row"][];
  experiences: Database["public"]["Tables"]["student_experiences"]["Row"][];
};

export function applicantPassportQueryOptions(studentId: string) {
  return queryOptions({
    queryKey: ["employer", "applicant-passport", studentId],
    queryFn: async (): Promise<ApplicantPassport> => {
      const [skills, projects, achievements, experiences] = await Promise.all([
        supabase
          .from("student_skills")
          .select("id, level, verification_status, skills(name)")
          .eq("student_id", studentId),
        supabase
          .from("student_projects")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false }),
        supabase
          .from("student_achievements")
          .select("*")
          .eq("student_id", studentId)
          .order("achieved_on", { ascending: false, nullsFirst: false }),
        supabase
          .from("student_experiences")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false }),
      ]);

      return {
        skills: (skills.data ?? []).map((row) => ({
          id: row.id,
          level: row.level,
          verification_status: row.verification_status,
          name: (row as unknown as { skills: { name: string } | null }).skills?.name ?? "Skill",
        })),
        projects: projects.data ?? [],
        achievements: achievements.data ?? [],
        experiences: experiences.data ?? [],
      };
    },
    staleTime: 30_000,
  });
}
