import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Compass,
  GraduationCap,
  LineChart,
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
  {
    index: "01",
    icon: GraduationCap,
    title: "Students",
    body: "One career profile that grows every semester — skills, projects and readiness.",
  },
  {
    index: "02",
    icon: School,
    title: "Colleges",
    body: "Cohort-level placement readiness and outcomes, without spreadsheets.",
  },
  {
    index: "03",
    icon: Users,
    title: "Faculty",
    body: "Mentor with context: track progress, endorse skills, guide project work.",
  },
  {
    index: "04",
    icon: Building2,
    title: "Industry",
    body: "Reach verified campus talent and shortlist against evidence, not resumes.",
  },
  {
    index: "05",
    icon: Compass,
    title: "Opportunities",
    body: "Internships, jobs, training and research projects in one live feed.",
  },
];

const journey = [
  {
    step: "Semester 1–2",
    title: "Discover",
    body: "Build a profile, map interests and start skill baselines.",
  },
  {
    step: "Semester 3–4",
    title: "Develop",
    body: "Take on projects, training and faculty-guided work.",
  },
  {
    step: "Semester 5–6",
    title: "Demonstrate",
    body: "Convert learning into internships and verified evidence.",
  },
  {
    step: "Semester 7–8",
    title: "Deploy",
    body: "Move into placement-ready shortlists and first roles.",
  },
];

const workspaces = [
  { icon: GraduationCap, label: "Student", note: "Readiness, skills, applications" },
  { icon: Building2, label: "Industry", note: "Roles, pipeline, talent pool" },
  { icon: School, label: "Institution", note: "Cohorts, outcomes, faculty" },
  { icon: LineChart, label: "Admin", note: "Platform health and verification" },
];

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main>
        <div className="mx-auto w-full max-w-7xl space-y-24 px-4 py-16 sm:px-6 md:space-y-32 md:py-24">
          {/* Hero */}
          <section className="grid grid-cols-1 items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-tighter text-foreground sm:text-7xl lg:text-8xl">
                From first
                <br />
                <span className="text-primary">semester</span>
                <br />
                to first career
              </h1>
              <p className="mt-8 max-w-xl text-lg font-medium text-muted-foreground sm:text-xl">
                The Academia–Industry Career OS. ABILITY360 gives every student a personalised path — and
                gives colleges, faculty and employers one shared place to support it.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild size="lg" className="min-h-12 px-8 font-bold">
                  <Link to="/register">
                    Get started free
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-h-12 px-8 font-bold">
                  <Link to="/opportunities">Explore opportunities</Link>
                </Button>
              </div>
              <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Accessibility-first, role-based and privacy respecting.
              </p>
            </div>

            <div className="border-l border-border pb-4 pl-8 lg:col-span-4">
              <span className="font-display text-sm font-bold uppercase tracking-widest text-primary">
                Status: Online
              </span>
              <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
                Unified ecosystem
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Bridging the gap between academic learning and industry expectations.
              </p>
            </div>
          </section>

          {/* Pillars */}
          <section aria-labelledby="pillars-heading">
            <h2 id="pillars-heading" className="sr-only">
              Five sides of the same career journey
            </h2>
            <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3 lg:grid-cols-5">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="bg-background p-8 transition-colors hover:bg-surface">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-primary">{pillar.index}</span>
                    <pillar.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 mt-4 font-display text-xl text-foreground">{pillar.title}</h3>
                  <p className="text-sm text-muted-foreground">{pillar.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Journey */}
          <section className="space-y-12" aria-labelledby="journey-heading">
            <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
              <h2 id="journey-heading" className="font-display text-4xl font-bold text-foreground">
                The journey
              </h2>
              <p className="max-w-xs text-sm italic text-muted-foreground sm:text-right">
                A structured, semester-by-semester approach to professional readiness.
              </p>
            </div>
            <ol className="grid grid-cols-1 gap-8 md:grid-cols-4">
              {journey.map((phase, index) => (
                <li key={phase.title} className="space-y-4">
                  <div className={index === 0 ? "h-1 w-full bg-primary" : "h-1 w-full bg-border"} />
                  <span className="font-display text-xs font-semibold uppercase tracking-widest text-primary">
                    {phase.step}
                  </span>
                  <h3 className="font-display text-xl font-bold uppercase text-foreground">
                    {phase.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{phase.body}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Workspaces */}
          <section
            className="relative overflow-hidden rounded-lg border border-border bg-surface p-8 sm:p-12"
            aria-labelledby="workspaces-heading"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 size-64 bg-primary opacity-10 blur-[120px]"
            />
            <div className="flex flex-col items-start gap-12 lg:flex-row">
              <div className="w-full lg:w-1/3">
                <h2
                  id="workspaces-heading"
                  className="mb-8 font-display text-3xl font-bold text-foreground"
                >
                  Workspaces
                </h2>
                <ul className="flex flex-col gap-4">
                  {workspaces.map((item, index) => (
                    <li
                      key={item.label}
                      className={
                        index === 0
                          ? "flex items-center gap-3 rounded-md bg-primary px-6 py-4 text-primary-foreground"
                          : "flex items-center gap-3 rounded-md border border-border px-6 py-4 text-muted-foreground"
                      }
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden="true" />
                      <span>
                        <span className="block text-sm font-bold">{item.label}</span>
                        <span className="block text-xs opacity-80">{item.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full items-center justify-center rounded-lg border border-border bg-background p-8 lg:w-2/3 lg:aspect-video">
                <div className="text-center">
                  <div className="mx-auto mb-6 h-1 w-16 bg-primary" />
                  <p className="font-display text-lg text-foreground">One profile, four workspaces</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Sign in and ABILITY360 opens the workspace that matches your role — student, industry,
                    institution or admin.
                  </p>
                  <Button asChild className="mt-6 min-h-11 font-bold">
                    <Link to="/register">
                      Create your account
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
