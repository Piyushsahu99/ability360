import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BadgeCheck, GraduationCap, Target, Users } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { facultyNav } from "@/lib/nav";
import {
  addFeedback,
  deleteFeedback,
  facultyDirectoryQueryOptions,
  feedbackKindLabels,
  feedbackKinds,
  recommendOpportunity,
  removeRecommendation,
  setProjectVerified,
  setSkillVerification,
  skillGapsFor,
  studentDetailQueryOptions,
  type FacultyStudent,
} from "@/lib/faculty";
import { opportunitiesQueryOptions } from "@/lib/opportunities";
import { verificationLabels } from "@/lib/dna";

export const Route = createFileRoute("/_authenticated/faculty/students")({
  head: () => ({
    meta: [
      { title: "My students — ABILITY360 faculty workspace" },
      {
        name: "description",
        content:
          "Mentor your assigned students: track roadmap progress, close skill gaps, verify skills and projects, give feedback and recommend opportunities.",
      },
      { property: "og:title", content: "Faculty workspace — ABILITY360" },
      {
        property: "og:description",
        content: "Verify student skills and projects, share feedback and recommend opportunities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FacultyStudentsPage,
});

function FacultyStudentsPage() {
  const { data: rows = [], isPending, error } = useQuery(facultyDirectoryQueryOptions);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.full_name, row.department, row.target_role_title, row.career_goal]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(term),
    );
  }, [rows, search]);

  const activeId = selected ?? filtered[0]?.student_id ?? null;
  const active = filtered.find((row) => row.student_id === activeId) ?? null;

  const assigned = rows.filter((row) => row.assigned).length;
  const avgReadiness =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((total, row) => total + Number(row.readiness), 0) / rows.length);
  const verified = rows.reduce((total, row) => total + Number(row.skills_verified), 0);

  return (
    <DashboardShell
      role="faculty"
      title="My students"
      subtitle="Only students assigned to you, or in your own department at your college, appear here."
      nav={facultyNav("/faculty/students")}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students in scope" value={String(rows.length)} hint="Authorised for you" icon={Users} />
        <StatCard label="Directly assigned" value={String(assigned)} hint="Assigned by your college" icon={GraduationCap} />
        <StatCard label="Average readiness" value={`${avgReadiness}%`} hint="Against target roles" icon={Target} />
        <StatCard label="Verified skills" value={String(verified)} hint="Across your students" icon={BadgeCheck} />
      </div>

      {error ? (
        <EmptyState title="We could not load your students" description={error.message} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <PanelCard title="Student list" description="Search by name, department, target role or goal.">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search students"
            aria-label="Search students"
            className="mb-4"
          />
          {isPending ? (
            <EmptyState message="Loading your students…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No students yet"
              description="Ask your college admin to assign students to you, or set your department on your profile."
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((row) => (
                <li key={row.student_id}>
                  <button
                    type="button"
                    onClick={() => setSelected(row.student_id)}
                    aria-current={row.student_id === activeId ? "true" : undefined}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      row.student_id === activeId
                        ? "border-primary bg-primary-soft"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{row.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[row.department, row.year_of_study ? `Year ${row.year_of_study}` : null]
                            .filter(Boolean)
                            .join(" · ") || "Department not set"}
                        </p>
                      </div>
                      <Badge variant={row.assigned ? "default" : "secondary"}>
                        {row.assigned ? "Assigned" : "Department"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Readiness {Number(row.readiness)}% · {Number(row.skills_verified)}/{Number(row.skills_total)} skills verified
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>

        {active ? <StudentPanel student={active} /> : null}
      </div>
    </DashboardShell>
  );
}

function StudentPanel({ student }: { student: FacultyStudent }) {
  const queryClient = useQueryClient();
  const { data: detail, isPending } = useQuery(studentDetailQueryOptions(student.student_id));
  const { data: opportunities = [] } = useQuery(opportunitiesQueryOptions);

  const [kind, setKind] = useState<string>("general");
  const [body, setBody] = useState("");
  const [opportunityId, setOpportunityId] = useState<string>("");
  const [note, setNote] = useState("");

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["faculty"] });
  }

  const verifySkill = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      setSkillVerification(id, verified ? "faculty_verified" : "self_declared"),
    onSuccess: () => {
      toast.success("Skill verification updated");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const verifyProject = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) => setProjectVerified(id, verified),
    onSuccess: () => {
      toast.success("Project verification updated");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const feedbackMutation = useMutation({
    mutationFn: () => addFeedback({ studentId: student.student_id, kind, body: body.trim() }),
    onSuccess: () => {
      toast.success("Feedback shared with the student");
      setBody("");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeFeedbackMutation = useMutation({
    mutationFn: (id: string) => deleteFeedback(id),
    onSuccess: refresh,
    onError: (err: Error) => toast.error(err.message),
  });

  const recommendMutation = useMutation({
    mutationFn: () => recommendOpportunity(student.student_id, opportunityId, note.trim()),
    onSuccess: () => {
      toast.success("Opportunity recommended");
      setOpportunityId("");
      setNote("");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeRecommendationMutation = useMutation({
    mutationFn: (id: string) => removeRecommendation(id),
    onSuccess: refresh,
    onError: (err: Error) => toast.error(err.message),
  });

  const gaps = skillGapsFor(detail?.role ?? null, detail?.skills ?? []);

  return (
    <div className="space-y-6">
      <PanelCard
        title={student.full_name}
        description={[student.degree, student.department, student.year_of_study ? `Year ${student.year_of_study}` : null]
          .filter(Boolean)
          .join(" · ") || "Profile details not set"}
        action={
          <Badge variant="secondary">
            {student.target_role_title ?? "No target role"}
          </Badge>
        }
      >
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Career readiness</dt>
            <dd className="text-lg font-semibold">{Number(student.readiness)}%</dd>
            <Progress value={Number(student.readiness)} className="mt-2" />
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Roadmap steps done</dt>
            <dd className="text-lg font-semibold">{Number(student.roadmap_completed)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Applications</dt>
            <dd className="text-lg font-semibold">
              {Number(student.applications_total)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({Number(student.applications_active)} active)
              </span>
            </dd>
          </div>
        </dl>
        {student.career_goal ? (
          <p className="mt-4 text-sm text-muted-foreground">Goal: {student.career_goal}</p>
        ) : null}
      </PanelCard>

      <PanelCard
        title="Skill gaps"
        description={
          detail?.role
            ? `Compared with the skills required for ${detail.role.title}.`
            : "This student has not chosen a target role yet."
        }
      >
        {detail?.role ? (
          <>
            <Progress value={gaps.coverage} aria-label="Skill coverage" />
            <p className="mt-2 text-xs text-muted-foreground">
              {gaps.matched.length} of {detail.role.skills.length} required skills covered ({gaps.coverage}%).
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {gaps.missing.length === 0 ? (
                <p className="text-sm text-muted-foreground">No gaps left for this role.</p>
              ) : (
                gaps.missing.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))
              )}
            </div>
          </>
        ) : (
          <EmptyState
            title="No target role selected"
            description="Encourage the student to pick a role so gaps can be measured."
            action={
              <Button asChild variant="outline">
                <Link to="/roles">Browse career roles</Link>
              </Button>
            }
          />
        )}
      </PanelCard>

      <PanelCard title="Verify skills" description="Faculty verification appears on the student's DNA profile.">
        {isPending ? (
          <EmptyState message="Loading skills…" />
        ) : (detail?.skills.length ?? 0) === 0 ? (
          <EmptyState title="No skills saved yet" description="The student has not added skills to their DNA." />
        ) : (
          <ul className="space-y-2">
            {detail?.skills.map((skill) => {
              const isVerified = skill.verification_status === "faculty_verified";
              return (
                <li
                  key={skill.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{skill.skills?.name ?? "Skill"}</p>
                    <p className="text-xs text-muted-foreground">
                      Level {skill.level} · {verificationLabels[skill.verification_status] ?? skill.verification_status}
                    </p>
                  </div>
                  <Button
                    variant={isVerified ? "outline" : "default"}
                    className="min-h-11"
                    disabled={verifySkill.isPending}
                    onClick={() => verifySkill.mutate({ id: skill.id, verified: !isVerified })}
                  >
                    {isVerified ? "Remove verification" : "Verify skill"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </PanelCard>

      <PanelCard title="Verify projects" description="Confirm the work you have personally reviewed.">
        {(detail?.projects.length ?? 0) === 0 ? (
          <EmptyState title="No projects yet" description="Nothing to review in the student's portfolio." />
        ) : (
          <ul className="space-y-2">
            {detail?.projects.map((project) => (
              <li key={project.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.technologies.join(", ") || "No technologies listed"}
                    </p>
                  </div>
                  <Button
                    variant={project.verified_at ? "outline" : "default"}
                    className="min-h-11"
                    disabled={verifyProject.isPending}
                    onClick={() => verifyProject.mutate({ id: project.id, verified: !project.verified_at })}
                  >
                    {project.verified_at ? "Remove verification" : "Verify project"}
                  </Button>
                </div>
                {project.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard title="Feedback" description="Written guidance the student can read on their dashboard.">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
            <div>
              <Label htmlFor="feedback-kind">Type</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger id="feedback-kind" className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {feedbackKinds.map((value) => (
                    <SelectItem key={value} value={value}>
                      {feedbackKindLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="feedback-body">Feedback</Label>
              <Textarea
                id="feedback-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={3}
                className="mt-1"
                placeholder="What should this student focus on next?"
              />
            </div>
          </div>
          <Button
            className="min-h-11"
            disabled={body.trim().length < 3 || feedbackMutation.isPending}
            onClick={() => feedbackMutation.mutate()}
          >
            Share feedback
          </Button>
        </div>

        <ul className="mt-5 space-y-2">
          {(detail?.feedback ?? []).map((item) => (
            <li key={item.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary">{feedbackKindLabels[item.subject_kind] ?? item.subject_kind}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-sm">{item.body}</p>
              <Button
                variant="ghost"
                className="mt-1 h-8 px-2 text-xs"
                onClick={() => removeFeedbackMutation.mutate(item.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </PanelCard>

      <PanelCard title="Recommend opportunities" description="Point the student at roles that suit their gaps.">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Label htmlFor="recommend-opportunity">Opportunity</Label>
            <Select value={opportunityId} onValueChange={setOpportunityId}>
              <SelectTrigger id="recommend-opportunity" className="mt-1">
                <SelectValue placeholder="Choose an opportunity" />
              </SelectTrigger>
              <SelectContent>
                {opportunities.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title} — {item.organisation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="recommend-note">Why this one?</Label>
            <Input
              id="recommend-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1"
              placeholder="Matches their data skills"
            />
          </div>
        </div>
        <Button
          className="mt-3 min-h-11"
          disabled={!opportunityId || recommendMutation.isPending}
          onClick={() => recommendMutation.mutate()}
        >
          Recommend
        </Button>

        <ul className="mt-5 space-y-2">
          {(detail?.recommendations ?? []).map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.opportunities?.title ?? "Opportunity"}</p>
                <p className="text-xs text-muted-foreground">
                  {item.opportunities?.organisation ?? ""}
                  {item.note ? ` · ${item.note}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                className="h-8 px-2 text-xs"
                onClick={() => removeRecommendationMutation.mutate(item.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
