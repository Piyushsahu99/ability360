import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ChatPanel } from "@/components/chat-panel";
import { DashboardShell, PanelCard } from "@/components/dashboard-shell";
import { useMe } from "@/lib/auth";
import { studentChatQueryOptions } from "@/lib/chat";
import { studentNav } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/messages")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Messages — ABILITY360" },
      {
        name: "description",
        content: "Chat with employers about the vacancies you have applied to.",
      },
      { property: "og:title", content: "Messages — ABILITY360" },
      {
        property: "og:description",
        content: "Your conversations with employers on ABILITY360.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentMessagesPage,
});

function StudentMessagesPage() {
  const { data: me } = useMe();
  const { data, isPending } = useQuery(studentChatQueryOptions);

  return (
    <DashboardShell
      role="student"
      title="Messages"
      subtitle="Talk directly with employers about their vacancies."
      nav={studentNav("/messages")}
    >
      <PanelCard
        title="Your conversations"
        description="Employers reply here — your email address stays private."
      >
        {isPending || !me ? (
          <p className="text-sm text-muted-foreground">Loading conversations…</p>
        ) : (
          <ChatPanel
            threads={data ?? []}
            viewerId={me.id}
            as="student"
            queryKey={studentChatQueryOptions.queryKey}
          />
        )}
      </PanelCard>
    </DashboardShell>
  );
}
