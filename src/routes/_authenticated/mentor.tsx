import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, HeartHandshake, Inbox } from "lucide-react";
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
import { navForRole } from "@/lib/nav";
import { workModeLabels } from "@/lib/opportunities";
import {
  emptyMentorProfile,
  formatSessionTime,
  mentorProfileSchema,
  mentorToForm,
  mentorWorkspaceQueryOptions,
  myMentorProfileQueryOptions,
  requestStatusLabels,
  respondToRequest,
  saveMentorProfile,
  scheduleSession,
  sessionStatusLabels,
  setSessionStatus,
  type MentorProfileValues,
} from "@/lib/mentorship";
import { FeedbackForm } from "@/routes/_authenticated/mentorship";

export const Route = createFileRoute("/_authenticated/mentor")({
  head: () => ({
    meta: [
      { title: "Mentor workspace — ABILITY360" },
      { name: "description", content: "Publish your mentor profile, answer student requests, run sessions and share feedback." },
      { property: "og:title", content: "Mentor workspace — ABILITY360" },
      { property: "og:description", content: "Guide students from first semester to first career." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MentorPage,
});

function MentorPage() {
  const { data: me } = useMe();
  const role = me?.role ?? "industry";
  const queryClient = useQueryClient();
  const { data: profile } = useQuery(myMentorProfileQueryOptions);
  const { data: workspace, isPending } = useQuery(mentorWorkspaceQueryOptions);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["mentorship"] });
  }

  const requests = workspace?.requests ?? [];
  const sessions = workspace?.sessions ?? [];
  const pending = requests.filter((request) => request.status === "pending");
  const activeMentees = requests.filter((request) => request.status === "accepted");

  return (
    <DashboardShell
      role={role}
      title="Mentor workspace"
      subtitle="Publish your profile, accept mentees and run sessions."
      nav={navForRole(role, "/mentor")}
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Profile" value={profile ? "Published" : "Not set"} hint="Visible in mentor matching" icon={HeartHandshake} />
        <StatCard label="Pending requests" value={String(pending.length)} hint="Waiting for your reply" icon={Inbox} />
        <StatCard label="Active mentees" value={String(activeMentees.length)} hint={`Capacity ${profile?.max_active_mentees ?? 0}`} />
        <StatCard label="Sessions" value={String(sessions.length)} hint="Scheduled and completed" icon={CalendarClock} />
      </div>

      <MentorProfileForm initial={profile ? mentorToForm(profile) : emptyMentorProfile} onDone={refresh} hasProfile={Boolean(profile)} />

      {isPending ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      ) : (
        <>
          <PanelCard title="Student requests" description="Accept a request and schedule the first session.">
            {requests.length === 0 ? (
              <EmptyState message="No requests yet." />
            ) : (
              <ul className="space-y-3">
                {requests.map((request) => (
                  <li key={request.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{request.student?.full_name ?? "Student"}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.student?.department ?? "Department not set"} · {request.goal}
                        </p>
                      </div>
                      <Badge variant="outline">{requestStatusLabels[request.status]}</Badge>
                    </div>
                    <p className="mt-2 text-muted-foreground">{request.message}</p>
                    {request.focus_skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {request.focus_skills.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {request.status === "pending" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          className="min-h-11"
                          onClick={async () => {
                            await respondToRequest(request.id, "accepted", "Happy to mentor you.");
                            toast.success("Request accepted");
                            refresh();
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="min-h-11"
                          onClick={async () => {
                            await respondToRequest(request.id, "declined", "Not available right now.");
                            toast.success("Request declined");
                            refresh();
                          }}
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    {request.status === "accepted" && (
                      <ScheduleForm
                        requestId={request.id}
                        mentorId={request.mentor_id}
                        studentId={request.student_id}
                        onDone={refresh}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard title="Sessions" description="Mark sessions complete and leave feedback for the student.">
            {sessions.length === 0 ? (
              <EmptyState message="No sessions scheduled yet." />
            ) : (
              <ul className="space-y-3">
                {sessions.map((session) => {
                  const myFeedback = (workspace?.feedback ?? []).find(
                    (row) => row.session_id === session.id && row.author_id === workspace?.userId,
                  );
                  return (
                    <li key={session.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{session.topic}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.student?.full_name ?? "Student"} · {formatSessionTime(session.scheduled_at)} ·{" "}
                            {session.duration_minutes} min · {workModeLabels[session.mode]}
                          </p>
                        </div>
                        <Badge variant="outline">{sessionStatusLabels[session.status]}</Badge>
                      </div>
                      {session.status === "scheduled" && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            className="min-h-11"
                            onClick={async () => {
                              await setSessionStatus(session.id, "completed");
                              toast.success("Session marked complete");
                              refresh();
                            }}
                          >
                            Mark completed
                          </Button>
                          <Button
                            variant="outline"
                            className="min-h-11"
                            onClick={async () => {
                              await setSessionStatus(session.id, "cancelled");
                              toast.success("Session cancelled");
                              refresh();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      {session.status === "completed" && (
                        <FeedbackForm
                          sessionId={session.id}
                          existing={myFeedback ? { rating: myFeedback.rating, body: myFeedback.body } : null}
                          onDone={refresh}
                        />
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

function MentorProfileForm({
  initial,
  hasProfile,
  onDone,
}: {
  initial: MentorProfileValues;
  hasProfile: boolean;
  onDone: () => void;
}) {
  const [form, setForm] = useState<MentorProfileValues>(initial);
  const [open, setOpen] = useState(!hasProfile);

  function update<K extends keyof MentorProfileValues>(key: K, value: MentorProfileValues[K]) {
    setForm({ ...form, [key]: value });
  }

  const save = useMutation({
    mutationFn: async () => {
      const parsed = mentorProfileSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the form");
      await saveMentorProfile(parsed.data);
    },
    onSuccess: () => {
      toast.success("Mentor profile saved");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PanelCard
      title="Mentor profile"
      description="Students are matched to you using your expertise, industries and availability."
      action={
        <Button variant="outline" className="min-h-11" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide" : hasProfile ? "Edit profile" : "Create profile"}
        </Button>
      }
    >
      {!open ? (
        <p className="text-sm text-muted-foreground">
          {hasProfile ? form.headline : "Publish a profile so students can find you."}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="m-headline">Headline</Label>
              <Input id="m-headline" className="mt-1" value={form.headline} onChange={(event) => update("headline", event.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-org">Organisation</Label>
              <Input id="m-org" className="mt-1" value={form.organisation ?? ""} onChange={(event) => update("organisation", event.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-designation">Designation</Label>
              <Input id="m-designation" className="mt-1" value={form.designation ?? ""} onChange={(event) => update("designation", event.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-expertise">Expertise (comma separated)</Label>
              <Input id="m-expertise" className="mt-1" value={form.expertise ?? ""} onChange={(event) => update("expertise", event.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-industries">Industries (comma separated)</Label>
              <Input id="m-industries" className="mt-1" value={form.industries ?? ""} onChange={(event) => update("industries", event.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-languages">Languages</Label>
              <Input id="m-languages" className="mt-1" value={form.languages ?? ""} onChange={(event) => update("languages", event.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-years">Years of experience</Label>
              <Input
                id="m-years"
                type="number"
                min={0}
                className="mt-1"
                value={form.yearsExperience}
                onChange={(event) => update("yearsExperience", Number(event.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="m-mode">Session mode</Label>
              <Select value={form.sessionMode} onValueChange={(value) => update("sessionMode", value as MentorProfileValues["sessionMode"])}>
                <SelectTrigger id="m-mode" className="mt-1">
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
              <Label htmlFor="m-capacity">Maximum active mentees</Label>
              <Input
                id="m-capacity"
                type="number"
                min={1}
                className="mt-1"
                value={form.maxActiveMentees}
                onChange={(event) => update("maxActiveMentees", Number(event.target.value))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="m-availability">Availability</Label>
            <Input
              id="m-availability"
              className="mt-1"
              placeholder="For example: Saturdays 5–7 pm"
              value={form.availability ?? ""}
              onChange={(event) => update("availability", event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="m-bio">About you</Label>
            <Textarea id="m-bio" rows={3} className="mt-1" value={form.bio ?? ""} onChange={(event) => update("bio", event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch id="m-accepts" checked={form.acceptsRequests} onCheckedChange={(value) => update("acceptsRequests", value)} />
              <Label htmlFor="m-accepts">Accepting new mentees</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="m-access"
                checked={form.supportsAccessibility}
                onCheckedChange={(value) => update("supportsAccessibility", value)}
              />
              <Label htmlFor="m-access">Accessible sessions (captions, flexible timing)</Label>
            </div>
          </div>
          <Button className="min-h-11" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : "Save mentor profile"}
          </Button>
        </div>
      )}
    </PanelCard>
  );
}

function ScheduleForm({
  requestId,
  mentorId,
  studentId,
  onDone,
}: {
  requestId: string;
  mentorId: string;
  studentId: string;
  onDone: () => void;
}) {
  const [topic, setTopic] = useState("Mentorship session");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [link, setLink] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      scheduleSession({
        requestId,
        mentorId,
        studentId,
        values: {
          topic,
          agenda: "",
          scheduledAt,
          durationMinutes: duration,
          mode: "remote",
          meetingLink: link,
        },
      }),
    onSuccess: () => {
      toast.success("Session scheduled");
      setScheduledAt("");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mt-3 grid gap-2 rounded-md border border-dashed border-border p-3 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <Label htmlFor={`topic-${requestId}`}>Session topic</Label>
        <Input id={`topic-${requestId}`} className="mt-1" value={topic} onChange={(event) => setTopic(event.target.value)} />
      </div>
      <div>
        <Label htmlFor={`when-${requestId}`}>Date and time</Label>
        <Input
          id={`when-${requestId}`}
          type="datetime-local"
          className="mt-1"
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`mins-${requestId}`}>Minutes</Label>
        <Input
          id={`mins-${requestId}`}
          type="number"
          min={15}
          max={180}
          className="mt-1"
          value={duration}
          onChange={(event) => setDuration(Number(event.target.value))}
        />
      </div>
      <div className="sm:col-span-3">
        <Label htmlFor={`link-${requestId}`}>Meeting link</Label>
        <Input id={`link-${requestId}`} className="mt-1" placeholder="https://" value={link} onChange={(event) => setLink(event.target.value)} />
      </div>
      <div className="flex items-end">
        <Button className="min-h-11 w-full" disabled={!scheduledAt || mutation.isPending} onClick={() => mutation.mutate()}>
          Schedule
        </Button>
      </div>
    </div>
  );
}
