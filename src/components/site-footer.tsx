import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The Academia–Industry Career OS connecting students, colleges, faculty and employers.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to="/opportunities" className="text-muted-foreground hover:text-foreground">
            Opportunities
          </Link>
          <Link to="/register" className="text-muted-foreground hover:text-foreground">
            Create account
          </Link>
          <Link to="/login" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ABILITY360 — From First Semester to First Career.
      </div>
    </footer>
  );
}
