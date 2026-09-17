import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type LearningModule = Database["public"]["Tables"]["learning_modules"]["Row"];
export type LearningProgress = Database["public"]["Tables"]["learning_progress"]["Row"];

export const learningModulesQueryOptions = queryOptions({
  queryKey: ["learning", "modules"],
  queryFn: async (): Promise<LearningModule[]> => {
    const { data, error } = await supabase
      .from("learning_modules")
      .select("*")
      .eq("is_published", true)
      .order("category")
      .order("title");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60_000,
});

export function learningModuleQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ["learning", "module", slug],
    queryFn: async (): Promise<LearningModule | null> => {
      const { data, error } = await supabase
        .from("learning_modules")
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

export const learningProgressQueryOptions = queryOptions({
  queryKey: ["learning", "progress"],
  queryFn: async (): Promise<LearningProgress[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];
    const { data, error } = await supabase
      .from("learning_progress")
      .select("*")
      .eq("student_id", userData.user.id);
    if (error) throw error;
    return data ?? [];
  },
});

export async function setModuleProgress(moduleId: string, status: "in_progress" | "completed") {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Please sign in to save your progress.");
  const { error } = await supabase.from("learning_progress").upsert(
    {
      student_id: userData.user.id,
      module_id: moduleId,
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,module_id" },
  );
  if (error) throw error;
}

export function moduleMinutes(module: Pick<LearningModule, "duration_minutes">) {
  return `${module.duration_minutes} min read`;
}
