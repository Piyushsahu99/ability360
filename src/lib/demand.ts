import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SkillCategory = Database["public"]["Enums"]["skill_category"];
export type OpportunityTypeName = Database["public"]["Enums"]["opportunity_type"];

export type SkillDemandRow = {
  skill_id: string;
  skill_name: string;
  category: SkillCategory;
  demand_count: number;
  recent_count: number;
  prior_count: number;
  student_supply: number;
};

export type RoleDemandRow = {
  role_title: string;
  opportunity_type: OpportunityTypeName;
  demand_count: number;
  employer_count: number;
  remote_share: number;
  inclusive_share: number;
};

export const skillCategoryLabels: Record<SkillCategory, string> = {
  technical: "Technical",
  soft: "Soft skill",
  aptitude: "Aptitude",
  domain: "Domain",
};

/** Aggregated employer skill requirements. No employer identifiers are returned. */
export const skillDemandQueryOptions = queryOptions({
  queryKey: ["intelligence", "skill-demand"],
  queryFn: async (): Promise<SkillDemandRow[]> => {
    const { data, error } = await supabase.rpc("skill_demand_overview");
    if (error) throw error;
    return (data ?? []) as SkillDemandRow[];
  },
  staleTime: 60_000,
});

/** Aggregated role demand: counts only, never a single employer's posting detail. */
export const roleDemandQueryOptions = queryOptions({
  queryKey: ["intelligence", "role-demand"],
  queryFn: async (): Promise<RoleDemandRow[]> => {
    const { data, error } = await supabase.rpc("role_demand_overview");
    if (error) throw error;
    return (data ?? []) as RoleDemandRow[];
  },
  staleTime: 60_000,
});

export function growthPercent(row: SkillDemandRow) {
  if (row.prior_count === 0) return row.recent_count > 0 ? 100 : 0;
  return Math.round(((row.recent_count - row.prior_count) / row.prior_count) * 100);
}

/** Positive number = more employer demand than students holding the skill. */
export function gapScore(row: SkillDemandRow) {
  return row.demand_count - row.student_supply;
}

export function topSkills(rows: SkillDemandRow[], limit = 8) {
  return [...rows].sort((a, b) => b.demand_count - a.demand_count).slice(0, limit);
}

export function growingSkills(rows: SkillDemandRow[], limit = 6) {
  return rows
    .filter((row) => row.recent_count > 0 && growthPercent(row) > 0)
    .sort((a, b) => growthPercent(b) - growthPercent(a) || b.recent_count - a.recent_count)
    .slice(0, limit);
}

export function skillGaps(rows: SkillDemandRow[], limit = 8) {
  return rows
    .filter((row) => gapScore(row) > 0)
    .sort((a, b) => gapScore(b) - gapScore(a))
    .slice(0, limit);
}

export function coveragePercent(row: SkillDemandRow) {
  if (row.demand_count === 0) return 100;
  return Math.min(100, Math.round((row.student_supply / row.demand_count) * 100));
}
