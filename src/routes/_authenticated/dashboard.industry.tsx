import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, ClipboardList, Plus, UserSearch, Users } from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { statusLabels } from "@/lib/applications";
import { useMe } from "@/lib/auth";
import { employerChatQueryOptions } from "@/lib/chat";
import {
  companyProfileCompleteness,
  companyProfileQueryOptions,
  employerApplicantsQueryOptions,
  employerOpportunitiesQueryOptions,
  pipelineStages,
} from "@/lib/employer";
import { employerNav } from "@/lib/nav";
import { formatDeadline, opportunityTypeLabels } from "@/lib/opportunities";

export const Route = createFileRoute("/_authenticated/dashboard/industry")({
  head: () => ({
    meta: [
      { title: "Industry dashboard — ABILITY360" },
      {
        name: "description",
        content: "Post roles, review pipelines and reach verified campus talent.",
      },
      { property: "og:title", content: "Industry dashboard — ABILITY360" },
      {
        property: "og:description",
        content: "Your hiring workspace for campus talent on ABILITY360.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IndustryDashboard,
});

function IndustryDashboard() {
  const { data: me } = useMe();
  const { data: company } = useQuery(companyProfileQueryOptions);
  const { data: opportunities } = useQuery(employerOpportunitiesQueryOptions);
  const { data: applicants } = useQuery(employerApplicantsQueryOptions);
  const { data: threads } = useQuery(employerChatQueryOptions);

  const threadCount = (threads ?? []).length;
  const unread = (threads ?? []).reduce((total, thread) => total + thread.unread, 0);
  const posts = opportunities ?? [];
  const rows = applicants ?? [];
  const published = posts.filter((item) => item.is_published);
  const completeness = companyProfileCompleteness(company ?? null);

  return (
    <DashboardShell
      role="industry"
      title={
        company?.company_name
          ? `${company.company_name} hiring workspace`
          : me?.fullName
            ? `${me.fullName.split(" ")[0]}'s hiring workspace`
            : "Hiring workspace"
      }
      subtitle="Reach campus talent with evidence, not just resumes."
      nav={employerNav("/dashboard/industry")}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Published roles"
          value={String(published.length)}
          hint={`${posts.length - published.length} draft(s)`}
          icon={ClipboardList}
        />
        <StatCard
          label="Applicants"
          value={String(rows.length)}
          hint="Across all opportunities"
          icon={Users}
        />
        <StatCard
          label="Shortlisted"
          value={String(rows.filter((row) => row.status === "shortlisted").length)}
          hint="Ready for interview"
          icon={UserSearch}
        />
        <StatCard
          label="Selected"
          value={String(rows.filter((row) => row.status === "selected").length)}
          hint="Offers made"
          icon={Building2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PanelCard
            title="Applicant pipeline"
            description="Stages update as candidates progress."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/employer/applicants">Open pipeline</Link>
              </Button>
            }
          >
            <ul className="grid gap-3 sm:grid-cols-4">
              {pipelineStages.map((status) => (
                <li key={status} className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-semibold">
                    {rows.filter((row) => row.status === status).length}
                  </p>
                  <p className="text-xs text-muted-foreground">{statusLabels[status]}</p>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2">
              {rows.length === 0 ? (
                <EmptyState
                  title="No candidates yet"
                  description="Publish an opportunity to start receiving applications."
                />
              ) : (
                rows.slice(0, 5).map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <span className="font-medium">{row.profiles?.full_name || "Candidate"}</span>
                    <span className="text-muted-foreground">{row.opportunities.title}</span>
                    <Badge variant="secondary">{statusLabels[row.status]}</Badge>
                  </div>
                ))
              )}
            </div>
          </PanelCard>

          <PanelCard
            title="Your posted opportunities"
            description="Jobs, internships, projects, apprenticeships, challenges and mentorship."
            action={
              <Button asChild size="sm">
                <Link to="/employer/opportunities">
                  <Plus className="size-4" aria-hidden="true" />
                  New
                </Link>
              </Button>
            }
          >
            {posts.length === 0 ? (
              <EmptyState
                title="You haven't posted a role yet"
                description="Create your first opportunity in under two minutes."
                action={
                  <Button asChild>
                    <Link to="/employer/opportunities">Post an opportunity</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-2">
                {posts.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{opportunityTypeLabels[item.type]}</Badge>
                      <Badge variant={item.is_published ? "default" : "secondary"}>
                        {item.is_published ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatDeadline(item.deadline)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard title="Company profile" description="Students see this before they apply.">
            <Progress value={completeness} aria-label="Company profile completeness" />
            <p className="mt-2 text-sm text-muted-foreground">{completeness}% complete</p>
            <Button asChild variant="outline" className="mt-4 min-h-11 w-full">
              <Link to="/employer/company">
                {company ? "Edit company profile" : "Set up company profile"}
              </Link>
            </Button>
          </PanelCard>

          <PanelCard title="Student chats" description="Questions from candidates about your roles.">
            <p className="text-sm text-muted-foreground">
              {unread > 0
                ? `${unread} unread message${unread === 1 ? "" : "s"} waiting for a reply.`
                : threadCount > 0
                  ? `${threadCount} conversation${threadCount === 1 ? "" : "s"}, all caught up.`
                  : "No conversations yet."}
            </p>
            <Button asChild variant="outline" className="mt-4 min-h-11 w-full">
              <Link to="/employer/messages">Open messages</Link>
            </Button>
          </PanelCard>

          <PanelCard title="Inclusive hiring" description="Reach Divyangjan talent with confidence.">

            <p className="text-sm text-muted-foreground">
              {company?.is_inclusive_employer
                ? "Your profile is flagged as an inclusive employer. Add accommodations to each opportunity so candidates know what to expect."
                : "Mark your company as an inclusive employer and list accommodations on each opportunity."}
            </p>
            <Button asChild variant="outline" className="mt-4 min-h-11 w-full">
              <Link to="/employer/company">Review inclusion settings</Link>
            </Button>
          </PanelCard>
        </div>
      </div>
    </DashboardShell>
  );
}
