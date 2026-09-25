import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultDisplaySettings, readDisplaySettings, writeDisplaySettings, type DisplaySettings } from "@/lib/accessibility";

export const Route = createFileRoute("/experience")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Experience ABILITY360 — see how the platform adapts" },
      { name: "description", content: "Explore how ABILITY360 adapts its interface and opportunity journey to different accessibility requirements." },
      { property: "og:title", content: "Experience ABILITY360 — see how the platform adapts" },
      { property: "og:description", content: "Real product adaptations for visual, hearing, mobility, learning, communication and cognitive needs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExperiencePage,
});

type Mode = {
  id: string;
  title: string;
  settings: Partial<DisplaySettings>;
  adaptations: string[];
  link: { to: string; label: string };
};

const modes: Mode[] = [
  {
    id: "visual",
    title: "Visual accessibility",
    settings: { textScale: "xlarge", highContrast: true, strongFocus: true, underlineLinks: true },
    adaptations: ["Larger text", "High contrast colours", "Screen-reader-friendly headings and landmarks", "Strong keyboard focus and underlined links", "Read page aloud from Access Mode"],
    link: { to: "/opportunities", label: "Browse opportunities in this mode" },
  },
  {
    id: "hearing",
    title: "Hearing accessibility",
    settings: {},
    adaptations: ["Captioned training highlighted in AccessMatch", "Transcripts and written instructions preferred", "Text alerts and in-app messages instead of calls", "Captioned-interview requests in one click"],
    link: { to: "/access", label: "Set communication preferences" },
  },
  {
    id: "mobility",
    title: "Mobility accessibility",
    settings: { strongFocus: true, largeCursor: true },
    adaptations: ["Remote participation checked on every opportunity", "Step-free venue and washroom information shown or flagged missing", "Full keyboard navigation with a skip link", "Larger cursor and 44px touch targets"],
    link: { to: "/opportunities", label: "See AccessMatch" },
  },
  {
    id: "learning",
    title: "Learning preferences",
    settings: { comfortableReading: true, dyslexicFont: true, readingGuide: true },
    adaptations: ["Simplified instructions (“Simplify this page”)", "Step-by-step guided navigation", "Visual summaries with “Explain visually”", "Readable font, comfortable spacing and a reading guide"],
    link: { to: "/learn", label: "Open the learning library" },
  },
  {
    id: "communication",
    title: "Communication accessibility",
    settings: { textSpacing: true },
    adaptations: ["Written alternatives to calls", "Structured interview practice with STAR guidance", "Additional response-time preference in requests", "Text-based interview option"],
    link: { to: "/practice", label: "Try Communication Practice" },
  },
  {
    id: "cognitive",
    title: "Cognitive accessibility",
    settings: { reduceMotion: true, hideDecorativeImages: true, comfortableReading: true },
    adaptations: ["Reduced motion and fewer distractions", "Decorative images hidden", "Plain-language summaries", "Clear “What should I do next?” steps"],
    link: { to: "/dashboard/student", label: "See the student dashboard" },
  },
];

const demo = [
  ["Open Accessibility DNA", "/access"],
  ["Select communication and work preferences", "/access"],
  ["Open an internship", "/opportunities"],
  ["See Career Match", "/opportunities"],
  ["See Accessibility Compatibility", "/opportunities"],
  ["Open “Why this match?”", "/opportunities"],
  ["Identify a barrier", "/access"],
  ["Get suggested supports", "/access"],
  ["Apply (save & track)", "/opportunities"],
  ["Request an accommodation", "/applications"],
  ["Review and approve the request", "/applications"],
  ["Practise the interview", "/practice"],
  ["Employer receives the request", "/employer/applicants"],
  ["Employer confirms support", "/employer/applicants"],
  ["Student is shortlisted", "/employer/applicants"],
  ["Internship is completed", "/employer/applicants"],
  ["Verified outcome appears in Ability Passport", "/dna"],
] as const;

function ExperiencePage() {
  const [active, setActive] = useState<string | null>(null);
  const [original, setOriginal] = useState<DisplaySettings | null>(null);

  useEffect(() => setOriginal(readDisplaySettings()), []);

  function apply(mode: Mode) {
    setActive(mode.id);
    writeDisplaySettings({ ...defaultDisplaySettings, ...mode.settings });
  }
  function reset() {
    setActive(null);
    writeDisplaySettings(original ?? defaultDisplaySettings);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <p className="text-sm font-medium text-primary">ABILITY360 ACCESS</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-4xl">Experience ABILITY360</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Explore how ABILITY360 adapts its interface and opportunity journey to different accessibility requirements. This is
            not a simulation of disability — each mode switches on real product features.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-live="polite">
            {active ? (
              <>
                <span className="text-sm">Active: <strong>{modes.find((m) => m.id === active)?.title}</strong></span>
                <Button variant="outline" className="min-h-11" onClick={reset}><RotateCcw className="size-4" aria-hidden="true" />Restore my settings</Button>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Choose a mode to apply its display adaptations.</span>
            )}
          </div>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modes.map((m) => (
              <li key={m.id}>
                <Card className={`h-full ${active === m.id ? "border-primary ring-2 ring-primary/30" : ""}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{m.title}</CardTitle>
                    <CardDescription>What ABILITY360 does</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-1.5 text-sm">
                      {m.adaptations.map((a) => (
                        <li key={a} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />{a}</li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <Button className="min-h-11" aria-pressed={active === m.id} onClick={() => apply(m)}>
                        {active === m.id ? "Applied" : "Apply this mode"}
                      </Button>
                      <Button asChild variant="outline" className="min-h-11"><Link to={m.link.to}>{m.link.label}</Link></Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <section aria-labelledby="demo-heading" className="mt-12">
            <h2 id="demo-heading" className="text-xl font-bold sm:text-2xl">End-to-end demo flow</h2>
            <p className="mt-1 text-sm text-muted-foreground">Follow these steps with a student and an employer account for a presentation.</p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {demo.map(([label, to], i) => (
                <li key={label}>
                  <Link to={to} className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{i + 1}</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
