import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"];
export type OpportunityType = Database["public"]["Enums"]["opportunity_type"];
export type WorkMode = Database["public"]["Enums"]["work_mode"];

export const opportunityTypeLabels: Record<OpportunityType, string> = {
  internship: "Internship",
  job: "Job",
  project: "Project",
  training: "Training",
};

export const workModeLabels: Record<WorkMode, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

export const opportunitiesQueryOptions = queryOptions({
  queryKey: ["opportunities", "published"],
  queryFn: async (): Promise<Opportunity[]> => {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});

export function formatDeadline(deadline: string | null) {
  if (!deadline) return "Rolling";
  return new Date(`${deadline}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
