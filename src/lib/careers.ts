import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CareerRole = Database["public"]["Tables"]["career_roles"]["Row"];

export const careerRolesQueryOptions = queryOptions({
  queryKey: ["career-roles"],
  queryFn: async (): Promise<CareerRole[]> => {
    const { data, error } = await supabase
      .from("career_roles")
      .select("*")
      .eq("is_active", true)
      .order("course", { ascending: true })
      .order("title", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60_000,
});

export const targetRoleQueryOptions = queryOptions({
  queryKey: ["career-roles", "target"],
  queryFn: async (): Promise<{ target_role_id: string | null; target_role_selected_at: string | null } | null> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const { data, error } = await supabase
      .from("student_profiles")
      .select("target_role_id, target_role_selected_at")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },
});

export async function selectTargetRole(roleId: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("You need to sign in to choose a target role.");

  const { error } = await supabase
    .from("student_profiles")
    .upsert(
      { id: user.id, target_role_id: roleId, target_role_selected_at: new Date().toISOString() },
      { onConflict: "id" },
    );
  if (error) throw error;
}

export function formatLpa(min: number, max: number) {
  const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
  return min === max ? `₹${fmt(min)} LPA` : `₹${fmt(min)}–${fmt(max)} LPA`;
}

export function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
