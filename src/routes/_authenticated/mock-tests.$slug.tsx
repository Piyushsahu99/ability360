import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  extraTimeSeconds,
  formatClock,
  mockQuestionsQueryOptions,
  mockTestQueryOptions,
} from "@/lib/mock-tests";
import { submitMockTest } from "@/lib/mock-tests.functions";
import { studentNav } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/mock-tests/$slug")({
  head: () => ({
    meta: [
      { title: "Take a mock test — ABILITY360" },
      {
        name: "description",
        content:
          "Take an accessible practice test with extra time, a pausable timer and one-question-at-a-time reading.",
      },
      { property: "og:title", content: "Take a mock test — ABILITY360" },
      {
        property: "og:description",
        content: "Accessible placement practice with instant answers and explanations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MockTestPage,
});

type Result = Awaited<ReturnType<typeof submitMockTest>>;

function MockTestPage() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: test, isPending } = useQuery(mockTestQueryOptions(slug));
  const { data: questions } = useQuery(mockQuestionsQueryOptions(test?.id));
  const submit = useServerFn(submitMockTest);

  const [started, setStarted] = useState(false);
  const [useTimer, setUseTimer] = useState(true);
  const [extraTime, setExtraTime] = useState(true);
  const [onePerPage, setOnePerPage] = useState(true);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const submittedRef = useRef(false);

  const list = useMemo(() => questions ?? [], [questions]);
  const limit = test
    ? test.duration_minutes * 60 + (extraTime ? extraTimeSeconds(test.duration_minutes) : 0)
    : 0;
  const remaining = Math.max(0, limit - elapsed);
  const answered = list.filter((q) => answers[q.id] !== undefined).length;

  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          testId: test!.id,
          secondsUsed: elapsed,
          extraTime: useTimer && extraTime,
          answers: list.map((q) => ({ questionId: q.id, choice: answers[q.id] ?? null })),
        },
      }),
    onSuccess: (data) => {
      setResult(data);
      setStarted(false);
      toast.success(`Scored ${data.score}%`);
      void queryClient.invalidateQueries({ queryKey: ["mock-tests", "attempts"] });
    },
    onError: (error: Error) => {
      submittedRef.current = false;
      toast.error(error.message || "Could not submit the test.");
    },
  });

  useEffect(() => {
    if (!started || !useTimer || paused) return;
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [started, useTimer, paused]);

  useEffect(() => {
    if (!started || !useTimer || remaining > 0 || submittedRef.current || list.length === 0) return;
    submittedRef.current = true;
    toast.info("Time is up — submitting your answers.");
    mutation.mutate();
  }, [started, useTimer, remaining, list.length, mutation]);

  function restart() {
    setResult(null);
    setAnswers({});
    setIndex(0);
    setElapsed(0);
    setPaused(false);
    submittedRef.current = false;
    setStarted(true);
  }

  if (isPending) {
    return (
      <DashboardShell role="student" title="Mock test" subtitle="Loading." nav={studentNav("/mock-tests")}>
        <Skeleton className="h-96 w-full" />
      </DashboardShell>
    );
  }

  if (!test) {
    return (
      <DashboardShell role="student" title="Mock test" subtitle="Not found." nav={studentNav("/mock-tests")}>
        <EmptyState message="This mock test is no longer available." />
      </DashboardShell>
    );
  }

  const visible = onePerPage && started ? list.slice(index, index + 1) : list;

  return (
    <DashboardShell role="student" title={test.title} subtitle={test.description} nav={studentNav("/mock-tests")}>
      <Button asChild variant="ghost" className="w-fit min-h-11">
        <Link to="/mock-tests">
          <ArrowLeft aria-hidden="true" />
          All mock tests
        </Link>
      </Button>

      {result ? (
        <ResultPanel result={result} onRetake={restart} />
      ) : !started ? (
        <PanelCard title="Before you start" description="Set the test up the way that works for you.">
          <ul className="space-y-3">
            <SettingRow
              id="use-timer"
              label="Use a timer"
              hint={`${test.duration_minutes} minutes. Switch off for stress-free practice.`}
              checked={useTimer}
              onChange={setUseTimer}
            />
            <SettingRow
              id="extra-time"
              label="Compensatory extra time"
              hint={`Adds ${Math.round(extraTimeSeconds(test.duration_minutes) / 60)} minutes — 20 minutes per hour, as allowed under the RPwD Act.`}
              checked={extraTime}
              onChange={setExtraTime}
            />
            <SettingRow
              id="one-per-page"
              label="One question at a time"
              hint="Less on screen, easier to track with a screen reader or magnifier."
              checked={onePerPage}
              onChange={setOnePerPage}
            />
          </ul>
          {test.accessibility_notes && (
            <p className="mt-4 text-sm text-muted-foreground">{test.accessibility_notes}</p>
          )}
          <Button className="mt-4 min-h-11" onClick={restart} disabled={list.length === 0}>
            <Play aria-hidden="true" />
            Start the test
          </Button>
        </PanelCard>
      ) : (
        <PanelCard
          title={onePerPage ? `Question ${index + 1} of ${list.length}` : "All questions"}
          description={`${answered} of ${list.length} answered`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Progress value={list.length ? (answered / list.length) * 100 : 0} aria-label="Answered so far" />
          </div>

          {useTimer && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p
                className="flex items-center gap-1.5 text-sm font-medium"
                aria-live="polite"
                aria-atomic="true"
              >
                <Clock className="size-4" aria-hidden="true" />
                {formatClock(remaining)} left
              </p>
              <Button size="sm" variant="outline" className="min-h-11" onClick={() => setPaused((p) => !p)}>
                {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                {paused ? "Resume" : "Pause"}
              </Button>
              <Button size="sm" variant="ghost" className="min-h-11" onClick={() => setUseTimer(false)}>
                Remove the timer
              </Button>
            </div>
          )}

          <form
            className="mt-6 space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (submittedRef.current) return;
              submittedRef.current = true;
              mutation.mutate();
            }}
          >
            {visible.map((question) => (
              <fieldset key={question.id} className="rounded-lg border border-border p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {question.position}. {question.topic}
                </legend>
                <p className="text-sm font-medium">{question.prompt}</p>
                <RadioGroup
                  className="mt-3 space-y-2"
                  value={answers[question.id]?.toString() ?? ""}
                  onValueChange={(value) =>
                    setAnswers((prev) => ({ ...prev, [question.id]: Number(value) }))
                  }
                >
                  {question.options.map((option, optionIndex) => {
                    const id = `${question.id}-${optionIndex}`;
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <RadioGroupItem value={String(optionIndex)} id={id} />
                        <Label htmlFor={id} className="text-sm font-normal">
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </fieldset>
            ))}

            <div className="flex flex-wrap gap-3">
              {onePerPage && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={index === 0}
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  >
                    <ArrowLeft aria-hidden="true" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={index >= list.length - 1}
                    onClick={() => setIndex((i) => Math.min(list.length - 1, i + 1))}
                  >
                    Next
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </>
              )}
              <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
                {mutation.isPending ? "Scoring…" : "Submit test"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Unanswered questions are marked wrong, but you can retake the test as many times as you like.
            </p>
          </form>
        </PanelCard>
      )}
    </DashboardShell>
  );
}

function SettingRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
      <div>
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </li>
  );
}

function ResultPanel({ result, onRetake }: { result: Result; onRetake: () => void }) {
  return (
    <PanelCard title="Your result" description={`${result.correctCount} of ${result.total} correct`}>
      <div className="flex flex-wrap items-end gap-6">
        <p className="font-display text-5xl font-bold text-primary">{result.score}%</p>
        <div className="flex flex-wrap gap-2">
          {result.weakTopics.length === 0 ? (
            <Badge variant="secondary">No gaps found</Badge>
          ) : (
            result.weakTopics.map((topic) => (
              <Badge key={topic} variant="outline">
                Revise: {topic}
              </Badge>
            ))
          )}
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {result.review.map((item) => (
          <li key={item.id} className="rounded-lg border border-border p-4">
            <p className="flex items-start gap-2 text-sm font-medium">
              {item.correct ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              )}
              <span>
                {item.position}. {item.prompt}
              </span>
            </p>
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">Correct answer: </span>
              {item.options[item.correctIndex]}
            </p>
            <p className="text-sm text-muted-foreground">
              Your answer:{" "}
              {item.chosen === null ? "not answered" : item.options[item.chosen]}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{item.explanation}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" className="min-h-11" onClick={onRetake}>
          <RotateCcw aria-hidden="true" />
          Retake
        </Button>
        <Button asChild className="min-h-11">
          <Link to="/learn">Revise in the learning library</Link>
        </Button>
      </div>
    </PanelCard>
  );
}
