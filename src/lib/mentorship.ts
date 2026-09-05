import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MentorProfile = Database["public"]["Tables"]["mentor_profiles"]["Row"];
export type MentorshipRequest = Database["public"]["Tables"]["mentorship_requests"]["Row"];
export type MentorshipSession = Database["public"]["Tables"]["mentorship_sessions"]["Row"];
export type MentorshipFeedback = Database["public"]["Tables"]["mentorship_feedback"]["Row"];
export type RequestStatus = Database["public"]["Enums"]["mentorship_request_status"];
export type SessionStatus = Database["public"]["Enums"]["mentorship_session_status"];

export type MentorWithProfile = MentorProfile & { profiles: { full_name: string; headline: string | null } | null };

export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
};

export const sessionStatusLabels: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const mentorProfileSchema = z.object({
  headline: z.string().trim().min(4, "Add a short headline").max(140),
  bio: z.string().trim().max(2000).optional(),
  organisation: z.string().trim().max(120).optional(),
  designation: z.string().trim().max(120).optional(),
  expertise: z.string().trim().max(300).optional(),
  industries: z.string().trim().max(300).optional(),
  languages: z.string().trim().max(200).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  sessionMode: z.enum(["onsite", "remote", "hybrid"]),
  availability: z.string().trim().max(300).optional(),
  maxActiveMentees: z.coerce.number().int().min(1).max(50),
  acceptsRequests: z.boolean(),
  supportsAccessibility: z.boolean(),
});
export type MentorProfileValues = z.infer<typeof mentorProfileSchema>;

export const emptyMentorProfile: MentorProfileValues = {
  headline: "",
  bio: "",
  organisation: "",
  designation: "",
  expertise: "",
  industries: "",
  languages: "",
  yearsExperience: 1,
  sessionMode: "remote",
  availability: "",
  maxActiveMentees: 5,
  acceptsRequests: true,
  supportsAccessibility: true,
};

export function mentorToForm(row: MentorProfile): MentorProfileValues {
  return {
    headline: row.headline,
    bio: row.bio,
    organisation: row.organisation ?? "",
    designation: row.designation ?? "",
    expertise: row.expertise.join(", "),
    industries: row.industries.join(", "),
    languages: row.languages.join(", "),
    yearsExperience: row.years_experience,
    sessionMode: row.session_mode,
    availability: row.availability,
    maxActiveMentees: row.max_active_mentees,
    acceptsRequests: row.accepts_requests,
    supportsAccessibility: row.supports_accessibility,
  };
}

function splitList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export async function saveMentorProfile(values: MentorProfileValues) {
  const id = await currentUserId();
  const { error } = await supabase.from("mentor_profiles").upsert({
    id,
    headline: values.headline,
    bio: values.bio ?? "",
    organisation: values.organisation || null,
    designation: values.designation || null,
    expertise: splitList(values.expertise),
    industries: splitList(values.industries),
    languages: splitList(values.languages),
    years_experience: values.yearsExperience,
    session_mode: values.sessionMode,
    availability: values.availability ?? "",
    max_active_mentees: values.maxActiveMentees,
    accepts_requests: values.acceptsRequests,
    supports_accessibility: values.supportsAccessibility,
  });
  if (error) throw error;
}

export const mentorDirectoryQueryOptions = queryOptions({
  queryKey: ["mentorship", "directory"],
  queryFn: async (): Promise<MentorWithProfile[]> => {
    const { data, error } = await supabase
      .from("mentor_profiles")
      .select("*, profiles(full_name, headline)")
      .order("is_verified", { ascending: false });
    if (error) throw error;
    return (data ?? []) as MentorWithProfile[];
  },
  staleTime: 60_000,
});

export const myMentorProfileQueryOptions = queryOptions({
  queryKey: ["mentorship", "my-profile"],
  queryFn: async (): Promise<MentorProfile | null> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const { data } = await supabase.from("mentor_profiles").select("*").eq("id", user.id).maybeSingle();
    return data ?? null;
  },
});

export type RequestWithPeople = MentorshipRequest & {
  mentor: { full_name: string } | null;
  student: { full_name: string; department: string | null } | null;
};

export const studentMentorshipQueryOptions = queryOptions({
  queryKey: ["mentorship", "student"],
  queryFn: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;

    const [requests, sessions, feedback, skills, student] = await Promise.all([
      supabase
        .from("mentorship_requests")
        .select("*, mentor:profiles!mentorship_requests_mentor_id_fkey(full_name)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("mentorship_sessions")
        .select("*, mentor:profiles!mentorship_sessions_mentor_id_fkey(full_name)")
        .eq("student_id", user.id)
        .order("scheduled_at", { ascending: false }),
      supabase.from("mentorship_feedback").select("*"),
      supabase.from("student_skills").select("skills(name)").eq("student_id", user.id),
      supabase.from("student_profiles").select("career_goal, preferred_industries").eq("id", user.id).maybeSingle(),
    ]);

    return {
      userId: user.id,
      requests: (requests.data ?? []) as (MentorshipRequest & { mentor: { full_name: string } | null })[],
      sessions: (sessions.data ?? []) as (MentorshipSession & { mentor: { full_name: string } | null })[],
      feedback: feedback.data ?? [],
      skills: (skills.data ?? [])
        .map((row) => (row.skills as unknown as { name: string } | null)?.name)
        .filter((name): name is string => Boolean(name)),
      careerGoal: student.data?.career_goal ?? null,
      industries: student.data?.preferred_industries ?? [],
    };
  },
});

export const mentorWorkspaceQueryOptions = queryOptions({
  queryKey: ["mentorship", "mentor-workspace"],
  queryFn: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;

    const [requests, sessions, feedback] = await Promise.all([
      supabase
        .from("mentorship_requests")
        .select("*, student:profiles!mentorship_requests_student_id_fkey(full_name, department)")
        .eq("mentor_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("mentorship_sessions")
        .select("*, student:profiles!mentorship_sessions_student_id_fkey(full_name)")
        .eq("mentor_id", user.id)
        .order("scheduled_at", { ascending: false }),
      supabase.from("mentorship_feedback").select("*"),
    ]);

    return {
      userId: user.id,
      requests: (requests.data ?? []) as (MentorshipRequest & {
        student: { full_name: string; department: string | null } | null;
      })[],
      sessions: (sessions.data ?? []) as (MentorshipSession & { student: { full_name: string } | null })[],
      feedback: feedback.data ?? [],
    };
  },
});

// ---------- matching ----------

export function matchScore(
  mentor: MentorWithProfile,
  context: { skills: string[]; careerGoal: string | null; industries: string[] },
) {
  const normalise = (value: string) => value.toLowerCase().trim();
  const expertise = mentor.expertise.map(normalise);
  const industries = mentor.industries.map(normalise);

  const skillMatches = context.skills.filter((skill) => expertise.includes(normalise(skill)));
  const industryMatches = context.industries.filter((industry) => industries.includes(normalise(industry)));
  const goal = context.careerGoal ? normalise(context.careerGoal) : "";
  const goalMatch = goal
    ? expertise.some((item) => goal.includes(item) || item.includes(goal)) ||
      normalise(mentor.headline).includes(goal)
    : false;

  let score = 0;
  score += Math.min(skillMatches.length, 4) * 15;
  score += Math.min(industryMatches.length, 2) * 12;
  if (goalMatch) score += 25;
  if (mentor.accepts_requests) score += 8;
  if (mentor.is_verified) score += 6;
  score += Math.min(mentor.years_experience, 10);

  return {
    score: Math.min(100, score),
    skillMatches,
    industryMatches,
    goalMatch,
  };
}

// ---------- mutations ----------

export const requestSchema = z.object({
  goal: z.string().trim().min(4, "What do you want help with?").max(160),
  message: z.string().trim().min(10, "Add a short message").max(1200),
});
export type RequestValues = z.infer<typeof requestSchema>;

export async function sendMentorshipRequest(mentorId: string, values: RequestValues, focusSkills: string[]) {
  const studentId = await currentUserId();
  const { error } = await supabase.from("mentorship_requests").upsert(
    {
      student_id: studentId,
      mentor_id: mentorId,
      goal: values.goal,
      message: values.message,
      focus_skills: focusSkills,
      status: "pending" as const,
    },
    { onConflict: "student_id,mentor_id" },
  );
  if (error) throw error;
}

export async function respondToRequest(id: string, status: RequestStatus, note: string) {
  const { error } = await supabase
    .from("mentorship_requests")
    .update({ status, response_note: note })
    .eq("id", id);
  if (error) throw error;
}

export async function withdrawRequest(id: string) {
  const { error } = await supabase.from("mentorship_requests").delete().eq("id", id);
  if (error) throw error;
}

export const sessionSchema = z.object({
  topic: z.string().trim().min(3, "Add a topic").max(140),
  agenda: z.string().trim().max(1000).optional(),
  scheduledAt: z.string().min(1, "Pick a date and time"),
  durationMinutes: z.coerce.number().int().min(15).max(180),
  mode: z.enum(["onsite", "remote", "hybrid"]),
  meetingLink: z.string().trim().url("Enter a valid link").optional().or(z.literal("")),
});
export type SessionValues = z.infer<typeof sessionSchema>;

export async function scheduleSession(input: {
  requestId: string;
  mentorId: string;
  studentId: string;
  values: SessionValues;
}) {
  const { error } = await supabase.from("mentorship_sessions").insert({
    request_id: input.requestId,
    mentor_id: input.mentorId,
    student_id: input.studentId,
    topic: input.values.topic,
    agenda: input.values.agenda ?? "",
    scheduled_at: new Date(input.values.scheduledAt).toISOString(),
    duration_minutes: input.values.durationMinutes,
    mode: input.values.mode,
    meeting_link: input.values.meetingLink || null,
  });
  if (error) throw error;
}

export async function setSessionStatus(id: string, status: SessionStatus, summary?: string) {
  const { error } = await supabase
    .from("mentorship_sessions")
    .update(summary === undefined ? { status } : { status, summary })
    .eq("id", id);
  if (error) throw error;
}

export async function saveSessionFeedback(sessionId: string, rating: number, body: string) {
  const authorId = await currentUserId();
  const { error } = await supabase
    .from("mentorship_feedback")
    .upsert({ session_id: sessionId, author_id: authorId, rating, body }, { onConflict: "session_id,author_id" });
  if (error) throw error;
}

export function formatSessionTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
