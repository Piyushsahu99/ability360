import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, HeartHandshake, Sparkles, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  formatSessionTime,
  matchScore,
  mentorDirectoryQueryOptions,
  requestStatusLabels,
  saveSessionFeedback,
  sendMentorshipRequest,
  sessionStatusLabels,
  studentMentorshipQueryOptions,
  withdrawRequest,
  type MentorWithProfile,
} from "@/lib/mentorship";
import { studentNav } from "@/lib/nav";
import { workModeLabels } from "@/lib/opportunities";

export const Route = createFileRoute("/_authenticated/mentorship")({
  head: () => ({
    meta: [
      { title: "Find a mentor — ABILITY360" },
      { name: "description", content: "Get matched with industry and faculty mentors, request guidance, book sessions and share feedback." },
      { property: "og:title", content: "Find a mentor — ABILITY360" },
      { property: "og:description", content: "Mentor matching based on your skills, target role and preferred industries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MentorshipPage,
});

const nav = studentNav("/mentorship");

function MentorshipPage() {
  const queryClient = useQueryClient();
  const { data: mentors } = useQuery(mentorDirectoryQueryOptions);
  const { data: mine, isPending } = useQuery(studentMentorshipQueryOptions);

  const context = useMemo(
    () => ({
      skills: mine?.skills ?? [],
      careerGoal: mine?.careerGoal ?? null,
      industries: mine?.industries ?? [],
    }),
    [mine],
  );

  const ranked = useMemo(() => {
    return (mentors ?? [])
      .map((mentor) => ({ mentor, ...matchScore(mentor, context) }))
      .sort((a, b) => b.score - a.score);
  }, [mentors, context]);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["mentorship"] });
  }

  const requests = mine?.requests ?? [];
  const sessions = mine?.sessions ?? [];
  const upcoming = sessions.filter((session) => session.status === "scheduled");

  return (
    <DashboardShell
      role="student"
      title="Mentorship"
      subtitle="Matched to your skills, target role and preferred industries."
      nav={nav}
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Mentors available" value={String(mentors?.length ?? 0)} hint="Across industry and faculty" icon={HeartHandshake} />
        <StatCard label="My requests" value={String(requests.length)} hint={`${requests.filter((r) => r.status === "accepted").length} accepted`} />
        <StatCard label="Upcoming sessions" value={String(upcoming.length)} hint="Scheduled with your mentors" icon={CalendarClock} />
        <StatCard label="Sessions completed" value={String(sessions.filter((s) => s.status === "completed").length)} hint="Guidance received" />
      </div>

      {isPending ? (
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      ) : (
        <>
          <PanelCard title="Recommended mentors" description="Ranked by overlap with your saved skills, career goal and industries.">
            {ranked.length === 0 ? (
              <EmptyState message="No mentor profiles published yet." />
            ) : (
              <ul className="space-y-3">
                {ranked.slice(0, 8).map(({ mentor, score, skillMatches, industryMatches, goalMatch }) => (
                  <MentorCard
                    key={mentor.id}
                    mentor={mentor}
                    score={score}
                    skillMatches={skillMatches}
                    industryMatches={industryMatches}
                    goalMatch={goalMatch}
                    existingRequest={requests.find((request) => request.mentor_id === mentor.id) ?? null}
                    onDone={refresh}
                  />
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard title="My requests" description="Track what each mentor has replied.">
            {requests.length === 0 ? (
              <EmptyState message="You have not asked for mentorship yet." />
            ) : (
              <ul className="space-y-2">
                {requests.map((request) => (
                  <li key={request.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{request.mentor?.full_name ?? "Mentor"}</p>
                        <p className="text-xs text-muted-foreground">{request.goal}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{requestStatusLabels[request.status]}</Badge>
                        <Button
                          variant="ghost"
                          className="min-h-11"
                          onClick={async () => {
                            await withdrawRequest(request.id);
                            toast.success("Request withdrawn");
                            refresh();
                          }}
                        >
                          Withdraw
                        </Button>
                      </div>
                    </div>
                    {request.response_note && (
                      <p className="mt-2 rounded-md bg-surface p-2 text-xs text-muted-foreground">
                        Mentor replied: {request.response_note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard title="Sessions" description="Join your session and share feedback afterwards.">
            {sessions.length === 0 ? (
              <EmptyState message="No sessions scheduled yet." />
            ) : (
              <ul className="space-y-3">
                {sessions.map((session) => {
                  const myFeedback = (mine?.feedback ?? []).find(
                    (row) => row.session_id === session.id && row.author_id === mine?.userId,
                  );
                  return (
                    <li key={session.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{session.topic}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.mentor?.full_name ?? "Mentor"} · {formatSessionTime(session.scheduled_at)} ·{" "}
                            {session.duration_minutes} min · {workModeLabels[session.mode]}
                          </p>
                        </div>
                        <Badge variant="outline">{sessionStatusLabels[session.status]}</Badge>
                      </div>
                      {session.agenda && <p className="mt-2 text-xs text-muted-foreground">{session.agenda}</p>}
                      {session.meeting_link && (
                        <a className="mt-2 inline-block text-sm text-primary underline" href={session.meeting_link} target="_blank" rel="noreferrer">
                          Join session
                        </a>
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

function MentorCard({
  mentor,
  score,
  skillMatches,
  industryMatches,
  goalMatch,
  existingRequest,
  onDone,
}: {
  mentor: MentorWithProfile;
  score: number;
  skillMatches: string[];
  industryMatches: string[];
  goalMatch: boolean;
  existingRequest: { status: string } | null;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [message, setMessage] = useState("");

  const send = useMutation({
    mutationFn: () => sendMentorshipRequest(mentor.id, { goal, message }, skillMatches),
    onSuccess: () => {
      toast.success("Request sent");
      setOpen(false);
      setGoal("");
      setMessage("");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{mentor.profiles?.full_name ?? "Mentor"}</p>
          <p className="text-sm text-muted-foreground">{mentor.headline}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[mentor.designation, mentor.organisation].filter(Boolean).join(" · ") || "Independent mentor"} ·{" "}
            {mentor.years_experience} yrs · {workModeLabels[mentor.session_mode]}
          </p>
        </div>
        <div className="w-36">
          <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" /> {score}% match
          </p>
          <Progress className="mt-1" value={score} />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {mentor.is_verified && <Badge className="bg-primary-soft text-primary">Verified mentor</Badge>}
        {mentor.supports_accessibility && <Badge variant="outline">Accessible sessions</Badge>}
        {goalMatch && <Badge variant="secondary">Matches your career goal</Badge>}
        {skillMatches.slice(0, 4).map((skill) => (
          <Badge key={skill} variant="outline">
            {skill}
          </Badge>
        ))}
        {industryMatches.slice(0, 2).map((industry) => (
          <Badge key={industry} variant="outline">
            {industry}
          </Badge>
        ))}
      </div>

      {mentor.availability && <p className="mt-2 text-xs text-muted-foreground">Availability: {mentor.availability}</p>}

      {existingRequest ? (
        <Badge className="mt-3" variant="outline">
          Request {existingRequest.status}
        </Badge>
      ) : !mentor.accepts_requests ? (
        <p className="mt-3 text-xs text-muted-foreground">Not accepting new mentees right now.</p>
      ) : open ? (
        <div className="mt-3 space-y-2">
          <div>
            <Label htmlFor={`goal-${mentor.id}`}>What do you want help with?</Label>
            <Input id={`goal-${mentor.id}`} className="mt-1" value={goal} onChange={(event) => setGoal(event.target.value)} />
          </div>
          <div>
            <Label htmlFor={`msg-${mentor.id}`}>Message</Label>
            <Textarea id={`msg-${mentor.id}`} rows={3} className="mt-1" value={message} onChange={(event) => setMessage(event.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button className="min-h-11" disabled={send.isPending} onClick={() => send.mutate()}>
              {send.isPending ? "Sending…" : "Send request"}
            </Button>
            <Button variant="ghost" className="min-h-11" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="mt-3 min-h-11" onClick={() => setOpen(true)}>
          Request mentorship
        </Button>
      )}
    </li>
  );
}

export function FeedbackForm({
  sessionId,
  existing,
  onDone,
}: {
  sessionId: string;
  existing: { rating: number; body: string } | null;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [body, setBody] = useState(existing?.body ?? "");

  const mutation = useMutation({
    mutationFn: () => saveSessionFeedback(sessionId, rating, body),
    onSuccess: () => {
      toast.success("Feedback saved");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mt-3 space-y-2 rounded-md border border-dashed border-border p-3">
      <div className="flex items-center gap-2">
        <Star className="size-4 text-teal" aria-hidden="true" />
        <Label htmlFor={`rating-${sessionId}`}>Rating (1-5)</Label>
        <Input
          id={`rating-${sessionId}`}
          type="number"
          min={1}
          max={5}
          className="w-20"
          value={rating}
          onChange={(event) => setRating(Math.max(1, Math.min(5, Number(event.target.value))))}
        />
      </div>
      <Textarea rows={2} placeholder="What was most useful?" value={body} onChange={(event) => setBody(event.target.value)} />
      <Button className="min-h-11" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        {existing ? "Update feedback" : "Share feedback"}
      </Button>
    </div>
  );
}
