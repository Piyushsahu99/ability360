import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Compass,
  GraduationCap,
  LineChart,
  School,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    ],
  }),
  component: LandingPage,
});

const pillars = [
  {
    icon: GraduationCap,
    title: "Students",
    body: "A single career profile that grows every semester — skills, projects, readiness and next steps.",
  },
  {
    icon: School,
    title: "Colleges",
    body: "Cohort-level visibility into placement readiness, participation and outcomes without spreadsheets.",
  },
  {
    icon: Users,
    title: "Faculty",
    body: "Mentor students with context: track progress, endorse skills and guide project work.",
  },
  {
    icon: Building2,
    title: "Industry",
    body: "Reach verified campus talent, post roles and shortlist against evidence, not just resumes.",
  },
  {
    icon: Compass,
    title: "Opportunities",
    body: "Internships, jobs, training and research projects in one continuously updated feed.",
  },
];

const journey = [
  { step: "Semester 1–2", title: "Discover", body: "Build a profile, map interests and start skill baselines." },
  { step: "Semester 3–4", title: "Develop", body: "Take on projects, training and faculty-guided work." },
  { step: "Semester 5–6", title: "Demonstrate", body: "Convert learning into internships and verified evidence." },
  { step: "Semester 7–8", title: "Deploy", body: "Move into placement-ready shortlists and first roles." },
];

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge variant="secondary" className="mb-5 gap-1.5">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Academia–Industry Career OS
              </Badge>
              <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
                From First Semester to <span className="text-teal">First Career</span>.
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                ABILITY360 gives every college student a personalised career path — and gives colleges,
                faculty and employers one shared place to support it.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-h-11">
                  <Link to="/register">
                    Get started free
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-h-11">
                  <Link to="/opportunities">Explore opportunities</Link>
                </Button>
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Accessibility-first, role-based and privacy respecting.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <p className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                One profile, four workspaces
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  { icon: GraduationCap, label: "Student", note: "Readiness, skills, applications" },
                  { icon: Building2, label: "Industry", note: "Roles, pipeline, talent pool" },
                  { icon: School, label: "Institution", note: "Cohorts, outcomes, faculty" },
                  { icon: LineChart, label: "Admin", note: "Platform health and verification" },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <span className="flex size-9 items-center justify-center rounded-md bg-primary-soft">
                      <item.icon className="size-4 text-primary" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{item.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="bg-surface py-16 sm:py-20" aria-labelledby="pillars-heading">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 id="pillars-heading" className="text-2xl font-bold sm:text-3xl">
              Five sides of the same career journey
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              ABILITY360 connects the people and institutions that decide whether a student is ready — and
              keeps them working from the same picture.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map((pillar) => (
                <Card key={pillar.title} className="transition-colors hover:border-teal/50">
                  <CardHeader>
                    <span className="flex size-10 items-center justify-center rounded-lg bg-accent">
                      <pillar.icon className="size-5 text-accent-foreground" aria-hidden="true" />
                    </span>
                    <CardTitle className="mt-3 text-lg">{pillar.title}</CardTitle>
                    <CardDescription>{pillar.body}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Journey */}
        <section className="border-y border-border bg-background py-16 sm:py-20" aria-labelledby="journey-heading">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 id="journey-heading" className="text-2xl font-bold sm:text-3xl">
              A guided path, semester by semester
            </h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-4">
              {journey.map((phase, index) => (
                <li key={phase.title} className="rounded-xl border border-border bg-card p-5">
                  <span className="font-display text-xs font-semibold uppercase tracking-wide text-teal">
                    {phase.step}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold">
                    {index + 1}. {phase.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{phase.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary py-16 text-primary-foreground sm:py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Ready to build your 360° career profile?</h2>
              <p className="mt-2 max-w-xl text-sm opacity-90">
                Join as a student, employer or institution and start with the opportunities that fit you.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="min-h-11">
              <Link to="/register">
                Create your account
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
