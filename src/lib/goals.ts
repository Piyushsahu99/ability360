import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type StudentGoal = Database["public"]["Tables"]["student_goals"]["Row"];
export type GoalCategory = "career" | "skill" | "learning" | "application" | "personal";
export type GoalStatus = "active" | "completed";

export const goalCategories: Array<{ value: GoalCategory; label: string }> = [
  { value: "career", label: "Career" },
  { value: "skill", label: "Skill" },
  { value: "learning", label: "Learning" },
  { value: "application", label: "Application" },
  { value: "personal", label: "Personal" },
];

export const goalCategoryLabels = Object.fromEntries(
  goalCategories.map(({ value, label }) => [value, label]),
) as Record<GoalCategory, string>;

export const goalSchema = z.object({
  title: z.string().trim().min(1, "Add a goal title.").max(120),
  notes: z.string().trim().max(600),
  category: z.enum(["career", "skill", "learning", "application", "personal"]),
  priority: z.number().int().min(1).max(3),
  targetDate: z.string().optional(),
});

export type GoalValues = z.infer<typeof goalSchema>;

export const studentGoalsQueryOptions = queryOptions({
  queryKey: ["student", "goals"],
  queryFn: async (): Promise<StudentGoal[]> => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const user = userData.user;
    if (!user) return [];
    const { data, error } = await supabase
      .from("student_goals")
      .select("*")
      .eq("student_id", user.id)
      .order("status", { ascending: true })
      .order("priority", { ascending: true })
      .order("target_date", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 30_000,
});

export async function saveGoal(values: GoalValues, id?: string) {
  const parsed = goalSchema.parse(values);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) throw new Error("Sign in to manage your goals.");
  const payload = {
    title: parsed.title,
    notes: parsed.notes,
    category: parsed.category,
    priority: parsed.priority,
    target_date: parsed.targetDate || null,
  };
  const request = id
    ? supabase.from("student_goals").update(payload).eq("id", id).eq("student_id", user.id)
    : supabase.from("student_goals").insert({ ...payload, student_id: user.id });
  const { error } = await request;
  if (error) throw error;
}

export async function setGoalCompleted(goal: StudentGoal, completed: boolean) {
  const { error } = await supabase
    .from("student_goals")
    .update({
      status: completed ? "completed" : "active",
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", goal.id);
  if (error) throw error;
}

export async function changeGoalPriority(goal: StudentGoal, direction: -1 | 1) {
  const priority = Math.min(3, Math.max(1, goal.priority + direction));
  if (priority === goal.priority) return;
  const { error } = await supabase.from("student_goals").update({ priority }).eq("id", goal.id);
  if (error) throw error;
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from("student_goals").delete().eq("id", id);
  if (error) throw error;
}