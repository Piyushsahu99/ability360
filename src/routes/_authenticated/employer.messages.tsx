import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { DashboardShell, EmptyState, PanelCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { employerMessagesQueryOptions } from "@/lib/company-contact";
import { formatDateIN } from "@/lib/india";
import { employerNav } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/employer/messages")({
  head: () => ({
    meta: [
      { title: "Employer messages — ABILITY360" },
      {
        name: "description",
        content: "Read questions students have sent you about your posted opportunities.",
      },
      { property: "og:title", content: "Employer messages — ABILITY360" },
      {
        property: "og:description",
        content: "Student enquiries sent through the ABILITY360 contact form.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmployerMessagesPage,
});

function EmployerMessagesPage() {
  const { data, isPending, isError, refetch } = useQuery(employerMessagesQueryOptions);
  const messages = data ?? [];

  return (
    <DashboardShell
      role="industry"
      title="Messages"
      subtitle="Students contact you here instead of by email, so your address stays private."
      nav={employerNav("/employer/messages")}
    >
      <PanelCard
        title="Student enquiries"
        description="Every message is tied to a real student account."
      >
        {isError ? (
          <EmptyState
            title="We couldn't load your messages"
            description="Please try again in a moment."
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        ) : isPending ? (
          <p className="text-sm text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <EmptyState
            title="No messages yet"
            description="Publish an opportunity and students can reach you from its listing."
          />
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => (
              <li key={message.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{message.subject}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDateIN(message.created_at)}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{message.profiles?.full_name ?? "Student"}</span>
                  {message.opportunities?.title && (
                    <Badge variant="outline">{message.opportunities.title}</Badge>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{message.body}</p>
                {message.reply_email && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Reply to: <span className="font-medium">{message.reply_email}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </DashboardShell>
  );
}
