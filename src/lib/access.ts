import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Opportunity } from "@/lib/opportunities";

/* ------------------------------------------------------------------ */
/* Accessibility DNA — "how I learn, communicate and work best"         */
/* ------------------------------------------------------------------ */

export type DnaSection = "communication" | "learning" | "work" | "interview" | "environment";
export type SharingLevel = "private" | "institution" | "employer" | "application";

export const sharingLabels: Record<SharingLevel, string> = {
  private: "Private (only me)",
  institution: "Share with my institution",
  employer: "Share with employers I apply to",
  application: "Share only when I attach it to an application",
};

type Option = { key: string; label: string; effect: string };

export const dnaSections: { key: DnaSection; title: string; description: string; options: Option[] }[] = [
  {
    key: "communication",
    title: "Communication",
    description: "How you prefer to receive and share information.",
    options: [
      { key: "text", label: "Text preferred", effect: "Messages and updates default to written form." },
      { key: "voice", label: "Voice preferred", effect: "Read-aloud controls are shown on long pages." },
      { key: "written_instructions", label: "Written instructions", effect: "Tasks show written step lists." },
      { key: "captions", label: "Captions", effect: "Captioned media and training are highlighted." },
      { key: "transcripts", label: "Transcripts", effect: "Transcripts are suggested for audio content." },
      { key: "simple_language", label: "Simple-language instructions", effect: "“Simplify this page” is suggested." },
      { key: "extra_time", label: "Additional response time", effect: "Requests include extra response time." },
      { key: "visual", label: "Visual communication", effect: "Visual explanations are offered on lessons." },
    ],
  },
  {
    key: "learning",
    title: "Learning",
    description: "How you learn best on ABILITY360.",
    options: [
      { key: "visual", label: "Visual learning", effect: "“Explain visually” appears on lessons." },
      { key: "audio", label: "Audio learning", effect: "Lessons can be read aloud." },
      { key: "recorded", label: "Recorded material", effect: "Self-paced, recorded content is prioritised." },
      { key: "step_by_step", label: "Step-by-step instructions", effect: "Guided navigation starts automatically." },
      { key: "own_pace", label: "Adjustable learning pace", effect: "Mock tests suggest compensatory extra time." },
      { key: "simplified", label: "Simplified content", effect: "Simplify controls are suggested on lessons." },
      { key: "low_distraction", label: "Low-distraction environment", effect: "Reduced motion is recommended." },
    ],
  },
  {
    key: "work",
    title: "Work",
    description: "Conditions that help you do your best work.",
    options: [
      { key: "remote", label: "Remote", effect: "Remote roles are checked in AccessMatch." },
      { key: "hybrid", label: "Hybrid", effect: "Hybrid roles are checked in AccessMatch." },
      { key: "flexible_schedule", label: "Flexible schedule", effect: "Flexible hours are checked in AccessMatch." },
      { key: "low_distraction", label: "Low-distraction environment", effect: "Workplace info is checked." },
      { key: "accessible_workplace", label: "Accessible physical workplace", effect: "Workplace info is checked." },
      { key: "flexible_participation", label: "Flexible participation", effect: "Flexible participation is checked." },
    ],
  },
  {
    key: "interview",
    title: "Interview",
    description: "What helps you show your ability in interviews.",
    options: [
      { key: "virtual", label: "Virtual interview", effect: "Virtual-interview availability is checked." },
      { key: "written_instructions", label: "Written instructions", effect: "Suggested in accommodation requests." },
      { key: "extra_time", label: "Additional response time", effect: "Suggested in accommodation requests." },
      { key: "captioned", label: "Captioned communication", effect: "Captioning availability is checked." },
      { key: "text_based", label: "Text-based communication", effect: "Suggested in accommodation requests." },
      { key: "accessible_venue", label: "Accessible interview venue", effect: "Venue accessibility is checked." },
    ],
  },
  {
    key: "environment",
    title: "Physical & environment",
    description: "Venue and travel information you need.",
    options: [
      { key: "step_free", label: "Step-free access", effect: "Step-free access is checked." },
      { key: "washroom", label: "Accessible washroom", effect: "Washroom info is checked." },
      { key: "transport_info", label: "Accessible transportation information", effect: "Asked of employers." },
      { key: "seating", label: "Seating / accessibility assistance", effect: "Asked of employers." },
      { key: "venue_info", label: "Venue accessibility information", effect: "Asked of employers." },
    ],
  },
];

export function optionLabel(section: DnaSection, key: string) {
  return dnaSections.find((s) => s.key === section)?.options.find((o) => o.key === key)?.label ?? key;
}

export type AccessDna = Record<DnaSection, string[]> & { sharing: Partial<Record<DnaSection, SharingLevel>> };

export const emptyDna: AccessDna = {
  communication: [],
  learning: [],
  work: [],
  interview: [],
  environment: [],
  sharing: {},
};

const sectionKeys: DnaSection[] = ["communication", "learning", "work", "interview", "environment"];

export const accessDnaQueryOptions = queryOptions({
  queryKey: ["access", "dna"],
  queryFn: async (): Promise<AccessDna | null> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;
    const { data, error } = await supabase
      .from("accessibility_preferences")
      .select("communication, learning, work, interview, environment, sharing")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { ...emptyDna };
    return {
      communication: data.communication ?? [],
      learning: data.learning ?? [],
      work: data.work ?? [],
      interview: data.interview ?? [],
      environment: data.environment ?? [],
      sharing: (data.sharing ?? {}) as AccessDna["sharing"],
    };
  },
});

const dnaSchema = z.object({
  communication: z.array(z.string().max(40)).max(20),
  learning: z.array(z.string().max(40)).max(20),
  work: z.array(z.string().max(40)).max(20),
  interview: z.array(z.string().max(40)).max(20),
  environment: z.array(z.string().max(40)).max(20),
  sharing: z.record(z.string(), z.enum(["private", "institution", "employer", "application"])),
});

export async function saveAccessDna(values: AccessDna) {
  const parsed = dnaSchema.parse(values);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You need to be signed in.");
  const { error } = await supabase
    .from("accessibility_preferences")
    .upsert({ id: userData.user.id, ...parsed }, { onConflict: "id" });
  if (error) throw error;
}

export function dnaCount(dna: AccessDna | null | undefined) {
  if (!dna) return 0;
  return sectionKeys.reduce((sum, key) => sum + dna[key].length, 0);
}

/* ------------------------------------------------------------------ */
/* Employer accessibility features                                     */
/* ------------------------------------------------------------------ */

export const employerFeatures = [
  { key: "remote", label: "Remote availability" },
  { key: "hybrid", label: "Hybrid availability" },
  { key: "flexible_hours", label: "Flexible working hours" },
  { key: "accessible_interview", label: "Accessible interview process" },
  { key: "virtual_interview", label: "Virtual interview" },
  { key: "captioned_training", label: "Captioned training" },
  { key: "accessible_workplace", label: "Accessible workplace" },
  { key: "step_free", label: "Step-free access" },
  { key: "accessible_washroom", label: "Accessible washroom" },
  { key: "accessible_onboarding", label: "Accessible onboarding" },
  { key: "flexible_participation", label: "Flexible participation" },
] as const;
export type EmployerFeature = (typeof employerFeatures)[number]["key"];
export const featureLabel = (key: string) => employerFeatures.find((f) => f.key === key)?.label ?? key;

export type EmployerAccessProfile = Database["public"]["Tables"]["employer_accessibility_profiles"]["Row"];

export const myEmployerAccessQueryOptions = queryOptions({
  queryKey: ["access", "employer", "mine"],
  queryFn: async (): Promise<EmployerAccessProfile | null> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;
    const { data, error } = await supabase
      .from("employer_accessibility_profiles")
      .select("*")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const employerAccessSchema = z.object({
  features: z.array(z.string().max(40)).max(20),
  accessibility_contact: z.string().trim().max(160),
  accommodation_process: z.string().trim().max(1200),
});

export async function saveEmployerAccess(values: z.infer<typeof employerAccessSchema>) {
  const parsed = employerAccessSchema.parse(values);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You need to be signed in.");
  const { error } = await supabase.from("employer_accessibility_profiles").upsert(
    {
      id: userData.user.id,
      features: parsed.features,
      accessibility_contact: parsed.accessibility_contact || null,
      accommodation_process: parsed.accommodation_process || null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export const employerAccessMapQueryOptions = queryOptions({
  queryKey: ["access", "employer", "all"],
  queryFn: async (): Promise<Record<string, EmployerAccessProfile>> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return {};
    const { data, error } = await supabase.from("employer_accessibility_profiles").select("*");
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((row) => [row.id, row]));
  },
  staleTime: 60_000,
});

/* ------------------------------------------------------------------ */
/* AccessMatch — explainable, only from explicit information           */
/* ------------------------------------------------------------------ */

/** Student preference → employer features that satisfy it (any of). */
const requirementMap: Partial<Record<DnaSection, Record<string, EmployerFeature[]>>> = {
  communication: { captions: ["captioned_training"], transcripts: ["captioned_training"] },
  work: {
    remote: ["remote"],
    hybrid: ["hybrid", "remote"],
    flexible_schedule: ["flexible_hours"],
    low_distraction: ["accessible_workplace", "remote"],
    accessible_workplace: ["accessible_workplace"],
    flexible_participation: ["flexible_participation"],
  },
  interview: {
    virtual: ["virtual_interview"],
    written_instructions: ["accessible_interview"],
    extra_time: ["accessible_interview"],
    captioned: ["captioned_training", "accessible_interview"],
    text_based: ["accessible_interview"],
    accessible_venue: ["step_free", "virtual_interview"],
  },
  environment: {
    step_free: ["step_free"],
    washroom: ["accessible_washroom"],
    transport_info: ["accessible_workplace"],
    seating: ["accessible_workplace"],
    venue_info: ["accessible_workplace", "step_free"],
  },
};

const keywordMap: [RegExp, EmployerFeature][] = [
  [/remote interview|virtual|online interview|video interview/i, "virtual_interview"],
  [/caption|subtitle|sign language|interpreter|transcript/i, "captioned_training"],
  [/flexib(le|ility) (hours|timing|schedule)|flexi/i, "flexible_hours"],
  [/step[- ]free|ramp|wheelchair|lift|elevator/i, "step_free"],
  [/washroom|toilet|restroom/i, "accessible_washroom"],
  [/screen reader|assistive|accessible (office|workplace|campus)|ergonomic/i, "accessible_workplace"],
  [/extra time|written instruction|accessible interview|scribe/i, "accessible_interview"],
  [/onboarding/i, "accessible_onboarding"],
  [/part[- ]time|flexible participation/i, "flexible_participation"],
];

export function confirmedFeatures(opportunity: Opportunity, employer?: EmployerAccessProfile | null) {
  const set = new Map<EmployerFeature, string>();
  if (opportunity.mode === "remote") set.set("remote", "Listed as a remote role");
  if (opportunity.mode === "hybrid") set.set("hybrid", "Listed as a hybrid role");
  for (const text of opportunity.accessibility_features ?? []) {
    for (const [re, key] of keywordMap) if (re.test(text) && !set.has(key)) set.set(key, `Listed: “${text}”`);
  }
  if (opportunity.accessibility_note) {
    for (const [re, key] of keywordMap)
      if (re.test(opportunity.accessibility_note) && !set.has(key)) set.set(key, "Mentioned in the role’s accessibility note");
  }
  for (const key of employer?.features ?? []) {
    if (!set.has(key as EmployerFeature)) set.set(key as EmployerFeature, "Confirmed in the employer’s accessibility profile");
  }
  return set;
}

export type MatchLine = { preference: string; section: DnaSection; detail: string };
export type AccessMatch = {
  relevant: number;
  score: number | null;
  matches: MatchLine[];
  missing: MatchLine[];
  barriers: MatchLine[];
  questions: string[];
  platformHandled: string[];
};

export function computeAccessMatch(
  dna: AccessDna | null | undefined,
  opportunity: Opportunity,
  employer?: EmployerAccessProfile | null,
): AccessMatch {
  const result: AccessMatch = { relevant: 0, score: null, matches: [], missing: [], barriers: [], questions: [], platformHandled: [] };
  if (!dna) return result;
  const confirmed = confirmedFeatures(opportunity, employer);

  for (const section of sectionKeys) {
    const map = requirementMap[section];
    for (const pref of dna[section]) {
      const label = optionLabel(section, pref);
      const needs = map?.[pref];
      if (!needs) {
        result.platformHandled.push(label);
        continue;
      }
      result.relevant += 1;
      const hit = needs.find((f) => confirmed.has(f));
      if (hit) {
        result.matches.push({ preference: label, section, detail: confirmed.get(hit) ?? featureLabel(hit) });
        continue;
      }
      // Explicit conflicts only (never inferred from disability).
      if (section === "work" && pref === "remote" && opportunity.mode === "onsite") {
        result.barriers.push({ preference: label, section, detail: "This role is listed as on-site." });
        result.questions.push("Is any remote work possible for this role?");
        continue;
      }
      result.missing.push({ preference: label, section, detail: "Accessibility information unavailable" });
      const firstFeature = needs[0];
      result.questions.push(
        firstFeature
          ? `Can you share whether “${featureLabel(firstFeature)}” is available?`
          : "Can you share the accessibility support available for this preference?",
      );
    }
  }
  const known = result.matches.length + result.barriers.length;
  if (known > 0) result.score = Math.round((result.matches.length / result.relevant) * 100);
  result.questions = Array.from(new Set(result.questions)).slice(0, 5);
  return result;
}

/* ------------------------------------------------------------------ */
/* Remove a Barrier — rule library (suggestions, not medical advice)   */
/* ------------------------------------------------------------------ */

export const barrierLibrary = [
  {
    id: "long_text",
    barrier: "I find long written instructions difficult to process.",
    keywords: /long|written|read|text|instruction|process|dyslex|understand/i,
    supports: ["Simplified instructions", "Step-by-step checklist", "Audio version", "Visual explanation", "Written summary"],
  },
  {
    id: "travel",
    barrier: "I cannot attend an interview at the physical location.",
    keywords: /travel|attend|physical|location|venue|commute|go to/i,
    supports: ["Virtual interview", "Accessible venue", "Flexible interview scheduling"],
  },
  {
    id: "captions",
    barrier: "I need captions during training.",
    keywords: /caption|hear|audio|deaf|sound|listen/i,
    supports: ["Captioned training", "Written transcripts", "Sign-language interpreter on request"],
  },
  {
    id: "text_comm",
    barrier: "I communicate better through text.",
    keywords: /speak|talk|verbal|call|phone|stammer|stutter|text/i,
    supports: ["Text-based communication", "Written interview questions", "Chat instead of phone calls"],
  },
  {
    id: "step_free",
    barrier: "I need step-free venue access.",
    keywords: /step|stairs|wheelchair|ramp|lift|mobility|walk/i,
    supports: ["Step-free venue", "Accessible washroom", "Ground-floor interview room", "Accessible transport information"],
  },
  {
    id: "time",
    barrier: "I need more time to respond or complete tasks.",
    keywords: /time|slow|pace|rush|timed|quick|fast/i,
    supports: ["Additional response time", "Questions shared in advance", "Breaks during long sessions"],
  },
  {
    id: "focus",
    barrier: "Noisy or busy environments make it hard to focus.",
    keywords: /noise|noisy|focus|distract|busy|crowd|concentrat/i,
    supports: ["Low-distraction room", "Remote participation", "Noise-cancelling setup allowed"],
  },
] as const;

export function matchBarriers(text: string) {
  const clean = text.trim();
  if (!clean) return [];
  return barrierLibrary.filter((item) => item.keywords.test(clean));
}

export type SupportState = { label: string; state: "suggested" | "accepted" | "rejected" };
export type SavedBarrier = Database["public"]["Tables"]["accessibility_support_requests"]["Row"];

export const savedBarriersQueryOptions = queryOptions({
  queryKey: ["access", "barriers"],
  queryFn: async (): Promise<SavedBarrier[]> => {
    const { data, error } = await supabase
      .from("accessibility_support_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export async function saveBarrier(barrier: string, supports: SupportState[]) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You need to be signed in.");
  const clean = z.string().trim().min(3).max(500).parse(barrier);
  const list = supports
    .filter((s) => s.label.trim())
    .map((s) => ({ label: s.label.trim().slice(0, 160), state: s.state }))
    .slice(0, 12);
  const { error } = await supabase
    .from("accessibility_support_requests")
    .insert({ student_id: userData.user.id, barrier: clean, supports: list });
  if (error) throw error;
}

export async function deleteBarrier(id: string) {
  const { error } = await supabase.from("accessibility_support_requests").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/* Application accommodations                                          */
/* ------------------------------------------------------------------ */

export const accommodationSupports = [
  { key: "virtual_interview", label: "Virtual interview", phrase: "a virtual interview" },
  { key: "accessible_venue", label: "Accessible interview location", phrase: "an accessible interview location" },
  { key: "captions", label: "Captions", phrase: "captions during calls and training" },
  { key: "written_instructions", label: "Written instructions", phrase: "written instructions for each stage" },
  { key: "extra_time", label: "Additional response time", phrase: "some additional response time" },
  { key: "text_communication", label: "Text-based communication", phrase: "text-based communication where possible" },
  { key: "flexible_schedule", label: "Flexible scheduling", phrase: "flexible interview scheduling" },
  { key: "step_free", label: "Step-free access", phrase: "step-free access to the venue" },
  { key: "breaks", label: "Short breaks", phrase: "short breaks during longer sessions" },
] as const;

/** Map DNA interview/work/environment preferences to suggested supports. */
export function suggestedSupportsFromDna(dna: AccessDna | null | undefined): string[] {
  if (!dna) return [];
  const out = new Set<string>();
  if (dna.interview.includes("virtual")) out.add("virtual_interview");
  if (dna.interview.includes("accessible_venue")) out.add("accessible_venue");
  if (dna.interview.includes("captioned") || dna.communication.includes("captions")) out.add("captions");
  if (dna.interview.includes("written_instructions") || dna.communication.includes("written_instructions")) out.add("written_instructions");
  if (dna.interview.includes("extra_time") || dna.communication.includes("extra_time")) out.add("extra_time");
  if (dna.interview.includes("text_based") || dna.communication.includes("text")) out.add("text_communication");
  if (dna.work.includes("flexible_schedule")) out.add("flexible_schedule");
  if (dna.environment.includes("step_free")) out.add("step_free");
  return [...out];
}

export function draftAccommodationRequest(title: string, supportKeys: string[]) {
  const phrases = accommodationSupports.filter((s) => supportKeys.includes(s.key)).map((s) => s.phrase);
  if (phrases.length === 0) return "";
  const list =
    phrases.length === 1 ? phrases[0] : `${phrases.slice(0, -1).join(", ")} or ${phrases[phrases.length - 1]}`;
  return `Hello, for my application to ${title}, I would benefit from ${list}. Please let me know which options can be supported. Thank you.`;
}

export type Accommodation = Database["public"]["Tables"]["application_accommodations"]["Row"];
export type AccommodationStatus = "pending" | "accepted" | "clarification" | "alternative" | "arranged" | "withdrawn";

export const accommodationStatusLabels: Record<AccommodationStatus, string> = {
  pending: "Sent — awaiting employer",
  accepted: "Accepted by employer",
  clarification: "Employer asked for clarification",
  alternative: "Employer offered an alternative",
  arranged: "Arranged",
  withdrawn: "Withdrawn",
};

export const myAccommodationsQueryOptions = queryOptions({
  queryKey: ["access", "accommodations", "mine"],
  queryFn: async (): Promise<Accommodation[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];
    const { data, error } = await supabase
      .from("application_accommodations")
      .select("*")
      .eq("student_id", userData.user.id);
    if (error) throw error;
    return data ?? [];
  },
});

export async function sendAccommodation(input: { applicationId: string; supports: string[]; text: string }) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You need to be signed in.");
  const text = z.string().trim().min(10, "Please write a short request.").max(1500).parse(input.text);
  const { data: existing } = await supabase
    .from("application_accommodations")
    .select("id")
    .eq("application_id", input.applicationId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("application_accommodations")
      .update({ supports: input.supports, request_text: text, status: "pending" })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("application_accommodations").insert({
    application_id: input.applicationId,
    student_id: userData.user.id,
    supports: input.supports,
    request_text: text,
  });
  if (error) throw error;
}

export async function withdrawAccommodation(id: string) {
  const { error } = await supabase.from("application_accommodations").update({ status: "withdrawn" }).eq("id", id);
  if (error) throw error;
}

export function employerAccommodationQueryOptions(applicationId: string) {
  return queryOptions({
    queryKey: ["access", "accommodations", "application", applicationId],
    queryFn: async (): Promise<Accommodation | null> => {
      const { data, error } = await supabase
        .from("application_accommodations")
        .select("*")
        .eq("application_id", applicationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export async function respondToAccommodation(id: string, status: AccommodationStatus, response: string) {
  const text = z.string().trim().max(1500).parse(response);
  const { error } = await supabase
    .from("application_accommodations")
    .update({ status, employer_response: text || null })
    .eq("id", id);
  if (error) throw error;
}

/** Inclusive interview setup suggestions derived only from the request. */
export function inclusiveSetup(supports: string[]) {
  const map: Record<string, string> = {
    virtual_interview: "Send a video-call link and test it with the candidate in advance.",
    accessible_venue: "Confirm a step-free, accessible room and share directions.",
    captions: "Turn on live captions in the meeting tool.",
    written_instructions: "Share written instructions and the interview format beforehand.",
    extra_time: "Allow additional response time; do not penalise pauses.",
    text_communication: "Offer a chat channel or written answers for some questions.",
    flexible_schedule: "Offer two or three slot options.",
    step_free: "Confirm step-free entry, lift access and an accessible washroom.",
    breaks: "Build short breaks into longer sessions.",
  };
  return supports.map((s) => map[s]).filter(Boolean) as string[];
}

/* ------------------------------------------------------------------ */
/* Ability Passport sharing                                            */
/* ------------------------------------------------------------------ */

export const passportCategories = [
  { key: "skills", label: "Skills" },
  { key: "verified_skills", label: "Verified skills" },
  { key: "projects", label: "Projects" },
  { key: "internships", label: "Internships & experience" },
  { key: "competitions", label: "Competitions" },
  { key: "certifications", label: "Certifications" },
  { key: "achievements", label: "Achievements" },
  { key: "industry_feedback", label: "Industry feedback" },
  { key: "readiness", label: "Career readiness" },
  { key: "accommodations", label: "Accessibility / accommodation preferences" },
] as const;
export type PassportCategory = (typeof passportCategories)[number]["key"];

/** Career categories default to shared with employers you apply to; accessibility never does. */
export const defaultPassportSharing: Record<PassportCategory, boolean> = {
  skills: true,
  verified_skills: true,
  projects: true,
  internships: true,
  competitions: true,
  certifications: true,
  achievements: true,
  industry_feedback: true,
  readiness: true,
  accommodations: false,
};

export function passportSharingQueryOptions(studentId?: string) {
  return queryOptions({
    queryKey: ["access", "passport-sharing", studentId ?? "me"],
    queryFn: async (): Promise<Record<PassportCategory, boolean>> => {
      let id = studentId;
      if (!id) {
        const { data: userData } = await supabase.auth.getUser();
        id = userData.user?.id;
      }
      if (!id) return { ...defaultPassportSharing };
      const { data, error } = await supabase.from("passport_sharing").select("categories").eq("student_id", id).maybeSingle();
      if (error) throw error;
      return { ...defaultPassportSharing, ...((data?.categories ?? {}) as Partial<Record<PassportCategory, boolean>>) };
    },
  });
}

export async function savePassportSharing(values: Record<PassportCategory, boolean>) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You need to be signed in.");
  const { error } = await supabase
    .from("passport_sharing")
    .upsert({ student_id: userData.user.id, categories: values }, { onConflict: "student_id" });
  if (error) throw error;
}

export async function sharedAccessibilityFor(studentId: string) {
  const { data, error } = await supabase.rpc("shared_accessibility_for", { _student: studentId });
  if (error) throw error;
  return (data ?? {}) as Partial<Record<DnaSection, string[]>>;
}
