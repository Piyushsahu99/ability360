import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Opportunity } from "@/lib/opportunities";

export type ApplicationStatus = Database["public"]["Enums"]["application_status"];
export type ApplicationDocumentKind = Database["public"]["Enums"]["application_document_kind"];
export type ApplicationRow = Database["public"]["Tables"]["opportunity_applications"]["Row"];
export type ApplicationEvent = Database["public"]["Tables"]["application_events"]["Row"];
export type ApplicationDocument = Database["public"]["Tables"]["application_documents"]["Row"];

export type ApplicationWithOpportunity = ApplicationRow & {
  opportunities: Opportunity | null;
};

export const applicationStatuses = [
  "saved",
  "preparing",
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
  "completed",
] as const;

export const statusLabels: Record<ApplicationStatus, string> = {
  saved: "Saved",
  preparing: "Preparing",
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  rejected: "Rejected",
  completed: "Completed",
};

export const statusHint: Record<ApplicationStatus, string> = {
  saved: "Bookmarked for later — no documents needed yet.",
  preparing: "Getting documents and evidence ready.",
  applied: "Application submitted to the organisation.",
  shortlisted: "Your profile passed the first screen.",
  interview: "Interview scheduled or in progress.",
  selected: "Offer received — congratulations.",
  rejected: "Not moving forward this time.",
  completed: "Engagement finished.",
};

export const documentKindLabels: Record<ApplicationDocumentKind, string> = {
  resume: "Resume / CV",
  cover_letter: "Cover letter",
  certificate: "Certificate",
  portfolio: "Portfolio",
  transcript: "Transcript",
  other: "Other",
};

/** Documents an application should carry before it is submitted. */
export const requiredDocumentKinds: ApplicationDocumentKind[] = ["resume"];

export const activeStatuses: ApplicationStatus[] = [
  "preparing",
  "applied",
  "shortlisted",
  "interview",
];

export const closedStatuses: ApplicationStatus[] = ["selected", "rejected", "completed"];

export const applicationsQueryOptions = queryOptions({
  queryKey: ["student", "applications"],
  queryFn: async (): Promise<ApplicationWithOpportunity[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return [];

    const { data, error } = await supabase
      .from("opportunity_applications")
      .select("*, opportunities(*)")
      .eq("student_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ApplicationWithOpportunity[];
  },
  staleTime: 30_000,
});

export function applicationDetailQueryOptions(applicationId: string) {
  return queryOptions({
    queryKey: ["student", "application", applicationId],
    queryFn: async () => {
      const [{ data: events, error: eventsError }, { data: documents, error: docsError }] =
        await Promise.all([
          supabase
            .from("application_events")
            .select("*")
            .eq("application_id", applicationId)
            .order("created_at", { ascending: false }),
          supabase
            .from("application_documents")
            .select("*")
            .eq("application_id", applicationId)
            .order("created_at", { ascending: false }),
        ]);

      if (eventsError) throw eventsError;
      if (docsError) throw docsError;
      return {
        events: (events ?? []) as ApplicationEvent[],
        documents: (documents ?? []) as ApplicationDocument[],
      };
    },
    staleTime: 15_000,
  });
}

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You need to sign in to manage applications.");
  return data.user.id;
}

export async function saveOpportunity(opportunity: Opportunity) {
  const studentId = await requireUserId();
  const { data, error } = await supabase
    .from("opportunity_applications")
    .upsert(
      {
        student_id: studentId,
        opportunity_id: opportunity.id,
        deadline: opportunity.deadline,
      },
      { onConflict: "student_id,opportunity_id", ignoreDuplicates: true },
    )
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function removeApplication(applicationId: string) {
  const { error } = await supabase
    .from("opportunity_applications")
    .delete()
    .eq("id", applicationId);
  if (error) throw error;
}

export async function setApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  note?: string,
) {
  const patch: Database["public"]["Tables"]["opportunity_applications"]["Update"] = { status };
  if (status === "applied") patch.applied_at = new Date().toISOString();
  if (typeof note === "string") patch.note = note;

  const { error } = await supabase
    .from("opportunity_applications")
    .update(patch)
    .eq("id", applicationId);
  if (error) throw error;
}

export async function saveApplicationNote(applicationId: string, note: string) {
  const { error } = await supabase
    .from("opportunity_applications")
    .update({ note })
    .eq("id", applicationId);
  if (error) throw error;
}

export async function addDocumentLink(input: {
  applicationId: string;
  kind: ApplicationDocumentKind;
  name: string;
  link: string;
}) {
  const studentId = await requireUserId();
  const { error } = await supabase.from("application_documents").insert({
    application_id: input.applicationId,
    student_id: studentId,
    kind: input.kind,
    name: input.name,
    link: input.link,
  });
  if (error) throw error;
}

export async function uploadDocument(input: {
  applicationId: string;
  kind: ApplicationDocumentKind;
  file: File;
}) {
  const studentId = await requireUserId();
  const safeName = input.file.name.replace(/[^\w.-]+/g, "-");
  const path = `${studentId}/${input.applicationId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("application-documents")
    .upload(path, input.file, { upsert: false });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("application_documents").insert({
    application_id: input.applicationId,
    student_id: studentId,
    kind: input.kind,
    name: input.file.name,
    storage_path: path,
  });
  if (error) throw error;
}

export async function removeDocument(document: ApplicationDocument) {
  if (document.storage_path) {
    await supabase.storage.from("application-documents").remove([document.storage_path]);
  }
  const { error } = await supabase.from("application_documents").delete().eq("id", document.id);
  if (error) throw error;
}

export async function documentUrl(document: ApplicationDocument) {
  if (document.link) return document.link;
  if (!document.storage_path) return null;
  const { data, error } = await supabase.storage
    .from("application-documents")
    .createSignedUrl(document.storage_path, 60);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

/* ---------------- Eligibility ---------------- */

export type EligibilityCheck = { label: string; passed: boolean; detail: string };
export type EligibilityResult = {
  checks: EligibilityCheck[];
  matchedSkills: string[];
  missingSkills: string[];
  score: number;
  eligible: boolean;
};

function normalise(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function checkEligibility(input: {
  opportunity: Opportunity;
  studentSkills: string[];
  profileComplete: boolean;
  preferredMode?: string | null;
}): EligibilityResult {
  const owned = new Set(input.studentSkills.map(normalise));
  const tags = input.opportunity.tags ?? [];
  const matchedSkills = tags.filter((tag) => owned.has(normalise(tag)));
  const missing = tags.filter((tag) => !owned.has(normalise(tag)));

  const deadlineOk =
    !input.opportunity.deadline ||
    new Date(`${input.opportunity.deadline}T23:59:59`).getTime() >= Date.now();

  const skillRatio = tags.length === 0 ? 1 : matchedSkills.length / tags.length;

  const checks: EligibilityCheck[] = [
    {
      label: "Application window open",
      passed: deadlineOk,
      detail: deadlineOk ? "You can still apply." : "The deadline has passed.",
    },
    {
      label: "Profile ready",
      passed: input.profileComplete,
      detail: input.profileComplete
        ? "Your onboarding profile is complete."
        : "Finish onboarding so employers see your details.",
    },
    {
      label: "Skill match",
      passed: skillRatio >= 0.34,
      detail:
        tags.length === 0
          ? "No specific skills listed for this role."
          : `${matchedSkills.length} of ${tags.length} listed skills matched.`,
    },
    {
      label: "Work mode fits your preference",
      passed: !input.preferredMode || input.preferredMode === input.opportunity.mode,
      detail: input.preferredMode
        ? `You prefer ${input.preferredMode}; this role is ${input.opportunity.mode}.`
        : "No work-mode preference saved.",
    },
  ];

  return {
    checks,
    matchedSkills,
    missingSkills: missing,
    score: Math.round(skillRatio * 100),
    eligible: deadlineOk && skillRatio >= 0.34,
  };
}

export function daysUntil(deadline: string | null) {
  if (!deadline) return null;
  const diff = new Date(`${deadline}T23:59:59`).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export const eligibilityContextQueryOptions = queryOptions({
  queryKey: ["student", "eligibility-context"],
  queryFn: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return { skills: [] as string[], profileComplete: false, preferredMode: null as string | null };

    const [{ data: profile }, { data: skills }] = await Promise.all([
      supabase
        .from("student_profiles")
        .select("onboarding_completed_at, preferred_work_mode")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("student_skills").select("skills(name)").eq("student_id", user.id),
    ]);

    return {
      skills: ((skills ?? []) as { skills: { name: string } | null }[])
        .map((row) => row.skills?.name)
        .filter((name): name is string => Boolean(name)),
      profileComplete: Boolean(profile?.onboarding_completed_at),
      preferredMode: profile?.preferred_work_mode ?? null,
    };
  },
  staleTime: 60_000,
});
