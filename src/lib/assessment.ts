import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SkillCategory = Database["public"]["Enums"]["skill_category"];

export type Question = {
  id: string;
  category: SkillCategory;
  topic: string;
  prompt: string;
  options: string[];
};

export const assessmentCategories: { value: SkillCategory; label: string; blurb: string }[] = [
  { value: "technical", label: "Technical", blurb: "Programming, data, web and tooling fundamentals." },
  { value: "soft", label: "Soft skills", blurb: "Communication, teamwork, feedback and leadership." },
  { value: "aptitude", label: "Aptitude", blurb: "Numerical reasoning, series and logical thinking." },
  { value: "domain", label: "Domain", blurb: "Applied knowledge across data, product and engineering." },
];

export const levelLabels: Record<number, string> = {
  1: "Beginner",
  2: "Developing",
  3: "Practising",
  4: "Confident",
  5: "Advanced",
};

export function questionsQueryOptions(category: SkillCategory) {
  return queryOptions({
    queryKey: ["assessment", "questions", category],
    queryFn: async (): Promise<Question[]> => {
      const { data, error } = await supabase
        .from("assessment_questions")
        .select("id, category, topic, prompt, options")
        .eq("category", category);
      if (error) throw error;
      return (data ?? []) as Question[];
    },
    staleTime: 5 * 60_000,
  });
}

export const attemptsQueryOptions = queryOptions({
  queryKey: ["assessment", "attempts"],
  queryFn: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];
    const { data, error } = await supabase
      .from("assessment_attempts")
      .select("*")
      .eq("student_id", userData.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});
