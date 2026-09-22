import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, CalendarDays, Check, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  changeGoalPriority,
  deleteGoal,
  goalCategories,
  goalCategoryLabels,
  goalSchema,
  saveGoal,
  setGoalCompleted,
  studentGoalsQueryOptions,
  type GoalValues,
  type StudentGoal,
} from "@/lib/goals";

type Props = { compact?: boolean; limit?: number; title?: string };

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export function StudentGoals({ compact = false, limit, title = "My goals" }: Props) {
  const { data = [], isPending } = useQuery(studentGoalsQueryOptions);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<StudentGoal | null>(null);
  const [open, setOpen] = useState(false);
  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { title: "", notes: "", category: "career", priority: 2, targetDate: "" },
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: studentGoalsQueryOptions.queryKey });
    void queryClient.invalidateQueries({ queryKey: ["student", "journey"] });
  };
  const save = useMutation({
    mutationFn: (values: GoalValues) => saveGoal(values, editing?.id),
    onSuccess: () => {
      refresh();
      setOpen(false);
      setEditing(null);
      form.reset();
      toast.success(editing ? "Goal updated" : "Goal added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const complete = useMutation({
    mutationFn: ({ goal, done }: { goal: StudentGoal; done: boolean }) => setGoalCompleted(goal, done),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const priority = useMutation({
    mutationFn: ({ goal, direction }: { goal: StudentGoal; direction: -1 | 1 }) => changeGoalPriority(goal, direction),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      refresh();
      toast.success("Goal removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function showEditor(goal?: StudentGoal) {
    setEditing(goal ?? null);
    form.reset(
      goal
        ? {
            title: goal.title,
            notes: goal.notes,
            category: goal.category as GoalValues["category"],
            priority: goal.priority,
            targetDate: goal.target_date ?? "",
          }
        : { title: "", notes: "", category: "career", priority: 2, targetDate: "" },
    );
    setOpen(true);
  }

  const sorted = [...data].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (a.target_date ?? "9999").localeCompare(b.target_date ?? "9999");
  });
  const shown = limit ? sorted.slice(0, limit) : sorted;

  return (
    <section aria-labelledby="student-goals-title">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 id="student-goals-title" className="text-lg">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Set your own next steps and keep them moving.</p>
        </div>
        <Button type="button" className="min-h-11 shrink-0" onClick={() => showEditor()}>
          <Plus aria-hidden="true" /> <span className={compact ? "sr-only sm:not-sr-only" : ""}>Add goal</span>
        </Button>
      </div>

      {isPending ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading goals…</p>
      ) : shown.length === 0 ? (
        <div className="mt-4 border-l-2 border-primary pl-4 py-2">
          <p className="font-medium">Choose one goal for this week</p>
          <p className="mt-1 text-sm text-muted-foreground">A course, skill, application, or personal career step all count.</p>
        </div>
      ) : (
        <ol className="mt-4 space-y-3">
          {shown.map((goal) => {
            const done = goal.status === "completed";
            return (
              <li key={goal.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-border pb-3 last:border-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                <Button
                  type="button"
                  size="icon"
                  variant={done ? "secondary" : "outline"}
                  className="min-h-11 min-w-11 shrink-0 rounded-full"
                  aria-label={done ? `Reopen ${goal.title}` : `Complete ${goal.title}`}
                  onClick={() => complete.mutate({ goal, done: !done })}
                >
                  {done ? <RotateCcw aria-hidden="true" /> : <Check aria-hidden="true" />}
                </Button>
                <div className="min-w-0 py-0.5">
                  <p className={done ? "font-medium line-through opacity-70" : "font-medium"}>{goal.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{goalCategoryLabels[goal.category as keyof typeof goalCategoryLabels] ?? goal.category}</Badge>
                    <span>Priority {goal.priority}</span>
                    {goal.target_date ? <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden="true" />{displayDate(goal.target_date)}</span> : null}
                  </div>
                  {!compact && goal.notes ? <p className="mt-2 text-sm text-muted-foreground">{goal.notes}</p> : null}
                </div>
                <div className={compact ? "flex shrink-0 items-start gap-1 sm:col-auto" : "col-span-2 flex shrink-0 items-start justify-end gap-1 sm:col-span-1 sm:justify-start"}>
                  {!compact ? (
                    <>
                      <Button type="button" size="icon" variant="ghost" className="min-h-11 min-w-11" aria-label={`Raise priority for ${goal.title}`} disabled={goal.priority === 1} onClick={() => priority.mutate({ goal, direction: -1 })}><ArrowUp aria-hidden="true" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="min-h-11 min-w-11" aria-label={`Lower priority for ${goal.title}`} disabled={goal.priority === 3} onClick={() => priority.mutate({ goal, direction: 1 })}><ArrowDown aria-hidden="true" /></Button>
                    </>
                  ) : null}
                  <Button type="button" size="icon" variant="ghost" className="min-h-11 min-w-11" aria-label={`Edit ${goal.title}`} onClick={() => showEditor(goal)}><Pencil aria-hidden="true" /></Button>
                  {!compact ? <Button type="button" size="icon" variant="ghost" className="min-h-11 min-w-11 text-destructive" aria-label={`Delete ${goal.title}`} onClick={() => remove.mutate(goal.id)}><Trash2 aria-hidden="true" /></Button> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit goal" : "Add a goal"}</DialogTitle>
            <DialogDescription>Keep it specific and achievable. You can change it anytime.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
            <div className="space-y-2">
              <Label htmlFor="goal-title">Goal</Label>
              <Input id="goal-title" className="min-h-11" placeholder="Complete my portfolio project" {...form.register("title")} />
              {form.formState.errors.title ? <p className="text-sm text-destructive">{form.formState.errors.title.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-notes">Notes (optional)</Label>
              <Textarea id="goal-notes" className="min-h-24" placeholder="What does done look like?" {...form.register("notes")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.watch("category")} onValueChange={(value) => form.setValue("category", value as GoalValues["category"])}>
                  <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{goalCategories.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={String(form.watch("priority"))} onValueChange={(value) => form.setValue("priority", Number(value))}>
                  <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">1 — High</SelectItem><SelectItem value="2">2 — Medium</SelectItem><SelectItem value="3">3 — Later</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-date">Target date</Label>
                <Input id="goal-date" type="date" className="min-h-11" {...form.register("targetDate")} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="min-h-11" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="min-h-11" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save goal"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}