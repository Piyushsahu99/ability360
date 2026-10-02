import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/auth";
import { navForRole } from "@/lib/nav";
import { createSathiThread, deleteSathiThread, sathiThreadsQueryOptions } from "@/lib/sathi";

export const Route = createFileRoute("/_authenticated/sathi")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Sathi — your ABILITY360 companion" },
      {
        name: "description",
        content: "Chat or talk with Sathi to find internships, jobs, scholarships, schemes and career roles.",
      },
      { property: "og:title", content: "Sathi — your ABILITY360 companion" },
      {
        property: "og:description",
        content: "Ask Sathi about opportunities, scholarships and your career journey — by text or voice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SathiLayout,
});

function SathiLayout() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };
  const { data: threads } = useQuery(sathiThreadsQueryOptions);
  const role = me?.role ?? "student";

  async function newChat() {
    try {
      const id = await createSathiThread();
      await queryClient.invalidateQueries({ queryKey: sathiThreadsQueryOptions.queryKey });
      navigate({ to: "/sathi/$threadId", params: { threadId: id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start a new chat.");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this chat? This cannot be undone.")) return;
    try {
      await deleteSathiThread(id);
      await queryClient.invalidateQueries({ queryKey: sathiThreadsQueryOptions.queryKey });
      if (params.threadId === id) navigate({ to: "/sathi" });
    } catch {
      toast.error("Could not delete this chat.");
    }
  }

  return (
    <DashboardShell
      role={role}
      title="Sathi"
      subtitle="Your companion for opportunities, scholarships and career questions — type or talk."
      nav={navForRole(role, "/sathi")}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="min-w-0 space-y-2" aria-label="Your Sathi chats">
          <Button onClick={() => void newChat()} className="min-h-11 w-full justify-start">
            <MessageSquarePlus className="mr-2 h-4 w-4" aria-hidden /> New chat
          </Button>
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
            {(threads ?? []).map((t) => (
              <li key={t.id} className="flex shrink-0 items-center gap-1 lg:shrink">
                <Link
                  to="/sathi/$threadId"
                  params={{ threadId: t.id }}
                  className="min-w-0 max-w-[200px] flex-1 truncate rounded-md px-3 py-2 text-sm hover:bg-muted lg:max-w-none"
                  activeProps={{ className: "bg-muted font-medium" }}
                >
                  {t.title}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label={`Delete chat ${t.title}`}
                  onClick={() => void remove(t.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </DashboardShell>
  );
}
