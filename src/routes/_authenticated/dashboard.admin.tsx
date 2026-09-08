import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BadgeCheck,
  Building2,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { opportunitiesQueryOptions, opportunityTypeLabels } from "@/lib/opportunities";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — ABILITY360" },
      { name: "description", content: "Monitor platform health, accounts and verification queues." },
    ],
  }),
  component: AdminDashboard,
});

const nav = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Accounts", icon: Users },
  { label: "Institutions", icon: Building2 },
  { label: "Opportunities", icon: Compass },
  { label: "Verification", icon: BadgeCheck },
  { label: "Audit log", icon: Activity },
];

function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data: opportunities } = useQuery(opportunitiesQueryOptions);
  const { data: overview } = useQuery(adminOverviewQueryOptions);
  const list = opportunities ?? [];

  const decide = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      decideCompanyVerification(id, approve),
    onSuccess: (_data, variables) => {
      toast.success(variables.approve ? "Employer verified" : "Employer rejected");
      void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: () => toast.error("We couldn't update that employer. Please try again."),
  });

  return (
    <DashboardShell
      role="admin"
      title="Platform administration"
      subtitle="Health, integrity and verification across ABILITY360."
      nav={nav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published opportunities" value={String(list.length)} hint="Visible to students" icon={Compass} />
        <StatCard
          label="Pending verifications"
          value={String(overview?.pendingCompanies.length ?? 0)}
          hint="Employers awaiting review"
          icon={ShieldCheck}
        />
        <StatCard
          label="Registered accounts"
          value={String(overview?.accounts ?? 0)}
          hint="Students, employers and staff"
          icon={Users}
        />
        <StatCard
          label="Verified employers"
          value={String(overview?.verifiedCompanies ?? 0)}
          hint="Approved organisations"
          icon={BadgeCheck}
        />
      </div>


      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PanelCard title="Latest opportunities" description="Most recently published listings.">
            {list.length === 0 ? (
              <EmptyState message="No opportunities published yet." />
            ) : (
              <ul className="space-y-3">
                {list.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-1 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.organisation}</p>
                    </div>
                    <Badge variant="secondary">{opportunityTypeLabels[item.type]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard title="Verification queue" description="Employers awaiting approval.">
            {overview && overview.pendingCompanies.length > 0 ? (
              <ul className="space-y-3">
                {overview.pendingCompanies.map((company) => (
                  <li key={company.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{company.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[company.industry, company.headquarters].filter(Boolean).join(" · ") ||
                        "Details pending"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="min-h-11"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ id: company.id, approve: true })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-11"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ id: company.id, approve: false })}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="Nothing waiting for review." />
            )}
          </PanelCard>
          <PanelCard title="Registered institutions" description="Colleges and universities on ABILITY360.">
            <p className="text-2xl font-semibold">{overview?.institutions ?? 0}</p>
            <p className="text-xs text-muted-foreground">Available when students choose their college.</p>
          </PanelCard>
        </div>

      </div>
    </DashboardShell>
  );
}
