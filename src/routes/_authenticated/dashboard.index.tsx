import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { dashboardPathByRole, useMe } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Dashboard — ABILITY360" }] }),
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { data: me, isPending } = useMe();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending) {
      navigate({ to: me ? dashboardPathByRole[me.role] : "/login", replace: true });
    }
  }, [isPending, me, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Opening your dashboard…
      </p>
    </div>
  );
}
