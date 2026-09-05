import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Plus, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/lib/auth";
import {
  addJudge,
  competitionCategories,
  competitionCategoryLabels,
  competitionSchema,
  competitionStatusLabels,
  competitionToForm,
  createCompetition,
  deleteCompetition,
  emptyCompetition,
  formatDate,
  issueAward,
  organiserCompetitionDetailQueryOptions,
  organiserCompetitionsQueryOptions,
  removeJudge,
  revokeAward,
  updateCompetition,
  type CompetitionValues,
} from "@/lib/competitions";
import { navForRole } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/organiser/competitions")({
  head: () => ({
    meta: [
      { title: "Run competitions — ABILITY360" },
      { name: "description", content: "Create challenges, invite judges, review submissions and issue verified certificates." },
      { property: "og:title", content: "Run competitions — ABILITY360" },
      { property: "og:description", content: "Everything organisers need: setup, registrations, judging panel, leaderboard and awards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrganiserCompetitionsPage,
});

function OrganiserCompetitionsPage() {
  const { data: me } = useMe();
  const role = me?.role ?? "industry";
  const queryClient = useQueryClient();
  const { data: competitions, isPending } = useQuery(organiserCompetitionsQueryOptions);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CompetitionValues>(emptyCompetition);

  const activeId = selected ?? competitions?.[0]?.id ?? null;
  const active = (competitions ?? []).find((row) => row.id === activeId) ?? null;
  const { data: detail } = useQuery(organiserCompetitionDetailQueryOptions(activeId));

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["competitions"] });
  }

  const save = useMutation({
    mutationFn: async () => {
      const parsed = competitionSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the form");
      if (editing) await updateCompetition(editing, parsed.data);
      else await createCompetition(parsed.data);
    },
    onSuccess: () => {
      toast.success(editing ? "Competition updated" : "Competition created");
      setShowForm(false);
      setEditing(null);
      setForm(emptyCompetition);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const nav = navForRole(role, "/organiser/competitions");
  const totalRegistrations = detail?.registrations.length ?? 0;
  const totalSubmissions = detail?.submissions.length ?? 0;

  return (
    <DashboardShell
      role={role}
      title="Competitions"
      subtitle="Create challenges, run judging and issue verified certificates."
      nav={nav}
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Competitions" value={String(competitions?.length ?? 0)} hint="Created by you" icon={Trophy} />
        <StatCard label="Registrations" value={String(totalRegistrations)} hint="On the selected challenge" />
        <StatCard label="Submissions" value={String(totalSubmissions)} hint="Entries received" />
        <StatCard label="Certificates" value={String(detail?.awards.length ?? 0)} hint="Verified awards issued" icon={Award} />
      </div>

      <PanelCard
        title="Your challenges"
        description="Select a challenge to manage its judging panel and awards."
        action={
          <Button
            className="min-h-11"
            onClick={() => {
              setForm(emptyCompetition);
              setEditing(null);
              setShowForm((value) => !value);
            }}
          >
            <Plus aria-hidden="true" /> New competition
          </Button>
        }
      >
        {isPending ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        ) : (competitions ?? []).length === 0 ? (
          <EmptyState message="You have not created a competition yet." />
        ) : (
          <ul className="space-y-2">
            {(competitions ?? []).map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelected(row.id)}
                  className={`w-full rounded-lg border p-3 text-left text-sm ${
                    row.id === activeId ? "border-primary bg-primary-soft/40" : "border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{row.title}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline">{competitionStatusLabels[row.status]}</Badge>
                      {!row.is_published && <Badge variant="secondary">Unpublished</Badge>}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {competitionCategoryLabels[row.category] ?? row.category} · Register by{" "}
                    {formatDate(row.registration_deadline)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {active && !showForm && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setForm(competitionToForm(active));
                setEditing(active.id);
                setShowForm(true);
              }}
            >
              Edit "{active.title}"
            </Button>
            <Button asChild variant="ghost" className="min-h-11">
              <Link to="/competitions/$competitionId" params={{ competitionId: active.id }}>
                View public page
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="min-h-11 text-destructive"
              onClick={async () => {
                await deleteCompetition(active.id);
                setSelected(null);
                toast.success("Competition deleted");
                refresh();
              }}
            >
              Delete
            </Button>
          </div>
        )}

        {showForm && <CompetitionForm form={form} setForm={setForm} onSave={() => save.mutate()} saving={save.isPending} />}
      </PanelCard>

      {active && detail && (
        <>
          <PanelCard title="Registrations" description={`Participants on ${active.title}.`}>
            {detail.registrations.length === 0 ? (
              <EmptyState message="No registrations yet." />
            ) : (
              <ul className="space-y-2">
                {detail.registrations.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium">{row.profiles?.full_name ?? "Student"}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.profiles?.department ?? "Department not set"}
                        {row.accommodation_note ? " · Accommodation requested" : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{row.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <JudgesPanel
            competitionId={active.id}
            judges={detail.judges}
            onDone={refresh}
          />

          <PanelCard title="Leaderboard and awards" description="Issue a certificate straight to the winner's Ability Passport.">
            {detail.leaderboard.length === 0 ? (
              <EmptyState message="No judged entries yet." />
            ) : (
              <ul className="space-y-2">
                {detail.leaderboard.map((row) => {
                  const awarded = detail.awards.find((award) => award.student_id === row.student_id);
                  return (
                    <li key={row.submission_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
                          {row.rank_position}
                        </span>
                        <div>
                          <p className="font-medium">{row.team_name || row.student_name || "Entry"}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.title} · {Number(row.avg_score).toFixed(1)} avg · {row.judge_count} judge
                            {Number(row.judge_count) === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      {awarded ? (
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-secondary px-2 py-1 text-xs">{awarded.certificate_code}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-11 min-w-11"
                            aria-label="Revoke award"
                            onClick={async () => {
                              await revokeAward(awarded.id);
                              toast.success("Award revoked");
                              refresh();
                            }}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="min-h-11"
                          onClick={async () => {
                            if (!row.student_id) return;
                            const rank = Number(row.rank_position);
                            const label = rank === 1 ? "Winner" : rank === 2 ? "Runner up" : rank === 3 ? "Second runner up" : "Finalist";
                            await issueAward({
                              competitionId: active.id,
                              studentId: row.student_id,
                              teamId: row.team_id,
                              rank,
                              label,
                              score: Number(row.avg_score),
                            });
                            toast.success("Certificate issued and verified");
                            refresh();
                          }}
                        >
                          Issue certificate
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </PanelCard>
        </>
      )}
    </DashboardShell>
  );
}

function JudgesPanel({
  competitionId,
  judges,
  onDone,
}: {
  competitionId: string;
  judges: { id: string; judge_id: string; profiles: { full_name: string } | null }[];
  onDone: () => void;
}) {
  const [judgeId, setJudgeId] = useState("");
  const add = useMutation({
    mutationFn: () => addJudge(competitionId, judgeId.trim()),
    onSuccess: () => {
      toast.success("Judge added");
      setJudgeId("");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PanelCard title="Judging panel" description="Judges score every entry on innovation, technical depth, impact and presentation.">
      {judges.length === 0 ? (
        <EmptyState message="No judges added yet." />
      ) : (
        <ul className="space-y-2">
          {judges.map((judge) => (
            <li key={judge.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
              <span>{judge.profiles?.full_name ?? judge.judge_id}</span>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11"
                aria-label="Remove judge"
                onClick={async () => {
                  await removeJudge(judge.id);
                  toast.success("Judge removed");
                  onDone();
                }}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div className="min-w-64 flex-1">
          <Label htmlFor="judge-id">Add a judge by member ID</Label>
          <Input
            id="judge-id"
            className="mt-1"
            placeholder="Paste the member ID"
            value={judgeId}
            onChange={(event) => setJudgeId(event.target.value)}
          />
        </div>
        <Button className="min-h-11" disabled={judgeId.trim().length < 10 || add.isPending} onClick={() => add.mutate()}>
          Add judge
        </Button>
      </div>
    </PanelCard>
  );
}

function CompetitionForm({
  form,
  setForm,
  onSave,
  saving,
}: {
  form: CompetitionValues;
  setForm: (values: CompetitionValues) => void;
  onSave: () => void;
  saving: boolean;
}) {
  function update<K extends keyof CompetitionValues>(key: K, value: CompetitionValues[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="c-title">Title</Label>
          <Input id="c-title" className="mt-1" value={form.title} onChange={(event) => update("title", event.target.value)} />
        </div>
        <div>
          <Label htmlFor="c-org">Organiser</Label>
          <Input id="c-org" className="mt-1" value={form.organisation} onChange={(event) => update("organisation", event.target.value)} />
        </div>
        <div>
          <Label htmlFor="c-category">Category</Label>
          <Select value={form.category} onValueChange={(value) => update("category", value as CompetitionValues["category"])}>
            <SelectTrigger id="c-category" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {competitionCategories.map((item) => (
                <SelectItem key={item} value={item}>
                  {competitionCategoryLabels[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="c-mode">Mode</Label>
          <Select value={form.mode} onValueChange={(value) => update("mode", value as CompetitionValues["mode"])}>
            <SelectTrigger id="c-mode" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="c-location">Location</Label>
          <Input id="c-location" className="mt-1" value={form.location ?? ""} onChange={(event) => update("location", event.target.value)} />
        </div>
        <div>
          <Label htmlFor="c-status">Stage</Label>
          <Select value={form.status} onValueChange={(value) => update("status", value as CompetitionValues["status"])}>
            <SelectTrigger id="c-status" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="open">Registrations open</SelectItem>
              <SelectItem value="judging">Judging in progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="c-min">Minimum team size</Label>
          <Input id="c-min" type="number" min={1} className="mt-1" value={form.teamMin} onChange={(event) => update("teamMin", Number(event.target.value))} />
        </div>
        <div>
          <Label htmlFor="c-max">Maximum team size</Label>
          <Input id="c-max" type="number" min={1} className="mt-1" value={form.teamMax} onChange={(event) => update("teamMax", Number(event.target.value))} />
        </div>
        <div>
          <Label htmlFor="c-reg">Registration deadline</Label>
          <Input id="c-reg" type="date" className="mt-1" value={form.registrationDeadline ?? ""} onChange={(event) => update("registrationDeadline", event.target.value)} />
        </div>
        <div>
          <Label htmlFor="c-sub">Submission deadline</Label>
          <Input id="c-sub" type="date" className="mt-1" value={form.submissionDeadline ?? ""} onChange={(event) => update("submissionDeadline", event.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="c-summary">Short summary</Label>
        <Input id="c-summary" className="mt-1" value={form.summary ?? ""} onChange={(event) => update("summary", event.target.value)} />
      </div>
      <div>
        <Label htmlFor="c-desc">Description</Label>
        <Textarea id="c-desc" rows={4} className="mt-1" value={form.description ?? ""} onChange={(event) => update("description", event.target.value)} />
      </div>
      <div>
        <Label htmlFor="c-skills">Skills involved (comma separated)</Label>
        <Input id="c-skills" className="mt-1" value={form.skills ?? ""} onChange={(event) => update("skills", event.target.value)} />
      </div>
      <div>
        <Label htmlFor="c-rules">Rules</Label>
        <Textarea id="c-rules" rows={3} className="mt-1" value={form.rules ?? ""} onChange={(event) => update("rules", event.target.value)} />
      </div>
      <div>
        <Label htmlFor="c-prize">Prizes and recognition</Label>
        <Input id="c-prize" className="mt-1" value={form.prizeDetails ?? ""} onChange={(event) => update("prizeDetails", event.target.value)} />
      </div>
      <div>
        <Label htmlFor="c-access">Accessibility and accommodation note</Label>
        <Textarea id="c-access" rows={2} className="mt-1" value={form.accessibilityNote ?? ""} onChange={(event) => update("accessibilityNote", event.target.value)} />
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Switch id="c-published" checked={form.isPublished} onCheckedChange={(value) => update("isPublished", value)} />
          <Label htmlFor="c-published">Published</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="c-inclusive" checked={form.isInclusive} onCheckedChange={(value) => update("isInclusive", value)} />
          <Label htmlFor="c-inclusive">Inclusive challenge</Label>
        </div>
      </div>

      <Button className="min-h-11" disabled={saving} onClick={onSave}>
        {saving ? "Saving…" : "Save competition"}
      </Button>
    </div>
  );
}
