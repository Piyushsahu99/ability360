import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:px-8 sm:py-12 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <Logo />
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/70">
            Inclusive career direction, verified opportunities, accessible support and progress from first semester to first career.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Link to="/opportunities" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
            Opportunities
          </Link>
          <Link to="/resources" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">Resources</Link>
          <Link to="/government-jobs" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
            Government jobs guide
          </Link>
          <Link to="/accessibility" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">ABILITY360 ACCESS</Link>
          <Link to="/register" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
            Create account
          </Link>
          <Link to="/login" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
            Sign in
          </Link>
        </nav>
      </div>
      <div className="border-t border-sidebar-border py-4 text-center text-xs text-sidebar-foreground/60">
        © {new Date().getFullYear()} ABILITY360 — From First Semester to First Career.
      </div>
    </footer>
  );
}
