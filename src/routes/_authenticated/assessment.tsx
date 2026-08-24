import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen,
  Briefcase,
  CheckCircle2,
  Compass,
  Dna,
  LayoutDashboard,
  RotateCcw,
  Target,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  assessmentCategories,
  attemptsQueryOptions,
  levelLabels,
  questionsQueryOptions,
  type SkillCategory,
} from "@/lib/assessment";
import { submitAssessment } from "@/lib/assessment.functions";

export const Route = createFileRoute("/_authenticated/assessment")({
  head: () => ({
    meta: [
      { title: "Skill assessment — ABILITY360" },
      {
        name: "description",
        content:
          "Assess your technical, soft, aptitude and domain skills with deterministic scoring and verified skill levels.",
      },
      { property: "og:title", content: "Skill assessment — ABILITY360" },
      {
        property: "og:description",
        content: "Deterministic skill assessments that show your score, level, strengths and skill gaps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssessmentPage,
});

const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Student DNA", icon: Dna },
  { label: "Skills", icon: Target, active: true },
  { label: "Learning", icon: BookOpen },
  { label: "Applications", icon: Briefcase },
  { label: "Opportunities", icon: Compass },
];

type Result = Awaited<ReturnType<typeof submitAssessment>>;

function AssessmentPage() {
  const [category, setCategory] = useState<SkillCategory>("technical");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const queryClient = useQueryClient();

  const { data: questions, isPending } = useQuery(questionsQueryOptions(category));
  const { data: attempts } = useQuery(attemptsQueryOptions);
  const submit = useServerFn(submitAssessment);

  const mutation = useMutation({
    mutationFn: (payload: { category: SkillCategory; answers: { questionId: string; choice: number }[] }) =>
      submit({ data: payload }),
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Scored ${data.score}% — ${levelLabels[data.level]}`);
      void queryClient.invalidateQueries({ queryKey: ["assessment", "attempts"] });
      void queryClient.invalidateQueries({ queryKey: ["student", "dna"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not submit the assessment."),
  });

  const list = questions ?? [];
  const answered = list.filter((q) => answers[q.id] !== undefined).length;
  const progress = list.length === 0 ? 0 : Math.round((answered / list.length) * 100);
  const best = (attempts ?? []).reduce((max, a) => Math.max(max, a.score), 0);

  function reset(next: SkillCategory) {
    setCategory(next);
    setAnswers({});
    setResult(null);
  }

  return (
    <DashboardShell
      role="student"
      title="Skill assessment"
      subtitle="Deterministic scoring across technical, soft, aptitude and domain skills."
      nav={nav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attempts" value={String(attempts?.length ?? 0)} hint="All categories" icon={Target} />
        <StatCard label="Best score" value={`${best}%`} hint="Across your attempts" icon={CheckCircle2} />
        <StatCard label="Questions" value={String(list.length)} hint="In this category" icon={BookOpen} />
        <StatCard
          label="Answered"
          value={`${answered}/${list.length}`}
          hint="Answer all to submit"
          icon={Compass}
        />
      </div>

      <Tabs value={category} onValueChange={(value) => reset(value as SkillCategory)}>
        <TabsList className="flex w-full flex-wrap">
          {assessmentCategories.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="min-h-11 flex-1">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-sm text-muted-foreground">
        {assessmentCategories.find((c) => c.value === category)?.blurb}
      </p>

      {result ? (
        <ResultPanel result={result} onRetake={() => reset(category)} />
      ) : (
        <PanelCard title="Questions" description="Choose one answer per question. You can retake any time.">
          <Progress value={progress} aria-label="Assessment progress" />
          {isPending ? (
            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="mt-6">
              <EmptyState message="No questions available in this category yet." />
            </div>
          ) : (
            <form
              className="mt-6 space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (answered < list.length) {
                  toast.error("Answer every question before submitting.");
                  return;
                }
                mutation.mutate({
                  category,
                  answers: list.map((q) => ({ questionId: q.id, choice: answers[q.id]! })),
                });
              }}
            >
              {list.map((question, index) => (
                <fieldset key={question.id} className="rounded-lg border border-border p-4">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    {index + 1}. {question.topic}
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

              <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
                {mutation.isPending ? "Scoring…" : "Submit assessment"}
              </Button>
            </form>
          )}
        </PanelCard>
      )}

      <PanelCard title="Past attempts" description="Your assessment history.">
        {(attempts ?? []).length === 0 ? (
          <EmptyState message="No attempts yet." />
        ) : (
          <ul className="space-y-3">
            {(attempts ?? []).map((attempt) => (
              <li
                key={attempt.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium capitalize">{attempt.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(attempt.created_at).toLocaleString()} · {attempt.correct_count}/
                    {attempt.total_questions} correct
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{levelLabels[attempt.level]}</Badge>
                  <span className="font-display text-lg">{attempt.score}%</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </DashboardShell>
  );
}

function ResultPanel({ result, onRetake }: { result: Result; onRetake: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="font-display text-5xl font-bold text-primary">{result.score}%</p>
            <p className="text-sm text-muted-foreground">
              {result.correctCount} of {result.total} correct
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {levelLabels[result.level]}
          </Badge>
          {result.verifiedSkills && (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Skills in this category upgraded to assessment verified
            </p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
              Strengths
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.strongTopics.length === 0 ? (
                <span className="text-sm text-muted-foreground">None yet.</span>
              ) : (
                result.strongTopics.map((topic) => (
                  <Badge key={topic} variant="secondary">
                    {topic}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <TriangleAlert className="size-4 text-amber" aria-hidden="true" />
              Skill gaps
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.weakTopics.length === 0 ? (
                <span className="text-sm text-muted-foreground">No gaps found — well done.</span>
              ) : (
                result.weakTopics.map((topic) => (
                  <Badge key={topic} variant="outline">
                    {topic}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="min-h-11" onClick={onRetake}>
            <RotateCcw aria-hidden="true" />
            Retake
          </Button>
          <Button asChild className="min-h-11">
            <Link to="/dna">View Student DNA</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
