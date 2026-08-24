import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { dashboardPathByRole, initials, roleLabels, useMe, type AppRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; icon: LucideIcon; active?: boolean; to?: string };

type Props = {
  role: AppRole;
  title: string;
  subtitle: string;
  nav: NavItem[];
  children: ReactNode;
};

export function DashboardShell({ role, title, subtitle, nav, children }: Props) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const wrongRole = me && me.role !== role;

  const sidebar = (
    <nav aria-label="Dashboard sections" className="flex flex-col gap-1">
      {nav.map((item) => (
        <span
          key={item.label}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
            item.active
              ? "bg-primary-soft text-primary"
              : "text-muted-foreground",
          )}
          aria-current={item.active ? "page" : undefined}
        >
          <item.icon className="size-4 shrink-0" aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="min-h-11 min-w-11 lg:hidden"
                  aria-label="Open dashboard menu"
                >
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
                <div className="mt-10 px-4">{sidebar}</div>
              </SheetContent>
            </Sheet>
            <Link to="/" aria-label="ABILITY360 home">
              <Logo />
            </Link>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {roleLabels[role]}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{me?.fullName || "Member"}</p>
              <p className="text-xs text-muted-foreground">{me?.email}</p>
            </div>
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary-soft text-primary">
                {initials(me?.fullName || me?.email || "")}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Sign out" onClick={handleSignOut}>
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24">{sidebar}</div>
        </aside>

        <main className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          {wrongRole && (
            <Card className="mt-6 border-amber/40 bg-accent">
              <CardHeader>
                <CardTitle className="text-base">You're signed in as {roleLabels[me.role]}</CardTitle>
                <CardDescription className="text-accent-foreground">
                  This workspace is for {roleLabels[role]} accounts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="min-h-11">
                  <Link to={dashboardPathByRole[me.role]}>Go to my dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-4 text-teal" aria-hidden="true" />
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export function PanelCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
