import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, ClipboardList, Play, Target } from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { mockAttemptsQueryOptions, mockTestsQueryOptions } from "@/lib/mock-tests";
import { studentNav } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/mock-tests/")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Mock tests — ABILITY360" },
      {
        name: "description",
        content:
          "Timed practice tests in aptitude, SQL and workplace communication, with extra time and one-question-at-a-time support.",
      },
      { property: "og:title", content: "Mock tests — ABILITY360" },
      {
        property: "og:description",
        content: "Accessible placement practice tests with instant answers and explanations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MockTestsIndex,
});

function MockTestsIndex() {
  const { data: tests, isPending } = useQuery(mockTestsQueryOptions);
  const { data: attempts } = useQuery(mockAttemptsQueryOptions);

  const list = tests ?? [];
  const history = attempts ?? [];
  const best = history.reduce((max, a) => Math.max(max, a.score), 0);

  return (
    <DashboardShell
      role="student"
      title="Mock tests"
      subtitle="Practice under exam conditions — or with the timer switched off. Your choice, every time."
      nav={studentNav("/mock-tests")}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Tests available" value={String(list.length)} hint="Free to retake" icon={ClipboardList} />
        <StatCard label="Attempts" value={String(history.length)} hint="Saved to your account" icon={Target} />
        <StatCard label="Best score" value={`${best}%`} hint="Across all tests" icon={Play} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Every test offers compensatory time of 20 extra minutes per hour, a one-question-at-a-time
        view, and the option to remove the timer completely. Nothing you choose here is shared with
        employers or your college.
      </div>

      <PanelCard title="Choose a test" description="Answers and explanations are shown as soon as you submit.">
        {isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState message="No mock tests are published yet." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map((test) => {
              const last = history.find((a) => a.test_id === test.id);
              return (
                <li key={test.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{test.category}</Badge>
                    <Badge variant="outline" className="font-normal capitalize">
                      {test.difficulty}
                    </Badge>
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold">{test.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{test.description}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {test.duration_minutes} minutes
                    {last ? ` · last score ${last.score}%` : ""}
                  </p>
                  <Button asChild className="mt-3 min-h-11">
                    <Link to="/mock-tests/$slug" params={{ slug: test.slug }}>
                      <Play aria-hidden="true" />
                      {last ? "Retake test" : "Start test"}
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </PanelCard>

      <PanelCard title="Your attempts" description="Every attempt, newest first.">
        {history.length === 0 ? (
          <EmptyState message="No attempts yet." />
        ) : (
          <ul className="space-y-3">
            {history.map((attempt) => {
              const test = list.find((t) => t.id === attempt.test_id);
              return (
                <li
                  key={attempt.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{test?.title ?? "Mock test"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(attempt.created_at).toLocaleString("en-IN")} · {attempt.correct_count}/
                      {attempt.total_questions} correct
                      {attempt.extra_time ? " · extra time used" : ""}
                    </p>
                  </div>
                  <span className="font-display text-lg">{attempt.score}%</span>
                </li>
              );
            })}
          </ul>
        )}
      </PanelCard>
    </DashboardShell>
  );
}
