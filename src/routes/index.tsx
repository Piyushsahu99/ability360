import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Compass,
  GraduationCap,
  Lightbulb,
  School,
  ShieldCheck,
  Users,
} from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ABILITY360 — From First Semester to First Career" },
      {
        name: "description",
        content:
          "A personalised Academia–Industry Career OS connecting students, colleges, faculty and employers around real opportunities.",
      },
      { property: "og:title", content: "ABILITY360 — From First Semester to First Career" },
      {
        property: "og:description",
        content:
          "A personalised Academia–Industry Career OS connecting students, colleges, faculty and employers around real opportunities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const pillars = [
  { icon: GraduationCap, title: "Students", note: "Future leaders" },
  { icon: School, title: "Colleges", note: "Resource hubs" },
  { icon: Users, title: "Faculty", note: "Mentorship" },
  { icon: Building2, title: "Industry", note: "Career links" },
  { icon: Compass, title: "Opportunities", note: "Endless growth" },
];

const journey = [
  {
    step: "01",
    title: "Discover",
    body: "Build a profile, map interests and start skill baselines.",
    accent: "primary" as const,
  },
  {
    step: "02",
    title: "Develop",
    body: "Take on projects, training and faculty-guided work.",
    accent: "teal" as const,
  },
  {
    step: "03",
    title: "Demonstrate",
    body: "Convert learning into internships and verified evidence.",
    accent: "primary" as const,
  },
  {
    step: "04",
    title: "Deploy",
    body: "Move into placement-ready shortlists and first roles.",
    accent: "teal" as const,
  },
];

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main>
        {/* Split-screen hero */}
        <section className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
          {/* Left: message */}
          <div className="relative flex w-full flex-col justify-center overflow-hidden px-6 py-20 sm:px-10 lg:w-1/2 lg:px-20 lg:py-0">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-20 top-1/4 size-64 rounded-full bg-primary/20 blur-[100px]"
            />
            <h1 className="relative z-10 font-display text-7xl uppercase leading-[0.9] tracking-wide text-foreground sm:text-8xl lg:text-9xl">
              <span className="block">From first</span>
              <span className="block text-teal">semester</span>
              <span className="inline-block border-b-4 border-foreground">To first career</span>
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
              The Academia–Industry Career OS for Indian college students. An inclusive ecosystem
              that empowers every student to build their professional legacy.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Button asChild size="lg" className="min-h-14 rounded-xl px-8 text-base font-bold">
                <Link to="/register">
                  Launch workspace
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <p className="flex items-center gap-2 text-sm font-semibold text-teal">
                <span className="size-2 animate-pulse rounded-full bg-teal" aria-hidden="true" />
                WCAG AA inclusive design
              </p>
            </div>
          </div>

          {/* Right: product preview */}
          <div className="relative flex w-full items-center justify-center overflow-hidden bg-surface p-6 sm:p-10 lg:w-1/2 lg:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-primary/20 blur-[120px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -right-20 size-96 rounded-full bg-teal/20 blur-[120px]"
            />
            <div className="relative w-full max-w-xl rounded-3xl border border-border bg-background p-6 shadow-2xl">
              <div
                aria-hidden="true"
                className="mb-6 flex h-8 items-center gap-2 rounded-t-xl bg-secondary/60 px-4"
              >
                <span className="size-3 rounded-full bg-destructive/50" />
                <span className="size-3 rounded-full bg-amber/50" />
                <span className="size-3 rounded-full bg-success/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 rounded-xl border border-border bg-gradient-to-br from-primary/20 to-transparent p-4">
                  <div className="mb-3 h-2 w-1/2 rounded-full bg-foreground/20" />
                  <div className="h-12 w-full rounded-lg bg-secondary/60" />
                </div>
                <div className="h-32 rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 h-2 w-1/3 rounded-full bg-teal/40" />
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-secondary/60" />
                    <div className="h-2 w-4/5 rounded-full bg-secondary/60" />
                  </div>
                </div>
                <div className="col-span-2 flex h-48 items-center justify-center rounded-xl border border-border bg-secondary/40">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/50">
                      <Lightbulb className="size-8 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <p className="font-display text-xl uppercase tracking-widest text-foreground">
                      Semester phase: Develop
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem pillars */}
        <section aria-labelledby="pillars-heading" className="px-6 py-24 sm:px-10">
          <div className="mx-auto max-w-7xl">
            <h2 id="pillars-heading" className="sr-only">
              Five sides of the same career journey
            </h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-teal/50"
                >
                  <pillar.icon className="mb-3 size-5 text-primary" aria-hidden="true" />
                  <h3 className="mb-1 font-display text-2xl uppercase tracking-wider text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {pillar.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Semester journey */}
        <section
          aria-labelledby="journey-heading"
          className="border-y border-border bg-surface px-6 py-20 sm:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <h2
              id="journey-heading"
              className="mb-10 font-display text-5xl uppercase tracking-wider text-foreground"
            >
              The 4-phase journey
            </h2>
            <ol className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {journey.map((phase) => (
                <li
                  key={phase.title}
                  className={
                    phase.accent === "primary"
                      ? "rounded-3xl border-l-4 border-primary bg-background p-8"
                      : "rounded-3xl border-l-4 border-teal bg-background p-8"
                  }
                >
                  <span
                    className={
                      phase.accent === "primary"
                        ? "font-display text-4xl text-primary"
                        : "font-display text-4xl text-teal"
                    }
                  >
                    {phase.step}
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-foreground">{phase.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{phase.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-6 py-24 text-center sm:px-10" aria-labelledby="cta-heading">
          <h2
            id="cta-heading"
            className="font-display text-5xl uppercase tracking-wider text-foreground sm:text-6xl"
          >
            One profile, <span className="text-primary">four workspaces</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Sign in and ABILITY360 opens the workspace that matches your role — student, industry,
            institution or admin.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="min-h-14 rounded-xl px-8 text-base font-bold">
              <Link to="/register">
                Create your account
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-14 rounded-xl px-8 text-base font-bold"
            >
              <Link to="/roles">Explore career roles</Link>
            </Button>
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Accessibility-first · Inclusive of Divyangjan · WCAG 2.1 AA
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
