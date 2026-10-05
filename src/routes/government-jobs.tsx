import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CalendarCheck, GraduationCap, Landmark, TrainFront } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const URL = "https://ability360.lovable.app/government-jobs";
const TITLE = "Technical Government Jobs for Engineering Students in India — ABILITY360";
const DESCRIPTION =
  "A practical guide to technical government jobs for engineering students in India: RRB JE, SSC JE, PSU recruitment through GATE, ISRO, DRDO, state engineering services and defence technical entries.";

const PATHS = [
  {
    icon: TrainFront,
    name: "Railways — RRB JE and RRB SSE",
    body: "The Railway Recruitment Boards hire Junior Engineers (RRB JE) in civil, mechanical, electrical, electronics and signal & telecommunication streams. Exams are conducted by RRBs across India and notified on the official RRB websites. Diploma holders and engineering graduates are both eligible for different posts.",
  },
  {
    icon: Landmark,
    name: "PSU recruitment through GATE",
    body: "Many Public Sector Undertakings — such as ONGC, NTPC, BHEL, IOCL and GAIL — shortlist engineer trainees using GATE scores. A strong GATE result in your branch is the single most common entry route into maharatna and navratna PSUs. Each PSU releases its own notification after GATE results.",
  },
  {
    icon: Building2,
    name: "SSC JE and central departments",
    body: "The Staff Selection Commission's Junior Engineer exam recruits for CPWD, Central Water Commission, MES and other central departments in civil, electrical and mechanical engineering. Notifications appear on ssc.gov.in.",
  },
  {
    icon: GraduationCap,
    name: "ISRO, DRDO and research labs",
    body: "ISRO's ICRB and DRDO's RAC recruit scientists and technical staff through their own written tests and interviews, and sometimes through GATE. Watch isro.gov.in and drdo.gov.in for Scientist/Engineer and Technician posts.",
  },
  {
    icon: CalendarCheck,
    name: "State engineering services and defence",
    body: "State Public Service Commissions run Assistant Engineer exams for state PWD, irrigation and electricity boards. The Indian Army, Navy and Air Force also run technical entries (TGC, SSC Tech, AFCAT technical branch) for engineering graduates.",
  },
];

const STEPS = [
  "Pick 2–3 target paths (for example GATE + RRB JE) instead of applying everywhere.",
  "Check the official notification for eligibility, age limits and important dates — never rely on forwarded messages.",
  "Build the core subjects early: most technical exams test your branch fundamentals plus general aptitude.",
  "Keep documents ready: degree/diploma certificates, category certificates, Aadhaar and passport photos.",
  "Track deadlines in one place so you never miss an application window.",
];

export const Route = createFileRoute("/government-jobs")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: URL }],
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          author: { "@type": "Organization", name: "ABILITY360" },
          publisher: { "@type": "Organization", name: "ABILITY360" },
          mainEntityOfPage: URL,
        }),
      },
    ],
  }),
  component: GovernmentJobsPage,
});

function GovernmentJobsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 bg-surface">
        <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <p className="text-sm font-medium text-primary">Guide</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-4xl">
            Technical government jobs for engineering students in India
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Government technical roles remain one of the most stable career paths for Indian engineering
            students and diploma holders. This guide maps the main routes, who they suit, and how to prepare
            — so you can plan early instead of scrambling in your final year.
          </p>

          <div className="mt-8 space-y-4">
            {PATHS.map((path) => (
              <Card key={path.name} className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <path.icon className="size-5 text-primary" aria-hidden="true" />
                    {path.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {path.body}
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="mt-10 text-xl font-bold sm:text-2xl">How to prepare, step by step</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <div className="mt-10 rounded-3xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Keep track with ABILITY360</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              We list current government scholarships, exams and programmes from official sources, and you can
              save opportunities, track deadlines and plan your preparation on your personal roadmap.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/resources">
                  Browse current schemes and exams
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/opportunities">See opportunities</Link>
              </Button>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
