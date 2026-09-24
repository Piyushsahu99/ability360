import { Link } from "@tanstack/react-router";
import { AlertTriangle, Check, ChevronDown, HelpCircle, Info } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { AccessMatch } from "@/lib/access";

export function AccessMatchPanel({
  careerScore,
  match,
  hasDna,
  opportunityTitle,
}: {
  careerScore: number | null;
  match: AccessMatch;
  hasDna: boolean;
  opportunityTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const scoreText =
    !hasDna ? "Not set up" : match.relevant === 0 ? "No work needs selected" : match.score === null ? "Information unavailable" : `${match.score}%`;

  return (
    <section aria-label={`Match details for ${opportunityTitle}`} className="rounded-xl border border-border bg-surface p-3">
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-muted-foreground">Career match</dt>
          <dd className="text-lg font-semibold">{careerScore === null ? "—" : `${careerScore}%`}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Accessibility compatibility</dt>
          <dd className="text-lg font-semibold">{scoreText}</dd>
        </div>
      </dl>
      {!hasDna ? (
        <p className="mt-2 text-xs text-muted-foreground">
          <Link to="/access" className="font-medium text-primary underline-offset-2 hover:underline">
            Set up your Accessibility DNA
          </Link>{" "}
          (optional) to see compatibility.
        </p>
      ) : (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-2 min-h-11 w-full justify-between px-2">
              Why this match?
              <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2 text-sm">
            {match.matches.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold">Matching your preferences</h4>
                <ul className="mt-1 space-y-1">
                  {match.matches.map((m) => (
                    <li key={m.section + m.preference} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
                      <span>
                        <span className="sr-only">Matches: </span>
                        {m.preference} <span className="text-muted-foreground">— {m.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {match.missing.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold">Information missing</h4>
                <ul className="mt-1 space-y-1">
                  {match.missing.map((m) => (
                    <li key={m.section + m.preference} className="flex gap-2">
                      <HelpCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span>
                        <span className="sr-only">Unknown: </span>
                        {m.preference} <span className="text-muted-foreground">— Accessibility information unavailable</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {match.barriers.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold">Potential barriers</h4>
                <ul className="mt-1 space-y-1">
                  {match.barriers.map((m) => (
                    <li key={m.section + m.preference} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                      <span>
                        <span className="sr-only">Barrier: </span>
                        {m.preference} <span className="text-muted-foreground">— {m.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {match.questions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold">Questions you could ask the employer</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {match.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
            {match.platformHandled.length > 0 && (
              <p className="flex gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                ABILITY360 handles your learning and communication preferences on the platform itself (
                {match.platformHandled.slice(0, 4).join(", ")}
                {match.platformHandled.length > 4 ? "…" : ""}), so they don't affect this score.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Calculated only from information the employer has confirmed and the preferences you chose. Missing
              information is never treated as accessible, and your preferences never lower your ranking.
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  );
}
