import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Clock, GraduationCap } from "lucide-react";
import { useState } from "react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { learningModulesQueryOptions, learningProgressQueryOptions } from "@/lib/learning";
import { studentNav } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/learn/")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Learning library — ABILITY360" },
      {
        name: "description",
        content:
          "Short, accessible lessons on Divyangjan rights, assistive technology, resumes, interviews, aptitude and SQL.",
      },
      { property: "og:title", content: "Learning library — ABILITY360" },
      {
        property: "og:description",
        content: "Plain-language, screen-reader friendly lessons for Indian college students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LearnIndex,
});

function LearnIndex() {
  const { data: modules, isPending } = useQuery(learningModulesQueryOptions);
  const { data: progress } = useQuery(learningProgressQueryOptions);
  const [category, setCategory] = useState<string>("all");

  const list = modules ?? [];
  const categories = ["all", ...new Set(list.map((m) => m.category))];
  const filtered = category === "all" ? list : list.filter((m) => m.category === category);
  const completed = new Set(
    (progress ?? []).filter((p) => p.status === "completed").map((p) => p.module_id),
  );
  const minutes = list.reduce((sum, m) => sum + m.duration_minutes, 0);

  return (
    <DashboardShell
      role="student"
      title="Learning library"
      subtitle="Short lessons written in plain language, readable with a screen reader or at any text size."
      nav={studentNav("/learn")}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Lessons" value={String(list.length)} hint="Free for every student" icon={BookOpen} />
        <StatCard label="Completed" value={String(completed.size)} hint="Saved to your account" icon={CheckCircle2} />
        <StatCard label="Total reading" value={`${minutes} min`} hint="Across the library" icon={Clock} />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter lessons by topic">
        {categories.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={category === item ? "default" : "outline"}
            className="min-h-11"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item === "all" ? "All topics" : item}
          </Button>
        ))}
      </div>

      <PanelCard title="Lessons" description="Pick any lesson — your progress is saved automatically.">
        {isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No lessons in this topic yet." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtered.map((module) => (
              <li key={module.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{module.category}</Badge>
                  <Badge variant="outline" className="font-normal capitalize">
                    {module.level}
                  </Badge>
                  {completed.has(module.id) && (
                    <Badge className="gap-1 bg-primary-soft text-primary hover:bg-primary-soft">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      Completed
                    </Badge>
                  )}
                </div>
                <h3 className="mt-2 font-display text-base font-semibold">{module.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{module.summary}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {module.duration_minutes} min · {module.accessibility_tags.join(", ")}
                </p>
                <Button asChild variant="outline" className="mt-3 min-h-11">
                  <Link to="/learn/$slug" params={{ slug: module.slug }}>
                    <GraduationCap aria-hidden="true" />
                    Open lesson
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </DashboardShell>
  );
}
