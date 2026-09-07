import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Compass, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { dashboardPathByRole, useMe } from "@/lib/auth";
import { Logo } from "@/components/logo";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/roles", label: "Roles" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/competitions", label: "Competitions" },
  { to: "/resources", label: "Resources" },
] as const;

export function SiteHeader() {
  const { data: me, isPending } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const dashboardPath = me ? dashboardPathByRole[me.role] : "/login";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 rounded-md" aria-label="ABILITY360 home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isPending ? null : me ? (
            <>
              <Button asChild variant="ghost" className="min-h-11">
                <Link to={dashboardPath}>
                  <LayoutDashboard aria-hidden="true" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" className="min-h-11" onClick={handleSignOut}>
                <LogOut aria-hidden="true" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="min-h-11">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="min-h-11">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="min-h-11 min-w-11 md:hidden" aria-label="Open menu">
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <nav aria-label="Mobile" className="mt-10 flex flex-col gap-1 px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2">
                {me ? (
                  <>
                    <Button asChild className="min-h-11" onClick={() => setOpen(false)}>
                      <Link to={dashboardPath}>
                        <Compass aria-hidden="true" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-11"
                      onClick={() => {
                        setOpen(false);
                        void handleSignOut();
                      }}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="min-h-11" onClick={() => setOpen(false)}>
                      <Link to="/register">Get started</Link>
                    </Button>
                    <Button asChild variant="outline" className="min-h-11" onClick={() => setOpen(false)}>
                      <Link to="/login">Sign in</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
