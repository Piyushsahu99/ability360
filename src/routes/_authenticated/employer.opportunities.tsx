import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createOpportunity,
  deleteOpportunity,
  emptyOpportunityForm,
  employerApplicantsQueryOptions,
  employerOpportunitiesQueryOptions,
  opportunityFormSchema,
  opportunityToForm,
  setOpportunityPublished,
  updateOpportunity,
  type OpportunityFormValues,
} from "@/lib/employer";
import { employerNav } from "@/lib/nav";
import {
  formatDeadline,
  opportunityTypeLabels,
  workModeLabels,
  type Opportunity,
} from "@/lib/opportunities";

export const Route = createFileRoute("/_authenticated/employer/opportunities")({
  head: () => ({
    meta: [
      { title: "Manage opportunities — ABILITY360" },
      {
        name: "description",
        content:
          "Create and publish jobs, internships, projects, apprenticeships, challenges and mentorship offers.",
      },
      { property: "og:title", content: "Manage opportunities — ABILITY360" },
      {
        property: "og:description",
        content: "Draft, publish and track every opportunity you post.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmployerOpportunitiesPage,
});

function EmployerOpportunitiesPage() {
  const queryClient = useQueryClient();
  const { data: opportunities, isPending } = useQuery(employerOpportunitiesQueryOptions);
  const { data: applicants } = useQuery(employerApplicantsQueryOptions);
  const [tab, setTab] = useState<"all" | "published" | "draft">("all");
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [creating, setCreating] = useState(false);

  const list = opportunities ?? [];
  const filtered = list.filter((item) =>
    tab === "all" ? true : tab === "published" ? item.is_published : !item.is_published,
  );

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      setOpportunityPublished(id, publish),
    onSuccess: (_data, variables) => {
      toast.success(variables.publish ? "Opportunity published" : "Moved back to drafts");
      void queryClient.invalidateQueries({ queryKey: ["employer", "opportunities"] });
      void queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onSuccess: () => {
      toast.success("Opportunity deleted");
      void queryClient.invalidateQueries({ queryKey: ["employer", "opportunities"] });
      void queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function applicantCount(opportunityId: string) {
    return (applicants ?? []).filter((item) => item.opportunity_id === opportunityId).length;
  }

  return (
    <DashboardShell
      role="industry"
      title="Opportunities"
      subtitle="Jobs, internships, projects, apprenticeships, challenges and mentorship — all in one place."
      nav={employerNav("/employer/opportunities")}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total posted" value={String(list.length)} hint="Drafts and published" />
        <StatCard
          label="Published"
          value={String(list.filter((item) => item.is_published).length)}
          hint="Visible to students"
        />
        <StatCard
          label="Drafts"
          value={String(list.filter((item) => !item.is_published).length)}
          hint="Only visible to you"
        />
      </div>

      <PanelCard
        title="Your postings"
        description="Publish when ready — drafts stay private to your team."
        action={
          <Button className="min-h-11" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New opportunity
          </Button>
        }
      >
        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-4 space-y-3">
          {isPending && <p className="text-sm text-muted-foreground">Loading your postings…</p>}

          {!isPending && filtered.length === 0 && (
            <EmptyState
              title="Nothing here yet"
              description="Create your first opportunity to start receiving applications."
              action={<Button onClick={() => setCreating(true)}>Create opportunity</Button>}
            />
          )}

          {filtered.map((item) => (
            <article key={item.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge variant={item.is_published ? "default" : "secondary"}>
                      {item.is_published ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="outline">{opportunityTypeLabels[item.type]}</Badge>
                    <Badge variant="outline">{workModeLabels[item.mode]}</Badge>
                    {item.is_inclusive_employer && <Badge variant="secondary">Inclusive</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.organisation} · {item.location} · Apply by {formatDeadline(item.deadline)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {applicantCount(item.id)} applicant(s)
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(item)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      publishMutation.mutate({ id: item.id, publish: !item.is_published })
                    }
                  >
                    {item.is_published ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                    {item.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${item.title}`}
                    onClick={() => deleteMutation.mutate(item.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </PanelCard>

      <OpportunityDialog
        open={creating || Boolean(editing)}
        opportunity={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </DashboardShell>
  );
}

function OpportunityDialog({
  open,
  opportunity,
  onClose,
}: {
  open: boolean;
  opportunity: Opportunity | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<OpportunityFormValues>(emptyOpportunityForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const key = opportunity?.id ?? (open ? "new" : null);
  if (open && key !== loadedFor) {
    setLoadedFor(key);
    setValues(opportunity ? opportunityToForm(opportunity) : emptyOpportunityForm);
    setErrors({});
  }
  if (!open && loadedFor !== null) setLoadedFor(null);

  const mutation = useMutation({
    mutationFn: (input: OpportunityFormValues) =>
      opportunity ? updateOpportunity(opportunity.id, input) : createOpportunity(input),
    onSuccess: () => {
      toast.success(opportunity ? "Opportunity updated" : "Opportunity created");
      void queryClient.invalidateQueries({ queryKey: ["employer", "opportunities"] });
      void queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function set<K extends keyof OpportunityFormValues>(key: K, value: OpportunityFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = opportunityFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{opportunity ? "Edit opportunity" : "New opportunity"}</DialogTitle>
          <DialogDescription>
            Save as a draft first, or publish straight away to students.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(event) => set("title", event.target.value)}
              className="mt-1.5"
            />
            {errors["title"] && <p className="mt-1 text-xs text-destructive">{errors["title"]}</p>}
          </div>

          <div>
            <Label htmlFor="organisation">Organisation</Label>
            <Input
              id="organisation"
              value={values.organisation}
              onChange={(event) => set("organisation", event.target.value)}
              className="mt-1.5"
            />
            {errors["organisation"] && (
              <p className="mt-1 text-xs text-destructive">{errors["organisation"]}</p>
            )}
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={values.location}
              onChange={(event) => set("location", event.target.value)}
              className="mt-1.5"
            />
            {errors["location"] && (
              <p className="mt-1 text-xs text-destructive">{errors["location"]}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={values.type}
              onValueChange={(value) => set("type", value as OpportunityFormValues["type"])}
            >
              <SelectTrigger id="type" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(opportunityTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="mode">Work mode</Label>
            <Select
              value={values.mode}
              onValueChange={(value) => set("mode", value as OpportunityFormValues["mode"])}
            >
              <SelectTrigger id="mode" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(workModeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
              className="mt-1.5"
            />
            {errors["description"] && (
              <p className="mt-1 text-xs text-destructive">{errors["description"]}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="tags">Skills / tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="React, QA, WCAG"
              value={values.tagsText}
              onChange={(event) => set("tagsText", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="stipend">Compensation</Label>
            <Input
              id="stipend"
              placeholder="₹25,000 / month"
              value={values.stipend}
              onChange={(event) => set("stipend", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="deadline">Apply by</Label>
            <Input
              id="deadline"
              type="date"
              value={values.deadline}
              onChange={(event) => set("deadline", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-3 sm:col-span-2">
            <Switch
              id="opp-inclusive"
              checked={values.is_inclusive_employer}
              onCheckedChange={(checked) => set("is_inclusive_employer", checked)}
            />
            <div>
              <Label htmlFor="opp-inclusive">Inclusive opportunity</Label>
              <p className="text-xs text-muted-foreground">
                Signals accommodations are available for Divyangjan candidates.
              </p>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="features">Accommodations offered (comma separated)</Label>
            <Input
              id="features"
              placeholder="Screen reader friendly, Flexible hours"
              value={values.accessibility_featuresText}
              onChange={(event) => set("accessibility_featuresText", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="acc-note">Accessibility note</Label>
            <Textarea
              id="acc-note"
              rows={2}
              value={values.accessibility_note}
              onChange={(event) => set("accessibility_note", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch
              id="publish"
              checked={values.is_published}
              onCheckedChange={(checked) => set("is_published", checked)}
            />
            <Label htmlFor="publish">Publish to students now</Label>
          </div>

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : opportunity ? "Save changes" : "Create opportunity"}
            </Button>
            <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
