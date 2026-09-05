import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gavel } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/lib/auth";
import { judgeCompetitionsQueryOptions, judgingQueueQueryOptions, saveScore } from "@/lib/competitions";
import { navForRole } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/judging")({
  head: () => ({
    meta: [
      { title: "Judging panel — ABILITY360" },
      { name: "description", content: "Score competition entries on innovation, technical depth, impact and presentation." },
      { property: "og:title", content: "Judging panel — ABILITY360" },
      { property: "og:description", content: "A transparent rubric for scoring student competition entries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JudgingPage,
});

function JudgingPage() {
  const { data: me } = useMe();
  const role = me?.role ?? "industry";
  const queryClient = useQueryClient();
  const { data: assignments, isPending } = useQuery(judgeCompetitionsQueryOptions);
  const [selected, setSelected] = useState<string | null>(null);

  const activeId = selected ?? assignments?.[0]?.competition_id ?? null;
  const { data: queue } = useQuery(judgingQueueQueryOptions(activeId));

  const scored = queue?.scores.length ?? 0;
  const total = queue?.submissions.length ?? 0;

  return (
    <DashboardShell
      role={role}
      title="Judging panel"
      subtitle="Score entries fairly on a shared rubric — 10 points per criterion."
      nav={navForRole(role, "/judging")}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Competitions" value={String(assignments?.length ?? 0)} hint="Where you are a judge" icon={Gavel} />
        <StatCard label="Entries" value={String(total)} hint="In the selected competition" />
        <StatCard label="Scored by you" value={String(scored)} hint={`${total - scored} left to review`} />
      </div>

      <PanelCard title="Your competitions" description="Pick the challenge you are judging.">
        {isPending ? (
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        ) : (assignments ?? []).length === 0 ? (
          <EmptyState message="You have not been added to a judging panel yet." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {(assignments ?? []).map((row) => (
              <Button
                key={row.id}
                variant={row.competition_id === activeId ? "default" : "outline"}
                className="min-h-11"
                onClick={() => setSelected(row.competition_id)}
              >
                {row.competitions?.title ?? "Competition"}
              </Button>
            ))}
          </div>
        )}
      </PanelCard>

      {activeId && queue && (
        <PanelCard title="Entries to score" description="Your scores stay private until the organiser publishes results.">
          {queue.submissions.length === 0 ? (
            <EmptyState message="No submissions yet." />
          ) : (
            <ul className="space-y-3">
              {queue.submissions.map((submission) => {
                const existing = queue.scores.find((score) => score.submission_id === submission.id) ?? null;
                return (
                  <ScoreCard
                    key={submission.id}
                    competitionId={activeId}
                    submission={submission}
                    existing={existing}
                    onDone={() => void queryClient.invalidateQueries({ queryKey: ["competitions"] })}
                  />
                );
              })}
            </ul>
          )}
        </PanelCard>
      )}
    </DashboardShell>
  );
}

function ScoreCard({
  competitionId,
  submission,
  existing,
  onDone,
}: {
  competitionId: string;
  submission: {
    id: string;
    title: string;
    summary: string;
    demo_link: string | null;
    repo_link: string | null;
    profiles: { full_name: string } | null;
  };
  existing: { innovation: number; technical: number; impact: number; presentation: number; note: string } | null;
  onDone: () => void;
}) {
  const [innovation, setInnovation] = useState(existing?.innovation ?? 0);
  const [technical, setTechnical] = useState(existing?.technical ?? 0);
  const [impact, setImpact] = useState(existing?.impact ?? 0);
  const [presentation, setPresentation] = useState(existing?.presentation ?? 0);
  const [note, setNote] = useState(existing?.note ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      saveScore({ competitionId, submissionId: submission.id, innovation, technical, impact, presentation, note }),
    onSuccess: () => {
      toast.success("Score saved");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const criteria: [string, number, (value: number) => void][] = [
    ["Innovation", innovation, setInnovation],
    ["Technical depth", technical, setTechnical],
    ["Impact", impact, setImpact],
    ["Presentation", presentation, setPresentation],
  ];

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{submission.title}</p>
          <p className="text-xs text-muted-foreground">{submission.profiles?.full_name ?? "Participant"}</p>
        </div>
        {existing && <Badge className="bg-primary-soft text-primary">Scored {innovation + technical + impact + presentation}/40</Badge>}
      </div>
      {submission.summary && <p className="mt-2 text-sm text-muted-foreground">{submission.summary}</p>}
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        {submission.demo_link && (
          <a className="text-primary underline" href={submission.demo_link} target="_blank" rel="noreferrer">
            Demo
          </a>
        )}
        {submission.repo_link && (
          <a className="text-primary underline" href={submission.repo_link} target="_blank" rel="noreferrer">
            Code or document
          </a>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        {criteria.map(([label, value, setValue]) => (
          <div key={label}>
            <Label htmlFor={`${submission.id}-${label}`}>{label}</Label>
            <Input
              id={`${submission.id}-${label}`}
              type="number"
              min={0}
              max={10}
              className="mt-1"
              value={value}
              onChange={(event) => setValue(Math.max(0, Math.min(10, Number(event.target.value))))}
            />
          </div>
        ))}
      </div>
      <Textarea
        className="mt-3"
        rows={2}
        placeholder="Feedback for the organiser"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <Button className="mt-3 min-h-11" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? "Saving…" : existing ? "Update score" : "Save score"}
      </Button>
    </li>
  );
}
