import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Competition = Database["public"]["Tables"]["competitions"]["Row"];
export type CompetitionTeam = Database["public"]["Tables"]["competition_teams"]["Row"];
export type TeamMember = Database["public"]["Tables"]["competition_team_members"]["Row"];
export type Registration = Database["public"]["Tables"]["competition_registrations"]["Row"];
export type Submission = Database["public"]["Tables"]["competition_submissions"]["Row"];
export type Score = Database["public"]["Tables"]["competition_scores"]["Row"];
export type Award = Database["public"]["Tables"]["competition_awards"]["Row"];
export type LeaderboardRow = Database["public"]["Functions"]["competition_leaderboard"]["Returns"][number];
export type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

export const competitionCategories = [
  "hackathon",
  "case_study",
  "coding",
  "design",
  "innovation",
  "research",
  "quiz",
] as const;

export const competitionCategoryLabels: Record<string, string> = {
  hackathon: "Hackathon",
  case_study: "Case study",
  coding: "Coding contest",
  design: "Design challenge",
  innovation: "Innovation challenge",
  research: "Research challenge",
  quiz: "Quiz",
};

export const competitionStatusLabels: Record<CompetitionStatus, string> = {
  draft: "Draft",
  open: "Registrations open",
  judging: "Judging in progress",
  completed: "Completed",
};

export const competitionSchema = z.object({
  title: z.string().trim().min(3, "Add a title").max(140),
  organisation: z.string().trim().min(2, "Add the organiser").max(120),
  category: z.enum(competitionCategories),
  summary: z.string().trim().max(300).optional(),
  description: z.string().trim().max(4000).optional(),
  skills: z.string().trim().max(300).optional(),
  mode: z.enum(["onsite", "remote", "hybrid"]),
  location: z.string().trim().max(120).optional(),
  teamMin: z.coerce.number().int().min(1).max(10),
  teamMax: z.coerce.number().int().min(1).max(10),
  registrationDeadline: z.string().optional(),
  submissionDeadline: z.string().optional(),
  prizeDetails: z.string().trim().max(1000).optional(),
  rules: z.string().trim().max(4000).optional(),
  status: z.enum(["draft", "open", "judging", "completed"]),
  isPublished: z.boolean(),
  isInclusive: z.boolean(),
  accessibilityNote: z.string().trim().max(600).optional(),
});
export type CompetitionValues = z.infer<typeof competitionSchema>;

export const emptyCompetition: CompetitionValues = {
  title: "",
  organisation: "",
  category: "hackathon",
  summary: "",
  description: "",
  skills: "",
  mode: "remote",
  location: "Online",
  teamMin: 1,
  teamMax: 4,
  registrationDeadline: "",
  submissionDeadline: "",
  prizeDetails: "",
  rules: "",
  status: "open",
  isPublished: true,
  isInclusive: true,
  accessibilityNote: "",
};

export function competitionToForm(row: Competition): CompetitionValues {
  return {
    title: row.title,
    organisation: row.organisation,
    category: (competitionCategories as readonly string[]).includes(row.category)
      ? (row.category as CompetitionValues["category"])
      : "hackathon",
    summary: row.summary,
    description: row.description,
    skills: row.skills.join(", "),
    mode: row.mode,
    location: row.location,
    teamMin: row.team_min,
    teamMax: row.team_max,
    registrationDeadline: row.registration_deadline ?? "",
    submissionDeadline: row.submission_deadline ?? "",
    prizeDetails: row.prize_details,
    rules: row.rules,
    status: row.status,
    isPublished: row.is_published,
    isInclusive: row.is_inclusive,
    accessibilityNote: row.accessibility_note ?? "",
  };
}

function splitList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formToRow(values: CompetitionValues) {
  return {
    title: values.title,
    organisation: values.organisation,
    category: values.category,
    summary: values.summary ?? "",
    description: values.description ?? "",
    skills: splitList(values.skills),
    mode: values.mode,
    location: values.location || "Online",
    team_min: values.teamMin,
    team_max: Math.max(values.teamMax, values.teamMin),
    registration_deadline: values.registrationDeadline || null,
    submission_deadline: values.submissionDeadline || null,
    prize_details: values.prizeDetails ?? "",
    rules: values.rules ?? "",
    status: values.status,
    is_published: values.isPublished,
    is_inclusive: values.isInclusive,
    accessibility_note: values.accessibilityNote || null,
  };
}

export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export const competitionsQueryOptions = queryOptions({
  queryKey: ["competitions", "published"],
  queryFn: async (): Promise<Competition[]> => {
    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .eq("is_published", true)
      .order("registration_deadline", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});

export function competitionQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["competitions", "detail", id],
    queryFn: async () => {
      const [competition, teams, members, awards, leaderboard] = await Promise.all([
        supabase.from("competitions").select("*").eq("id", id).maybeSingle(),
        supabase.from("competition_teams").select("*").eq("competition_id", id).order("created_at"),
        supabase.from("competition_team_members").select("*, profiles(full_name)"),
        supabase.from("competition_awards").select("*, profiles(full_name)").eq("competition_id", id).order("rank_position"),
        supabase.rpc("competition_leaderboard", { _competition: id }),
      ]);
      if (competition.error) throw competition.error;

      const teamIds = new Set((teams.data ?? []).map((team) => team.id));
      return {
        competition: competition.data,
        teams: teams.data ?? [],
        members: (members.data ?? []).filter((member) => teamIds.has(member.team_id)) as (TeamMember & {
          profiles: { full_name: string } | null;
        })[],
        awards: (awards.data ?? []) as (Award & { profiles: { full_name: string } | null })[],
        leaderboard: ((leaderboard.data ?? []) as LeaderboardRow[]).sort(
          (a, b) => Number(a.rank_position) - Number(b.rank_position),
        ),
      };
    },
  });
}

export function myCompetitionStateQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["competitions", "mine", id],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const [registration, submission, memberships] = await Promise.all([
        supabase
          .from("competition_registrations")
          .select("*")
          .eq("competition_id", id)
          .eq("student_id", user.id)
          .maybeSingle(),
        supabase
          .from("competition_submissions")
          .select("*")
          .eq("competition_id", id)
          .eq("student_id", user.id)
          .maybeSingle(),
        supabase.from("competition_team_members").select("*").eq("student_id", user.id),
      ]);

      return {
        userId: user.id,
        registration: registration.data ?? null,
        submission: submission.data ?? null,
        memberships: memberships.data ?? [],
      };
    },
  });
}

export const myCompetitionsQueryOptions = queryOptions({
  queryKey: ["competitions", "my-registrations"],
  queryFn: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return [];
    const { data, error } = await supabase
      .from("competition_registrations")
      .select("*, competitions(*)")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as (Registration & { competitions: Competition | null })[];
  },
});

export const organiserCompetitionsQueryOptions = queryOptions({
  queryKey: ["competitions", "organiser"],
  queryFn: async () => {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export function organiserCompetitionDetailQueryOptions(id: string | null) {
  return queryOptions({
    queryKey: ["competitions", "organiser-detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return null;
      const [registrations, submissions, scores, judges, awards, leaderboard] = await Promise.all([
        supabase
          .from("competition_registrations")
          .select("*, profiles(full_name, department)")
          .eq("competition_id", id),
        supabase.from("competition_submissions").select("*, profiles(full_name)").eq("competition_id", id),
        supabase.from("competition_scores").select("*").eq("competition_id", id),
        supabase.from("competition_judges").select("*, profiles(full_name)").eq("competition_id", id),
        supabase.from("competition_awards").select("*, profiles(full_name)").eq("competition_id", id),
        supabase.rpc("competition_leaderboard", { _competition: id }),
      ]);

      return {
        registrations: (registrations.data ?? []) as (Registration & {
          profiles: { full_name: string; department: string | null } | null;
        })[],
        submissions: (submissions.data ?? []) as (Submission & { profiles: { full_name: string } | null })[],
        scores: scores.data ?? [],
        judges: (judges.data ?? []) as { id: string; judge_id: string; profiles: { full_name: string } | null }[],
        awards: (awards.data ?? []) as (Award & { profiles: { full_name: string } | null })[],
        leaderboard: ((leaderboard.data ?? []) as LeaderboardRow[]).sort(
          (a, b) => Number(a.rank_position) - Number(b.rank_position),
        ),
      };
    },
  });
}

export const judgeCompetitionsQueryOptions = queryOptions({
  queryKey: ["competitions", "judging"],
  queryFn: async () => {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("competition_judges")
      .select("*, competitions(*)")
      .eq("judge_id", userId);
    if (error) throw error;
    return (data ?? []) as { id: string; competition_id: string; competitions: Competition | null }[];
  },
});

export function judgingQueueQueryOptions(competitionId: string | null) {
  return queryOptions({
    queryKey: ["competitions", "judging-queue", competitionId],
    enabled: Boolean(competitionId),
    queryFn: async () => {
      if (!competitionId) return null;
      const userId = await currentUserId();
      const [submissions, scores] = await Promise.all([
        supabase.from("competition_submissions").select("*, profiles(full_name)").eq("competition_id", competitionId),
        supabase.from("competition_scores").select("*").eq("competition_id", competitionId).eq("judge_id", userId),
      ]);
      return {
        userId,
        submissions: (submissions.data ?? []) as (Submission & { profiles: { full_name: string } | null })[],
        scores: scores.data ?? [],
      };
    },
  });
}

// ---------- mutations ----------

export async function createCompetition(values: CompetitionValues) {
  const userId = await currentUserId();
  const { error } = await supabase.from("competitions").insert({ ...formToRow(values), created_by: userId });
  if (error) throw error;
}

export async function updateCompetition(id: string, values: CompetitionValues) {
  const { error } = await supabase.from("competitions").update(formToRow(values)).eq("id", id);
  if (error) throw error;
}

export async function deleteCompetition(id: string) {
  const { error } = await supabase.from("competitions").delete().eq("id", id);
  if (error) throw error;
}

export async function registerForCompetition(competitionId: string, motivation: string, accommodation: string) {
  const studentId = await currentUserId();
  const { error } = await supabase.from("competition_registrations").upsert(
    {
      competition_id: competitionId,
      student_id: studentId,
      motivation,
      accommodation_note: accommodation || null,
      status: "registered" as const,
    },
    { onConflict: "competition_id,student_id" },
  );
  if (error) throw error;
}

export async function withdrawRegistration(id: string) {
  const { error } = await supabase.from("competition_registrations").update({ status: "withdrawn" }).eq("id", id);
  if (error) throw error;
}

export async function createTeam(competitionId: string, name: string, pitch: string) {
  const leaderId = await currentUserId();
  const { data, error } = await supabase
    .from("competition_teams")
    .insert({ competition_id: competitionId, name, pitch, leader_id: leaderId })
    .select("id")
    .single();
  if (error) throw error;

  const { error: memberError } = await supabase
    .from("competition_team_members")
    .insert({ team_id: data.id, student_id: leaderId, role_label: "Team lead" });
  if (memberError) throw memberError;

  await supabase
    .from("competition_registrations")
    .update({ team_id: data.id })
    .eq("competition_id", competitionId)
    .eq("student_id", leaderId);
  return data.id;
}

export async function joinTeam(competitionId: string, teamId: string) {
  const studentId = await currentUserId();
  const { error } = await supabase
    .from("competition_team_members")
    .insert({ team_id: teamId, student_id: studentId });
  if (error) throw error;
  await supabase
    .from("competition_registrations")
    .update({ team_id: teamId })
    .eq("competition_id", competitionId)
    .eq("student_id", studentId);
}

export async function leaveTeam(competitionId: string, teamId: string) {
  const studentId = await currentUserId();
  const { error } = await supabase
    .from("competition_team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("student_id", studentId);
  if (error) throw error;
  await supabase
    .from("competition_registrations")
    .update({ team_id: null })
    .eq("competition_id", competitionId)
    .eq("student_id", studentId);
}

export const submissionSchema = z.object({
  title: z.string().trim().min(3, "Add a submission title").max(140),
  summary: z.string().trim().max(2000).optional(),
  demoLink: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  repoLink: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
});
export type SubmissionValues = z.infer<typeof submissionSchema>;

export async function saveSubmission(competitionId: string, teamId: string | null, values: SubmissionValues) {
  const studentId = await currentUserId();
  const { error } = await supabase.from("competition_submissions").upsert(
    {
      competition_id: competitionId,
      student_id: studentId,
      team_id: teamId,
      title: values.title,
      summary: values.summary ?? "",
      demo_link: values.demoLink || null,
      repo_link: values.repoLink || null,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "competition_id,student_id" },
  );
  if (error) throw error;

  await supabase
    .from("competition_registrations")
    .update({ status: "submitted" })
    .eq("competition_id", competitionId)
    .eq("student_id", studentId);
}

export async function addJudge(competitionId: string, judgeId: string) {
  const invitedBy = await currentUserId();
  const { error } = await supabase
    .from("competition_judges")
    .insert({ competition_id: competitionId, judge_id: judgeId, invited_by: invitedBy });
  if (error) throw error;
}

export async function removeJudge(id: string) {
  const { error } = await supabase.from("competition_judges").delete().eq("id", id);
  if (error) throw error;
}

export async function saveScore(input: {
  competitionId: string;
  submissionId: string;
  innovation: number;
  technical: number;
  impact: number;
  presentation: number;
  note: string;
}) {
  const judgeId = await currentUserId();
  const { error } = await supabase.from("competition_scores").upsert(
    {
      competition_id: input.competitionId,
      submission_id: input.submissionId,
      judge_id: judgeId,
      innovation: input.innovation,
      technical: input.technical,
      impact: input.impact,
      presentation: input.presentation,
      note: input.note,
    },
    { onConflict: "submission_id,judge_id" },
  );
  if (error) throw error;
}

export async function issueAward(input: {
  competitionId: string;
  studentId: string;
  teamId: string | null;
  rank: number;
  label: string;
  score: number | null;
}) {
  const issuedBy = await currentUserId();
  const { error } = await supabase.from("competition_awards").insert({
    competition_id: input.competitionId,
    student_id: input.studentId,
    team_id: input.teamId,
    rank_position: input.rank,
    award_label: input.label,
    score: input.score,
    issued_by: issuedBy,
  });
  if (error) throw error;
}

export async function revokeAward(id: string) {
  const { error } = await supabase.from("competition_awards").delete().eq("id", id);
  if (error) throw error;
}

// ---------- helpers ----------

export function formatDate(value: string | null) {
  if (!value) return "Rolling";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysLeft(deadline: string | null) {
  if (!deadline) return null;
  const diff = new Date(`${deadline}T23:59:59`).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function scoreTotal(score: Pick<Score, "innovation" | "technical" | "impact" | "presentation">) {
  return score.innovation + score.technical + score.impact + score.presentation;
}
