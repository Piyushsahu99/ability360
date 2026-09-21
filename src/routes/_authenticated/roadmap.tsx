import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Target, Trophy } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { StudentGoals } from "@/components/student-goals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { studentNav } from "@/lib/nav";
import {
  missingSkills,
  roadmapQueryOptions,
  roadmapWeeks,
  readinessScore,
  setRoadmapTask,
} from "@/lib/roadmap";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({
    meta: [
      { title: "My graduation roadmap — ABILITY360" },
      { name: "description", content: "Follow a personalised, role-aligned roadmap from your current skills to your first career." },
      { property: "og:title", content: "My graduation roadmap — ABILITY360" },
      { property: "og:description", content: "A practical semester-by-semester plan built around your target career role." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoadmapPage,
});

const nav = studentNav("/roadmap");

function RoadmapPage() {
  const { data, isPending, isError, refetch } = useQuery(roadmapQueryOptions);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ key, completed }: { key: string; completed: boolean }) => {
      if (!data?.role) throw new Error("Choose a target role first.");
      return setRoadmapTask(key, data.role.id, completed);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student", "roadmap"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isError) {
    return (
      <DashboardShell role="student" title="My graduation roadmap" subtitle="Your practical path from skills to career evidence." nav={nav}>
        <EmptyState
          title="We couldn't load your roadmap"
          description="Check your connection and try again."
          action={
            <Button variant="outline" className="min-h-11" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      </DashboardShell>
    );
  }

  if (isPending) {
    return <DashboardShell role="student" title="My graduation roadmap" subtitle="Loading your next steps…" nav={nav}><div className="h-48 animate-pulse rounded-lg bg-muted" /></DashboardShell>;
  }

  if (!data?.role) {
    return (
      <DashboardShell role="student" title="My graduation roadmap" subtitle="Your practical path from skills to career evidence." nav={nav}>
        <PanelCard title="Choose a target role" description="Your roadmap becomes personal once you choose the role you want to work towards.">
          <EmptyState message="No target role selected yet." />
          <Button asChild className="mt-4 min-h-11"><Link to="/roles">Explore career roles <ArrowRight aria-hidden="true" /></Link></Button>
        </PanelCard>
      </DashboardShell>
    );
  }

  const gaps = missingSkills(data.role, data.skills);
  const score = readinessScore(data.role, data.skills);
  const done = new Set(data.progress.map((item) => item.task_key));
  const totalTasks = roadmapWeeks.reduce((sum, section) => sum + section.items.length, 0);
  const completedTasks = roadmapWeeks.reduce((sum, section) => sum + section.items.filter((item) => done.has(item.key)).length, 0);

  return (
    <DashboardShell role="student" title="My graduation roadmap" subtitle={`A clear path towards ${data.role.title}, built around your current evidence.`} nav={nav}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Career readiness" value={`${score}%`} hint="Based on your target role skills" icon={Target} />
        <StatCard label="Priority skill gaps" value={String(gaps.length)} hint="Focus on these next" icon={Trophy} />
        <StatCard label="Roadmap progress" value={`${completedTasks}/${totalTasks}`} hint="Steps completed" icon={CheckCircle2} />
        <StatCard label="Current stage" value={`Semester ${data.studentSemester}`} hint="Your plan adapts as you grow" icon={BookOpen} />
      </div>

      <section className="border-l-4 border-primary bg-card p-5 shadow-sm sm:p-6" aria-labelledby="roadmap-role-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Your north star</p>
            <h2 id="roadmap-role-title" className="mt-2 text-2xl font-semibold">{data.role.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{data.role.course} · {data.role.branch} · {data.role.demand} demand</p>
          </div>
          <Button asChild variant="outline" className="min-h-11 shrink-0"><Link to="/roles">Review role details</Link></Button>
        </div>
        <Progress value={score} className="mt-5" aria-label={`Career readiness ${score}%`} />
        <p className="mt-2 text-sm text-muted-foreground">You already match {data.role.skills.length - gaps.length} of {data.role.skills.length} core skills listed for this role.</p>
      </section>

      <section className="bg-card p-5 shadow-sm sm:p-6"><StudentGoals title="Goals I chose" /></section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <PanelCard title="What should I do this week?" description="Small actions that build visible proof, one step at a time.">
          <div className="space-y-6">
            {roadmapWeeks.map((section) => (
              <div key={section.semester}>
                 <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                   <div className="min-w-0"><p className="text-sm font-semibold text-primary">{section.semester}</p><h3 className="mt-1 font-display text-lg">{section.label}</h3></div>
                  <span className="text-xs text-muted-foreground">{section.items.filter((item) => done.has(item.key)).length}/{section.items.length}</span>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item) => {
                    const completed = done.has(item.key);
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                           className="flex min-h-20 w-full items-start gap-3 rounded-md border border-border p-4 text-left transition-colors hover:bg-secondary"
                          aria-pressed={completed}
                          onClick={() => mutation.mutate({ key: item.key, completed: !completed })}
                        >
                          {completed ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" /> : <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                          <span className={completed ? "min-w-0 flex-1 line-through opacity-70" : "min-w-0 flex-1"}>
                             <span className="block text-base font-medium">{item.title}</span>
                             <span className="mt-1 block text-sm text-muted-foreground">{item.detail}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </PanelCard>

        <div className="space-y-6">
          <PanelCard title="Priority skills" description="These are the first gaps to close for your selected role.">
            {gaps.length === 0 ? <EmptyState message="Great work — your saved skills cover every core role skill." /> : <ul className="space-y-3">{gaps.map((skill, index) => <li key={skill} className="flex items-center justify-between gap-3 rounded-md border border-border p-3"><span className="text-sm font-medium">{skill}</span><Badge variant={index === 0 ? "default" : "secondary"}>{index === 0 ? "Start here" : "Next"}</Badge></li>)}</ul>}
            <Button asChild variant="outline" className="mt-4 min-h-11 w-full"><Link to="/assessment">Assess your skills <ArrowRight aria-hidden="true" /></Link></Button>
          </PanelCard>
          <PanelCard title="Turn skills into evidence" description="Your next best moves are already connected to the platform.">
            <div className="space-y-3"><Button asChild variant="outline" className="min-h-11 w-full justify-between"><Link to="/dna">Add a project <ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="outline" className="min-h-11 w-full justify-between"><Link to="/opportunities">Find an opportunity <ArrowRight aria-hidden="true" /></Link></Button></div>
          </PanelCard>
        </div>
      </div>
    </DashboardShell>
  );
}
