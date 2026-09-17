import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MockTest = Database["public"]["Tables"]["mock_tests"]["Row"];
export type MockTestAttempt = Database["public"]["Tables"]["mock_test_attempts"]["Row"];

export type MockQuestion = {
  id: string;
  position: number;
  topic: string;
  prompt: string;
  options: string[];
};

/** Compensatory time under the RPwD Act: 20 extra minutes per hour of exam time. */
export function extraTimeSeconds(durationMinutes: number) {
  return Math.round(durationMinutes * 60 * (20 / 60));
}

export const mockTestsQueryOptions = queryOptions({
  queryKey: ["mock-tests", "list"],
  queryFn: async (): Promise<MockTest[]> => {
    const { data, error } = await supabase
      .from("mock_tests")
      .select("*")
      .eq("is_published", true)
      .order("title");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60_000,
});

export function mockTestQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ["mock-tests", "detail", slug],
    queryFn: async (): Promise<MockTest | null> => {
      const { data, error } = await supabase
        .from("mock_tests")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    staleTime: 5 * 60_000,
  });
}

export function mockQuestionsQueryOptions(testId: string | undefined) {
  return queryOptions({
    queryKey: ["mock-tests", "questions", testId],
    enabled: Boolean(testId),
    queryFn: async (): Promise<MockQuestion[]> => {
      const { data, error } = await supabase
        .from("mock_test_questions")
        .select("id, position, topic, prompt, options")
        .eq("test_id", testId!)
        .order("position");
      if (error) throw error;
      return (data ?? []) as MockQuestion[];
    },
    staleTime: 5 * 60_000,
  });
}

export const mockAttemptsQueryOptions = queryOptions({
  queryKey: ["mock-tests", "attempts"],
  queryFn: async (): Promise<MockTestAttempt[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];
    const { data, error } = await supabase
      .from("mock_test_attempts")
      .select("*")
      .eq("student_id", userData.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export function formatClock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
