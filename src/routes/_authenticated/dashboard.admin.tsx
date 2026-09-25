import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BadgeCheck,
  Building2,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  Users,
  MessageSquarePlus,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminOverviewQueryOptions, decideCompanyVerification } from "@/lib/admin";
import { dashboardPathByRole, useMe } from "@/lib/auth";
import {
  communityModerationQueryOptions,
  moderateCommunityPost,
} from "@/lib/community";
import { adminNav } from "@/lib/nav";
import { opportunitiesQueryOptions, opportunityTypeLabels } from "@/lib/opportunities";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  staticData: { sitemap: false },
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) throw redirect({ to: "/login" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const priority = ["admin", "gov_admin", "institution", "faculty", "organizer", "mentor", "industry", "student"] as const;
    const role = priority.find((candidate) => (roles ?? []).some((item) => item.role === candidate)) ?? "student";
    if (role !== "admin" && role !== "gov_admin") {
      throw redirect({ to: dashboardPathByRole[role], replace: true });
    }
    return { role };
  },
  head: () => ({
    meta: [
      { title: "Administration — ABILITY360" },
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
  const { data: me, isPending: isMePending } = useMe();
  const role = me?.role;
  const canVerifyEmployers = role === "admin";
  const queryClient = useQueryClient();
  const { data: opportunities } = useQuery(opportunitiesQueryOptions);
  const { data: overview } = useQuery(adminOverviewQueryOptions);
  const { data: communityQueue } = useQuery({
    ...communityModerationQueryOptions,
    enabled: role === "admin",
  });
  const list = opportunities ?? [];

  const moderate = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      moderateCommunityPost(id, decision),
    onSuccess: (_data, variables) => {
      toast.success(variables.decision === "approved" ? "Community post published" : "Community post rejected");
      void queryClient.invalidateQueries({ queryKey: ["admin", "community", "pending"] });
      void queryClient.invalidateQueries({ queryKey: ["community", "approved"] });
    },
    onError: (error: Error) => toast.error(error.message || "We couldn't moderate this post."),
  });

  if (isMePending || !role) {
    return <div className="min-h-screen bg-background p-8 text-sm text-muted-foreground">Loading administration…</div>;
  }

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
      role={role}
      title={role === "gov_admin" ? "Government administration" : "Platform administration"}
      subtitle={
        role === "gov_admin"
          ? "Read-only programme intelligence across ABILITY360."
          : "Health, integrity and verification across ABILITY360."
      }
      nav={adminNav("/dashboard/admin")}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Community review queue"
          value={String(communityQueue?.length ?? 0)}
          hint={role === "admin" ? "Posts waiting for approval" : "Super Admin only"}
          icon={MessageSquarePlus}
        />
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
          {role === "admin" && (
            <PanelCard title="Community moderation" description="Review student and community needs before publication.">
              {communityQueue && communityQueue.length > 0 ? (
                <ul className="space-y-3">
                  {communityQueue.map((post) => (
                    <li key={post.id} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{post.category}</Badge>
                        {post.tags.slice(0, 4).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                      </div>
                      <p className="mt-2 text-sm font-semibold">{post.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{post.author_name}</p>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-foreground/80">{post.body}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" disabled={moderate.isPending} onClick={() => moderate.mutate({ id: post.id, decision: "approved" })}>Approve & publish</Button>
                        <Button size="sm" variant="outline" disabled={moderate.isPending} onClick={() => moderate.mutate({ id: post.id, decision: "rejected" })}>Reject</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState message="No community posts are waiting for review." />
              )}
            </PanelCard>
          )}

          <PanelCard
            title="Verification queue"
            description={
              canVerifyEmployers
                ? "Employers awaiting approval."
                : "Read-only queue. Employer verification is reserved for Super Admins."
            }
          >
            {overview && overview.pendingCompanies.length > 0 ? (
              <ul className="space-y-3">
                {overview.pendingCompanies.map((company) => (
                  <li key={company.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{company.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[company.industry, company.headquarters].filter(Boolean).join(" · ") || "Details pending"}
                    </p>
                    {canVerifyEmployers ? (
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
                    ) : null}
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
