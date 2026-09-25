import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

import { PanelCard } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { accessDnaQueryOptions, computeAccessMatch, dnaCount, employerAccessMapQueryOptions, myAccommodationsQueryOptions } from "@/lib/access";
import { applicationsQueryOptions } from "@/lib/applications";
import { opportunitiesQueryOptions } from "@/lib/opportunities";

export function AccessJourney() {
  const { data: dna } = useQuery(accessDnaQueryOptions);
  const { data: apps } = useQuery(applicationsQueryOptions);
  const { data: accs } = useQuery(myAccommodationsQueryOptions);
  const { data: opps } = useQuery(opportunitiesQueryOptions);
  const { data: employers } = useQuery(employerAccessMapQueryOptions);

  const prefs = dnaCount(dna);
  const matched = (opps ?? []).filter((o) => {
    const m = computeAccessMatch(dna, o, o.posted_by ? employers?.[o.posted_by] : null);
    return m.score !== null && m.score >= 50;
  }).length;
  const activeAccs = (accs ?? []).filter((a) => a.status !== "withdrawn");
  const supported = activeAccs.filter((a) => ["accepted", "arranged"].includes(a.status)).length;
  const list = apps ?? [];
  const placed = list.filter((a) => ["selected", "completed"].includes(a.status)).length;
  const verified = list.filter((a) => a.status === "completed").length;
  const shortlisted = list.find((a) => ["shortlisted", "interview"].includes(a.status));

  const steps = [
    { label: "Accessibility preferences configured", value: prefs ? `${prefs} chosen` : "Not yet", done: prefs > 0 },
    { label: "Matched opportunities", value: `${matched}`, done: matched > 0 },
    { label: "Accommodation requests", value: `${activeAccs.length}`, done: activeAccs.length > 0 },
    { label: "Interview support confirmed", value: `${supported}`, done: supported > 0 },
    { label: "Internship / job", value: `${placed}`, done: placed > 0 },
    { label: "Verified outcome", value: `${verified}`, done: verified > 0 },
  ];

  const next: { text: string; to: string }[] = [];
  if (!prefs) next.push({ text: "Complete your Accessibility DNA", to: "/access" });
  if (shortlisted) next.push({ text: `Review accessibility information for “${shortlisted.opportunities?.title ?? "your shortlisted role"}”`, to: "/applications" });
  if (shortlisted && !activeAccs.some((a) => a.application_id === shortlisted.id)) next.push({ text: "Request interview accommodation", to: "/applications" });
  next.push({ text: "Practice your interview", to: "/practice" });
  if (placed > verified || verified === 0) next.push({ text: "Add a verified achievement to your Ability Passport", to: "/dna" });

  return (
    <PanelCard title="Your Accessibility Journey" description="From your preferences to a verified outcome — all under your control.">
      <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Accessibility journey stages">
        {steps.map((s, i) => (
          <li key={s.label} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {s.done ? <CheckCircle2 className="size-4 text-teal" aria-hidden="true" /> : <Circle className="size-4" aria-hidden="true" />}
              <span>Step {i + 1}{s.done ? " · done" : ""}</span>
            </div>
            <p className="mt-1 text-sm font-medium leading-snug">{s.label}</p>
            <p className="mt-1 text-lg font-semibold">{s.value}</p>
          </li>
        ))}
      </ol>
      <h3 className="mt-5 text-sm font-semibold">What should I do next?</h3>
      <ul className="mt-2 space-y-2">
        {next.slice(0, 4).map((n) => (
          <li key={n.text}>
            <Button asChild variant="outline" className="min-h-11 w-full justify-between whitespace-normal text-left">
              <Link to={n.to}>
                {n.text}
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}
