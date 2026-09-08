import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type PendingCompany = {
  id: string;
  company_name: string;
  industry: string | null;
  headquarters: string | null;
  verification_requested_at: string | null;
};

export const adminOverviewQueryOptions = queryOptions({
  queryKey: ["admin", "overview"],
  queryFn: async () => {
    const [accounts, institutions, pending, verified] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("institutions").select("id", { count: "exact", head: true }),
      supabase
        .from("company_profiles")
        .select("id, company_name, industry, headquarters, verification_requested_at")
        .eq("verification_status", "pending")
        .order("verification_requested_at", { ascending: true }),
      supabase
        .from("company_profiles")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "verified"),
    ]);

    if (pending.error) throw pending.error;

    return {
      accounts: accounts.count ?? 0,
      institutions: institutions.count ?? 0,
      verifiedCompanies: verified.count ?? 0,
      pendingCompanies: (pending.data ?? []) as PendingCompany[],
    };
  },
  staleTime: 60_000,
});

export async function decideCompanyVerification(id: string, approve: boolean) {
  const { error } = await supabase
    .from("company_profiles")
    .update({
      verification_status: approve ? "verified" : "rejected",
      verified_at: approve ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
}
