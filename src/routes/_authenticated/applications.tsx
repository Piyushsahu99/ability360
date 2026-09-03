import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileUp,
  Link2,
  Loader2,
  Paperclip,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  addDocumentLink,
  applicationDetailQueryOptions,
  applicationStatuses,
  applicationsQueryOptions,
  checkEligibility,
  closedStatuses,
  daysUntil,
  documentKindLabels,
  documentUrl,
  eligibilityContextQueryOptions,
  removeApplication,
  removeDocument,
  requiredDocumentKinds,
  saveApplicationNote,
  setApplicationStatus,
  statusHint,
  statusLabels,
  uploadDocument,
  type ApplicationDocument,
  type ApplicationDocumentKind,
  type ApplicationStatus,
  type ApplicationWithOpportunity,
} from "@/lib/applications";
import { studentNav } from "@/lib/nav";
import { formatDeadline, opportunityTypeLabels, workModeLabels } from "@/lib/opportunities";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "My applications — ABILITY360" },
      {
        name: "description",
        content:
          "Save opportunities, check eligibility, prepare documents and track every application from saved to selected.",
      },
      { property: "og:title", content: "My applications — ABILITY360" },
      {
        property: "og:description",
        content: "Track saved, applied, shortlisted and completed opportunity applications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApplicationsPage,
});

const statusTone: Record<ApplicationStatus, string> = {
  saved: "bg-secondary text-secondary-foreground",
  preparing: "bg-secondary text-secondary-foreground",
  applied: "bg-primary-soft text-primary",
  shortlisted: "bg-primary-soft text-primary",
  interview: "bg-primary-soft text-primary",
  selected: "bg-primary text-primary-foreground",
  rejected: "bg-destructive/10 text-destructive",
  completed: "bg-secondary text-secondary-foreground",
};

function ApplicationsPage() {
  const { data: applications, isPending } = useQuery(applicationsQueryOptions);
  const [filter, setFilter] = useState<"all" | ApplicationStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = applications ?? [];
  const visible = filter === "all" ? list : list.filter((item) => item.status === filter);
  const selected = list.find((item) => item.id === selectedId) ?? visible[0] ?? null;

  const stats = useMemo(() => {
    const saved = list.filter((item) => item.status === "saved").length;
    const inFlight = list.filter(
      (item) => !closedStatuses.includes(item.status) && item.status !== "saved",
    ).length;
    const interviews = list.filter((item) =>
      ["shortlisted", "interview"].includes(item.status),
    ).length;
    const closingSoon = list.filter((item) => {
      const days = daysUntil(item.deadline);
      return days !== null && days >= 0 && days <= 14 && !closedStatuses.includes(item.status);
    }).length;
    return { saved, inFlight, interviews, closingSoon };
  }, [list]);

  return (
    <DashboardShell
      role="student"
      title="My applications"
      subtitle="From saved to selected — every opportunity in one pipeline."
      nav={studentNav("/applications")}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saved" value={String(stats.saved)} hint="Bookmarked opportunities" />
        <StatCard label="In progress" value={String(stats.inFlight)} hint="Preparing through interview" />
        <StatCard label="Interview stage" value={String(stats.interviews)} hint="Shortlisted or interviewing" />
        <StatCard label="Closing in 14 days" value={String(stats.closingSoon)} hint="Deadlines approaching" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <PanelCard
          title="Pipeline"
          description="Filter by stage and open an application to manage it."
          action={
            <Select value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
              <SelectTrigger className="w-40" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {applicationStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        >
          {isPending && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          )}

          {!isPending && visible.length === 0 && (
            <EmptyState
              title="Nothing here yet"
              description="Save an opportunity to start tracking it through your pipeline."
              action={
                <Button asChild size="sm">
                  <Link to="/opportunities">Browse opportunities</Link>
                </Button>
              }
            />
          )}

          <ul className="space-y-3">
            {visible.map((item) => {
              const days = daysUntil(item.deadline);
              const isActive = selected?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    aria-current={isActive}
                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                      isActive ? "border-primary bg-primary-soft/40" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusTone[item.status]}>{statusLabels[item.status]}</Badge>
                      {item.opportunities && (
                        <Badge variant="outline">{opportunityTypeLabels[item.opportunities.type]}</Badge>
                      )}
                      {days !== null && days >= 0 && days <= 14 && (
                        <Badge variant="outline" className="gap-1 text-teal">
                          <CalendarClock className="size-3.5" aria-hidden="true" />
                          {days === 0 ? "Closes today" : `${days} days left`}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 font-medium">{item.opportunities?.title ?? "Opportunity"}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.opportunities?.organisation} · {formatDeadline(item.deadline)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </PanelCard>

        {selected ? (
          <ApplicationDetail key={selected.id} application={selected} />
        ) : (
          <PanelCard title="Application details" description="Select an application to see the details.">
            <EmptyState
              title="No application selected"
              description="Pick an item from your pipeline, or save a new opportunity."
            />
          </PanelCard>
        )}
      </div>
    </DashboardShell>
  );
}

function ApplicationDetail({ application }: { application: ApplicationWithOpportunity }) {
  const queryClient = useQueryClient();
  const { data: detail, isPending } = useQuery(applicationDetailQueryOptions(application.id));
  const { data: context } = useQuery(eligibilityContextQueryOptions);
  const [note, setNote] = useState(application.note);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [kind, setKind] = useState<ApplicationDocumentKind>("resume");
  const fileInput = useRef<HTMLInputElement>(null);

  const opportunity = application.opportunities;
  const eligibility = opportunity
    ? checkEligibility({
        opportunity,
        studentSkills: context?.skills ?? [],
        profileComplete: context?.profileComplete ?? false,
        preferredMode: context?.preferredMode ?? null,
      })
    : null;

  const documents = detail?.documents ?? [];
  const missingDocs = requiredDocumentKinds.filter(
    (required) => !documents.some((doc) => doc.kind === required),
  );

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["student", "applications"] });
    void queryClient.invalidateQueries({ queryKey: ["student", "application", application.id] });
  }

  const statusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) => setApplicationStatus(application.id, status),
    onSuccess: (_data, status) => {
      toast.success(`Moved to ${statusLabels[status]}`);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const noteMutation = useMutation({
    mutationFn: () => saveApplicationNote(application.id, note),
    onSuccess: () => {
      toast.success("Notes saved");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocument({ applicationId: application.id, kind, file }),
    onSuccess: () => {
      toast.success("Document uploaded");
      if (fileInput.current) fileInput.current.value = "";
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      addDocumentLink({
        applicationId: application.id,
        kind,
        name: linkName.trim() || documentKindLabels[kind],
        link: linkUrl.trim(),
      }),
    onSuccess: () => {
      toast.success("Link added");
      setLinkName("");
      setLinkUrl("");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (doc: ApplicationDocument) => removeDocument(doc),
    onSuccess: () => {
      toast.success("Document removed");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeApplication(application.id),
    onSuccess: () => {
      toast.success("Application removed");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function openDocument(doc: ApplicationDocument) {
    try {
      const url = await documentUrl(doc);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  const days = daysUntil(application.deadline);

  return (
    <div className="space-y-6">
      <PanelCard
        title={opportunity?.title ?? "Application"}
        description={
          opportunity
            ? `${opportunity.organisation} · ${opportunity.location} · ${workModeLabels[opportunity.mode]}`
            : "Opportunity details unavailable."
        }
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remove
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusTone[application.status]}>{statusLabels[application.status]}</Badge>
            <span className="text-sm text-muted-foreground">{statusHint[application.status]}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="status-select">Update stage</Label>
              <Select
                value={application.status}
                onValueChange={(value) => statusMutation.mutate(value as ApplicationStatus)}
              >
                <SelectTrigger id="status-select" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {applicationStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {application.status !== "applied" && application.status !== "saved" ? null : (
              <Button
                onClick={() => statusMutation.mutate(application.status === "saved" ? "preparing" : "shortlisted")}
                disabled={statusMutation.isPending}
              >
                {application.status === "saved" ? "Start preparing" : "Mark shortlisted"}
              </Button>
            )}
          </div>

          {missingDocs.length > 0 && application.status !== "saved" && (
            <p className="flex items-start gap-2 rounded-md border border-border bg-surface p-3 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
              Add your {missingDocs.map((doc) => documentKindLabels[doc].toLowerCase()).join(", ")} before you
              submit this application.
            </p>
          )}

          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Deadline</dt>
              <dd className="font-medium">{formatDeadline(application.deadline)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Time left</dt>
              <dd className="font-medium">
                {days === null ? "Rolling" : days < 0 ? "Closed" : `${days} days`}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Applied on</dt>
              <dd className="font-medium">
                {application.applied_at
                  ? new Date(application.applied_at).toLocaleDateString()
                  : "Not submitted"}
              </dd>
            </div>
          </dl>

          <div>
            <Label htmlFor="application-note">Your notes</Label>
            <Textarea
              id="application-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Interview prep, referral contact, questions to ask…"
              className="mt-1.5"
              rows={3}
            />
            <Button
              className="mt-2"
              size="sm"
              variant="outline"
              onClick={() => noteMutation.mutate()}
              disabled={noteMutation.isPending || note === application.note}
            >
              Save notes
            </Button>
          </div>
        </div>
      </PanelCard>

      {eligibility && (
        <PanelCard
          title="Eligibility check"
          description="A quick read on how ready you are for this opportunity."
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Skill match</span>
                <span className="text-muted-foreground">{eligibility.score}%</span>
              </div>
              <Progress value={eligibility.score} className="mt-2" />
            </div>
            <ul className="space-y-2">
              {eligibility.checks.map((check) => (
                <li key={check.label} className="flex items-start gap-2 text-sm">
                  {check.passed ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span>
                    <span className="font-medium">{check.label}</span>
                    <span className="block text-muted-foreground">{check.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            {eligibility.missingSkills.length > 0 && (
              <div>
                <p className="text-sm font-medium">Skills to strengthen</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {eligibility.missingSkills.map((skill) => (
                    <li key={skill}>
                      <Badge variant="outline" className="font-normal">
                        {skill}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="link" size="sm" className="mt-1 px-0">
                  <Link to="/roadmap">Close these gaps in your roadmap</Link>
                </Button>
              </div>
            )}
            <Button
              onClick={() => statusMutation.mutate("applied")}
              disabled={statusMutation.isPending || application.status === "applied"}
            >
              {application.status === "applied" ? "Marked as applied" : "Mark as applied"}
            </Button>
          </div>
        </PanelCard>
      )}

      <PanelCard
        title="Documents"
        description="Upload files or attach links you sent with this application."
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="doc-kind">Document type</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as ApplicationDocumentKind)}>
                <SelectTrigger id="doc-kind" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentKindLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="doc-file">Upload a file</Label>
              <Input
                id="doc-file"
                ref={fileInput}
                type="file"
                className="mt-1.5"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadMutation.mutate(file);
                }}
                disabled={uploadMutation.isPending}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="doc-name">Link label</Label>
              <Input
                id="doc-name"
                value={linkName}
                onChange={(event) => setLinkName(event.target.value)}
                placeholder="Portfolio site"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="doc-link">Link URL</Label>
              <Input
                id="doc-link"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://"
                className="mt-1.5"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => linkMutation.mutate()}
              disabled={linkMutation.isPending || !linkUrl.trim()}
            >
              <Link2 className="size-4" aria-hidden="true" />
              Add link
            </Button>
          </div>

          {uploadMutation.isPending && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Uploading…
            </p>
          )}

          {isPending ? (
            <Skeleton className="h-16 w-full" />
          ) : documents.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description="Attach your resume so this application is submission-ready."
            />
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {doc.link ? (
                      <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{documentKindLabels[doc.kind]}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => void openDocument(doc)}>
                      <ExternalLink className="size-4" aria-hidden="true" />
                      <span className="sr-only">Open {doc.name}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDocMutation.mutate(doc)}
                      disabled={deleteDocMutation.isPending}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      <span className="sr-only">Delete {doc.name}</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PanelCard>

      <PanelCard title="History" description="Every stage change on this application.">
        {isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : (detail?.events.length ?? 0) === 0 ? (
          <EmptyState title="No history yet" description="Stage changes will appear here." />
        ) : (
          <ol className="space-y-3">
            {(detail?.events ?? []).map((event) => (
              <li key={event.id} className="flex items-start gap-3 text-sm">
                <FileUp className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="font-medium">
                    {event.from_status
                      ? `${statusLabels[event.from_status]} → ${statusLabels[event.to_status]}`
                      : `Tracked as ${statusLabels[event.to_status]}`}
                  </p>
                  <p className="text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </PanelCard>
    </div>
  );
}
