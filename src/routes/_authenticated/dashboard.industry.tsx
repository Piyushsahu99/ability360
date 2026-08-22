import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  MessagesSquare,
  Users,
  UserSearch,
} from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard/industry")({
  head: () => ({
    meta: [
      { title: "Industry dashboard — ABILITY360" },
      { name: "description", content: "Post roles, review pipelines and reach verified campus talent." },
    ],
  }),
  component: IndustryDashboard,
});

const nav = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Posted roles", icon: ClipboardList },
  { label: "Applicants", icon: Users },
  { label: "Talent pool", icon: UserSearch },
  { label: "Campus partners", icon: Building2 },
  { label: "Messages", icon: MessagesSquare },
];

const stages = [
  { stage: "Applied", count: 0 },
  { stage: "Shortlisted", count: 0 },
  { stage: "Interviewing", count: 0 },
  { stage: "Offered", count: 0 },
];

function IndustryDashboard() {
  const { data: me } = useMe();

  return (
    <DashboardShell
      role="industry"
      title={me?.fullName ? `${me.fullName.split(" ")[0]}'s hiring workspace` : "Hiring workspace"}
      subtitle="Reach campus talent with evidence, not just resumes."
      nav={nav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active roles" value="0" hint="Publish your first role" icon={ClipboardList} />
        <StatCard label="Applicants" value="0" hint="Across all roles" icon={Users} />
        <StatCard label="Shortlisted" value="0" hint="Ready for interview" icon={UserSearch} />
        <StatCard label="Campus partners" value="0" hint="Connect with institutions" icon={Building2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PanelCard title="Applicant pipeline" description="Stages update as candidates progress.">
            <ul className="grid gap-3 sm:grid-cols-4">
              {stages.map((item) => (
                <li key={item.stage} className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-semibold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">{item.stage}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <EmptyState message="No candidates yet. Post a role to start receiving applications." />
            </div>
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard title="Your posted roles" description="Internships, jobs and projects you own.">
            <EmptyState message="You haven't posted a role yet." />
            <Button className="mt-4 min-h-11 w-full" disabled>
              Post a role (coming soon)
            </Button>
          </PanelCard>

          <PanelCard title="Talent pool snapshot" description="Verified students matching your filters.">
            <EmptyState message="Set hiring preferences to see matching students." />
          </PanelCard>
        </div>
      </div>
    </DashboardShell>
  );
}
