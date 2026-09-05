import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, FileText, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { documentKindLabels, documentUrl, statusLabels } from "@/lib/applications";
import {
  applicantDocumentsQueryOptions,
  applicantPassportQueryOptions,
  employerApplicantsQueryOptions,
  employerStages,
  pipelineStages,
  saveCandidateFeedback,
  updateApplicationStage,
  type ApplicantRow,
} from "@/lib/employer";
import { employerNav } from "@/lib/nav";
import { opportunityTypeLabels } from "@/lib/opportunities";

export const Route = createFileRoute("/_authenticated/employer/applicants")({
  head: () => ({
    meta: [
      { title: "Applicants — ABILITY360" },
      {
        name: "description",
        content:
          "Review applicants, shortlist candidates, schedule interviews, record selections and share feedback.",
      },
      { property: "og:title", content: "Applicants — ABILITY360" },
      {
        property: "og:description",
        content: "Your hiring pipeline from application to selection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApplicantsPage,
});

function ApplicantsPage() {
  const { data: applicants, isPending } = useQuery(employerApplicantsQueryOptions);
  const [stage, setStage] = useState<string>("all");
  const [opportunityId, setOpportunityId] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = applicants ?? [];

  const opportunities = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) map.set(row.opportunity_id, row.opportunities.title);
    return [...map.entries()];
  }, [rows]);

  const filtered = rows.filter(
    (row) =>
      (stage === "all" || row.status === stage) &&
      (opportunityId === "all" || row.opportunity_id === opportunityId),
  );

  const selected = rows.find((row) => row.id === selectedId) ?? filtered[0] ?? null;

  function countBy(status: string) {
    return rows.filter((row) => row.status === status).length;
  }

  return (
    <DashboardShell
      role="industry"
      title="Applicants"
      subtitle="Shortlist, interview, select and give every candidate real feedback."
      nav={employerNav("/employer/applicants")}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {pipelineStages.map((status) => (
          <StatCard
            key={status}
            label={statusLabels[status]}
            value={String(countBy(status))}
            hint="Candidates at this stage"
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <PanelCard title="Pipeline" description="Filter by stage or opportunity.">
            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={opportunityId} onValueChange={setOpportunityId}>
                <SelectTrigger aria-label="Filter by opportunity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All opportunities</SelectItem>
                  {opportunities.map(([id, title]) => (
                    <SelectItem key={id} value={id}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger aria-label="Filter by stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {employerStages.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 space-y-2">
              {isPending && <p className="text-sm text-muted-foreground">Loading applicants…</p>}
              {!isPending && filtered.length === 0 && (
                <EmptyState
                  title="No applicants yet"
                  description="Publish an opportunity and students can apply to it right away."
                />
              )}
              {filtered.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  aria-current={selected?.id === row.id ? "true" : undefined}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selected?.id === row.id
                      ? "border-primary bg-primary-soft"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{row.profiles?.full_name || "Candidate"}</span>
                    <Badge variant="secondary">{statusLabels[row.status]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.opportunities.title} · {opportunityTypeLabels[row.opportunities.type]}
                  </p>
                </button>
              ))}
            </div>
          </PanelCard>
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <CandidatePanel key={selected.id} applicant={selected} />
          ) : (
            <PanelCard title="Candidate" description="Select a candidate to review their profile.">
              <EmptyState description="Nothing selected yet." />
            </PanelCard>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function CandidatePanel({ applicant }: { applicant: ApplicantRow }) {
  const queryClient = useQueryClient();
  const { data: documents } = useQuery(applicantDocumentsQueryOptions(applicant.id));
  const [feedback, setFeedback] = useState(applicant.employer_feedback ?? "");
  const [rating, setRating] = useState(String(applicant.employer_rating ?? ""));
  const [interviewAt, setInterviewAt] = useState(
    applicant.interview_at ? applicant.interview_at.slice(0, 16) : "",
  );

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["employer", "applicants"] });
  }

  const stageMutation = useMutation({
    mutationFn: (status: (typeof employerStages)[number]) =>
      updateApplicationStage(applicant.id, status),
    onSuccess: () => {
      toast.success("Stage updated");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const feedbackMutation = useMutation({
    mutationFn: () =>
      saveCandidateFeedback({
        id: applicant.id,
        feedback,
        rating: rating ? Number(rating) : null,
        interviewAt: interviewAt ? new Date(interviewAt).toISOString() : null,
      }),
    onSuccess: () => {
      toast.success("Feedback saved and shared with the candidate");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function openDocument(doc: (typeof documents extends undefined ? never : NonNullable<typeof documents>)[number]) {
    try {
      const url = await documentUrl(doc);
      if (url) window.open(url, "_blank", "noopener");
      else toast.error("This document is not available.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PanelCard
        title={applicant.profiles?.full_name || "Candidate"}
        description={`${applicant.opportunities.title} · applied ${
          applicant.applied_at
            ? new Date(applicant.applied_at).toLocaleDateString()
            : "recently"
        }`}
        action={<Badge>{statusLabels[applicant.status]}</Badge>}
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Headline</dt>
            <dd>{applicant.profiles?.headline || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Department</dt>
            <dd>{applicant.profiles?.department || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Degree</dt>
            <dd>
              {applicant.academic?.degree || "—"}
              {applicant.academic?.semester ? ` · Semester ${applicant.academic.semester}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Academic score</dt>
            <dd>{applicant.academic?.academic_score ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Career goal</dt>
            <dd>{applicant.academic?.career_goal || "—"}</dd>
          </div>
          {applicant.note && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Candidate note</dt>
              <dd>{applicant.note}</dd>
            </div>
          )}
        </dl>
      </PanelCard>

      <PassportPanel studentId={applicant.student_id} />



      <PanelCard title="Move through the pipeline" description="Shortlist, interview, select or close.">
        <div className="flex flex-wrap gap-2">
          {employerStages.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={applicant.status === status ? "default" : "outline"}
              disabled={stageMutation.isPending}
              onClick={() => stageMutation.mutate(status)}
            >
              {statusLabels[status]}
            </Button>
          ))}
        </div>
      </PanelCard>

      <PanelCard title="Documents" description="Resumes and evidence the candidate submitted.">
        {(documents ?? []).length === 0 ? (
          <EmptyState description="No documents submitted yet." />
        ) : (
          <ul className="space-y-2">
            {(documents ?? []).map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <span className="flex items-center gap-2 text-sm">
                  <FileText className="size-4 text-teal" aria-hidden="true" />
                  {doc.name}
                  <Badge variant="outline">{documentKindLabels[doc.kind]}</Badge>
                </span>
                <Button size="sm" variant="outline" onClick={() => void openDocument(doc)}>
                  Open
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard
        title="Interview & feedback"
        description="Feedback is visible to the candidate on their application."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="interview">
              <CalendarClock className="mr-1 inline size-4" aria-hidden="true" />
              Interview date & time
            </Label>
            <Input
              id="interview"
              type="datetime-local"
              value={interviewAt}
              onChange={(event) => setInterviewAt(event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="rating">
              <Star className="mr-1 inline size-4" aria-hidden="true" />
              Rating (1–5)
            </Label>
            <Select value={rating || "none"} onValueChange={(value) => setRating(value === "none" ? "" : value)}>
              <SelectTrigger id="rating" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not rated</SelectItem>
                {[1, 2, 3, 4, 5].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="feedback">Candidate feedback</Label>
            <Textarea
              id="feedback"
              rows={4}
              placeholder="Strengths, gaps and what to work on next."
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Button
              className="min-h-11"
              disabled={feedbackMutation.isPending}
              onClick={() => feedbackMutation.mutate()}
            >
              {feedbackMutation.isPending ? "Saving…" : "Save feedback"}
            </Button>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}

function PassportPanel({ studentId }: { studentId: string }) {
  const { data, isPending } = useQuery(applicantPassportQueryOptions(studentId));

  if (isPending) {
    return (
      <PanelCard title="Ability Passport" description="Skills, projects and verified outcomes.">
        <p className="text-sm text-muted-foreground">Loading candidate evidence…</p>
      </PanelCard>
    );
  }

  const passport = data ?? { skills: [], projects: [], achievements: [], experiences: [] };
  const empty =
    passport.skills.length === 0 &&
    passport.projects.length === 0 &&
    passport.achievements.length === 0 &&
    passport.experiences.length === 0;

  return (
    <PanelCard
      title="Ability Passport"
      description="Skills, projects, achievements and experience this candidate has built."
    >
      {empty ? (
        <EmptyState description="This candidate has not added passport evidence yet." />
      ) : (
        <div className="space-y-5 text-sm">
          {passport.skills.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {passport.skills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant={skill.verification_status === "self_declared" ? "outline" : "secondary"}
                  >
                    {skill.name} · L{skill.level}
                    {skill.verification_status !== "self_declared" ? " · verified" : ""}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {passport.projects.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium">Projects</h3>
              <ul className="space-y-2">
                {passport.projects.map((project) => (
                  <li key={project.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{project.title}</span>
                      {project.verified_at && <Badge variant="secondary">Faculty verified</Badge>}
                    </div>
                    <p className="mt-1 text-muted-foreground">{project.description}</p>
                    {(project.technologies ?? []).length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(project.technologies ?? []).join(", ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {passport.achievements.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium">Achievements</h3>
              <ul className="space-y-2">
                {passport.achievements.map((achievement) => (
                  <li key={achievement.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{achievement.title}</span>
                      {achievement.verified_at && <Badge variant="secondary">Verified</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {achievement.issuer || "—"}
                      {achievement.achieved_on
                        ? ` · ${new Date(achievement.achieved_on).toLocaleDateString()}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {passport.experiences.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium">Experience</h3>
              <ul className="space-y-2">
                {passport.experiences.map((experience) => (
                  <li key={experience.id} className="rounded-lg border border-border p-3">
                    <span className="font-medium">{experience.role}</span>
                    <p className="text-xs text-muted-foreground">{experience.organisation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </PanelCard>
  );
}
