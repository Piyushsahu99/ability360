import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility,
  ArrowRight,
  Briefcase,
  Building2,
  ClipboardCheck,
  Compass,
  GraduationCap,
  IdCard,
  Route as RouteIcon,
  School,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import divyangjanImage from "@/assets/divyangjan-inclusion.jpg";
import journeyHero from "@/assets/journey-hero.jpg";
import programsImage from "@/assets/res-programs.jpg";
import scholarshipsImage from "@/assets/res-scholarships.jpg";
import divyangjanResImage from "@/assets/res-divyangjan.jpg";
import examsImage from "@/assets/res-exams.jpg";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { dashboardPathByRole, useMe } from "@/lib/auth";


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

const journey = [
  {
    icon: UserPlus,
    title: "Set up your profile",
    body: "Tell us your college, branch, semester, skills and career goal in a short guided setup.",
    tone: "primary" as const,
  },
  {
    icon: ClipboardCheck,
    title: "Check your skills",
    body: "Take a quick assessment and see where you actually stand today, honestly.",
    tone: "teal" as const,
  },
  {
    icon: Compass,
    title: "Pick a career role",
    body: "Browse real roles by course and branch with responsibilities, skills and Indian pay ranges.",
    tone: "primary" as const,
  },
  {
    icon: RouteIcon,
    title: "Follow your roadmap",
    body: "Get a personal plan for this week, the next 30 days and this semester.",
    tone: "teal" as const,
  },
  {
    icon: Briefcase,
    title: "Apply to opportunities",
    body: "Internships, jobs, projects and competitions — save, check eligibility, apply and track every stage.",
    tone: "primary" as const,
  },
  {
    icon: IdCard,
    title: "Build your Ability Passport",
    body: "Projects, verified skills and certificates in one profile employers can trust.",
    tone: "teal" as const,
  },
];

const pillars = [
  { icon: GraduationCap, title: "Students", note: "Personal roadmap and passport" },
  { icon: School, title: "Colleges", note: "Career readiness analytics" },
  { icon: Users, title: "Faculty & mentors", note: "Guidance and verification" },
  { icon: Building2, title: "Industry", note: "Post roles, review talent" },
  { icon: Sparkles, title: "Opportunities", note: "Internships to competitions" },
];

const resourceHighlights = [
  { title: "Skilling programmes", note: "PMKVY, NATS apprenticeships, NPTEL and more", image: programsImage },
  { title: "Scholarships", note: "National Scholarship Portal, Pragati, INSPIRE", image: scholarshipsImage },
  { title: "Divyangjan support", note: "UDID, RPwD rights, ADIP assistive devices", image: divyangjanResImage },
  { title: "Exams and guidance", note: "GATE, CAT, UPSC and campus placement tips", image: examsImage },
];

function LandingPage() {
  const { data: me } = useMe();
  const signedIn = Boolean(me);
  const dashboardPath = me ? dashboardPathByRole[me.role] : "/login";

  return (

    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-16 pt-16 sm:px-8 sm:pt-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
          />
          <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="size-2 rounded-full bg-teal" aria-hidden="true" />
              From first semester to first career
            </span>

            <h1 className="text-4xl leading-[1.1] text-foreground sm:text-6xl">
              Your career journey,{" "}
              <span className="bg-gradient-to-r from-primary via-teal to-primary bg-clip-text text-transparent">
                one clear path.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              ABILITY360 is the career operating system for Indian college students — skills,
              roles, roadmap, mentors and real opportunities in one inclusive place.
            </p>

            <div className="mt-9 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="min-h-14 rounded-2xl px-8 text-base font-bold">
                <Link to={signedIn ? dashboardPath : "/register"}>
                  {signedIn ? "Go to dashboard" : "Start for free"}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-14 rounded-2xl px-8 text-base font-bold"
              >
                <Link to="/opportunities">View opportunities</Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Already a member?{" "}
              <Link to="/login" className="font-semibold text-teal underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>

            <img
              src={journeyHero}
              alt="Illustration of Indian college students, including students with disabilities, walking a rising path from campus to work"
              width={1280}
              height={800}
              className="mt-12 w-full rounded-3xl border border-border object-cover shadow-sm"
            />
          </div>
        </section>

        {/* Journey — single column steps */}
        <section aria-labelledby="journey-heading" className="px-6 py-12 sm:px-8">
          <div className="mx-auto w-full max-w-2xl">
            <h2 id="journey-heading" className="text-center text-2xl sm:text-3xl">
              Six steps, start to placed
            </h2>
            <p className="mx-auto mt-3 max-w-md text-center text-muted-foreground">
              Each step unlocks the next. You always know what to do this week.
            </p>

            <ol className="mt-10 space-y-4">
              {journey.map((step, index) => (
                <li
                  key={step.title}
                  className="group flex items-start gap-5 rounded-3xl border border-border bg-card p-6 text-left transition-colors hover:bg-accent"
                >
                  <span
                    className={
                      step.tone === "primary"
                        ? "flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform group-hover:scale-110"
                        : "flex size-12 shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal transition-transform group-hover:scale-110"
                    }
                  >
                    <step.icon className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Ecosystem */}
        <section
          aria-labelledby="pillars-heading"
          className="border-y border-border bg-surface px-6 py-16 sm:px-8"
        >
          <div className="mx-auto w-full max-w-2xl">
            <h2 id="pillars-heading" className="text-center text-2xl sm:text-3xl">
              Five sides, one ecosystem
            </h2>
            <div className="mt-8 space-y-3">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-background p-5"
                >
                  <pillar.icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <h3 className="text-base text-foreground">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground">{pillar.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Inclusion */}
        <section aria-labelledby="inclusion-heading" className="px-6 py-16 sm:px-8">
          <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-teal/30 bg-card text-center">
            <img
              src={divyangjanImage}
              alt="Illustration of professionals with disabilities working with accessible desks, sign language and a braille display"
              loading="lazy"
              width={1280}
              height={800}
              className="h-52 w-full object-cover"
            />
            <div className="p-8">
            <Accessibility className="mx-auto size-8 text-teal" aria-hidden="true" />
            <h2 id="inclusion-heading" className="mt-4 text-2xl">
              Built for every student, including Divyangjan
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Adjust contrast, motion, text size and reading comfort anywhere on the platform. Find
              inclusive employers, accommodations and Indian support schemes. Sharing a disability
              is always optional and never counts against you.
            </p>
            <div className="mt-6">
              <Button asChild variant="outline" className="min-h-12 rounded-2xl px-6 font-bold">
                <Link to="/opportunities">Browse inclusive opportunities</Link>
              </Button>
            </div>
            <div className="mt-3">
              <Button asChild variant="ghost" className="min-h-12 rounded-2xl px-6 font-bold">
                <Link to="/resources">Divyangjan schemes and rights</Link>
              </Button>
            </div>
            </div>
          </div>
        </section>

        {/* Resource library */}
        <section aria-labelledby="resources-heading" className="border-t border-border bg-surface px-6 py-16 sm:px-8">
          <div className="mx-auto w-full max-w-2xl text-center">
            <h2 id="resources-heading" className="text-2xl sm:text-3xl">
              Programmes, scholarships and guidance
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              A growing library of Indian skilling programmes, scholarships, Divyangjan schemes,
              national exams and practical career articles — searchable by state and category.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {resourceHighlights.map((item) => (
                <Link
                  key={item.title}
                  to="/resources"
                  className="overflow-hidden rounded-3xl border border-border bg-background text-left transition-colors hover:border-primary/50"
                >
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    width={1024}
                    height={640}
                    className="h-32 w-full object-cover"
                  />
                  <div className="p-5">
                    <h3 className="text-base text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Button asChild size="lg" className="min-h-14 rounded-2xl px-8 text-base font-bold">
                <Link to="/resources">
                  Open the resource library
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-6 pb-24 text-center sm:px-8" aria-labelledby="cta-heading">
          <div className="mx-auto w-full max-w-2xl">
            <h2 id="cta-heading" className="text-3xl sm:text-4xl">
              One account, the right workspace
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Sign in and ABILITY360 opens your space — student, employer, college or mentor.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="min-h-14 rounded-2xl px-8 text-base font-bold">
                <Link to={signedIn ? dashboardPath : "/register"}>
                  {signedIn ? "Go to your workspace" : "Create your account"}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-14 rounded-2xl px-8 text-base font-bold"
              >
                <Link to="/roles">Explore career roles</Link>
              </Button>
            </div>
            <p className="mt-8 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Accessibility-first · Inclusive of Divyangjan · WCAG 2.1 AA
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
