import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard } from "@/components/dashboard-shell";
import { SimpleProse } from "@/components/simple-prose";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  learningModuleQueryOptions,
  learningProgressQueryOptions,
  setModuleProgress,
} from "@/lib/learning";
import { studentNav } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/learn/$slug")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Lesson — ABILITY360 learning library" },
      {
        name: "description",
        content: "A short, plain-language lesson with accessible formatting and saved progress.",
      },
      { property: "og:title", content: "Lesson — ABILITY360 learning library" },
      {
        property: "og:description",
        content: "Accessible career and rights lessons for Indian college students.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: module, isPending } = useQuery(learningModuleQueryOptions(slug));
  const { data: progress } = useQuery(learningProgressQueryOptions);

  const done = (progress ?? []).some((p) => p.module_id === module?.id && p.status === "completed");

  const mutation = useMutation({
    mutationFn: (status: "in_progress" | "completed") => setModuleProgress(module!.id, status),
    onSuccess: (_data, status) => {
      toast.success(status === "completed" ? "Lesson marked complete" : "Progress reset");
      void queryClient.invalidateQueries({ queryKey: ["learning", "progress"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <DashboardShell
      role="student"
      title={module?.title ?? "Lesson"}
      subtitle={module?.summary ?? "Loading the lesson."}
      nav={studentNav("/learn")}
    >
      <Button asChild variant="ghost" className="w-fit min-h-11">
        <Link to="/learn">
          <ArrowLeft aria-hidden="true" />
          Back to the library
        </Link>
      </Button>

      {isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : !module ? (
        <EmptyState message="This lesson is no longer available." />
      ) : (
        <PanelCard title={module.category} description={`${module.level} · ${module.duration_minutes} min`}>
          <div className="flex flex-wrap gap-2">
            {module.accessibility_tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
            {module.format_tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            Take as long as you need — there is no timer here.
          </p>

          <article className="mt-4 max-w-3xl">
            <SimpleProse body={module.body} />
          </article>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              className="min-h-11"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(done ? "in_progress" : "completed")}
            >
              <CheckCircle2 aria-hidden="true" />
              {done ? "Mark as not finished" : "Mark as complete"}
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/mock-tests">Practise with a mock test</Link>
            </Button>
          </div>
        </PanelCard>
      )}
    </DashboardShell>
  );
}
