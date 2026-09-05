import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, CalendarDays, CheckCircle2, MapPin, ShieldCheck, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth";
import {
  competitionCategoryLabels,
  competitionQueryOptions,
  competitionStatusLabels,
  createTeam,
  formatDate,
  joinTeam,
  leaveTeam,
  myCompetitionStateQueryOptions,
  registerForCompetition,
  saveSubmission,
  withdrawRegistration,
} from "@/lib/competitions";
import { workModeLabels } from "@/lib/opportunities";

export const Route = createFileRoute("/competitions/$competitionId")({
  head: () => ({
    meta: [
      { title: "Competition details — ABILITY360" },
      { name: "description", content: "Register, form a team, submit your entry and follow the live leaderboard." },
      { property: "og:title", content: "Competition details — ABILITY360" },
      { property: "og:description", content: "Everything about this challenge: rules, teams, submissions, judging and certificates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompetitionDetailPage,
});

function CompetitionDetailPage() {
  const { competitionId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { data, isPending } = useQuery(competitionQueryOptions(competitionId));
  const { data: mine } = useQuery({
    ...myCompetitionStateQueryOptions(competitionId),
    enabled: Boolean(session),
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["competitions"] });
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  const competition = data?.competition;
  if (!competition) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Competition not found</h1>
          <Button asChild className="mt-6 min-h-11">
            <Link to="/competitions">Back to competitions</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const myTeamIds = new Set((mine?.memberships ?? []).map((row) => row.team_id));
  const myTeam = (data?.teams ?? []).find((team) => myTeamIds.has(team.id)) ?? null;
  const registration = mine?.registration ?? null;
  const registered = registration && registration.status !== "withdrawn";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <Link to="/competitions" className="text-sm text-muted-foreground hover:text-foreground">
          ← All competitions
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{competitionCategoryLabels[competition.category] ?? competition.category}</Badge>
          <Badge variant="outline">{competitionStatusLabels[competition.status]}</Badge>
          {competition.is_inclusive && <Badge className="bg-primary-soft text-primary">Inclusive challenge</Badge>}
        </div>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{competition.title}</h1>
        <p className="mt-1 text-muted-foreground">{competition.organisation}</p>

        <dl className="mt-6 grid gap-3 rounded-lg border border-border bg-surface p-4 text-sm sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-teal" aria-hidden="true" />
            {competition.location} · {workModeLabels[competition.mode]}
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-teal" aria-hidden="true" />
            Team of {competition.team_min}–{competition.team_max}
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-teal" aria-hidden="true" />
            Register by {formatDate(competition.registration_deadline)}
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-teal" aria-hidden="true" />
            Submit by {formatDate(competition.submission_deadline)}
          </div>
        </dl>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About this challenge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="whitespace-pre-line text-muted-foreground">
                  {competition.description || competition.summary || "Details will be shared by the organiser."}
                </p>
                {competition.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {competition.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
                {competition.rules && (
                  <div>
                    <p className="font-medium">Rules</p>
                    <p className="mt-1 whitespace-pre-line text-muted-foreground">{competition.rules}</p>
                  </div>
                )}
                {competition.prize_details && (
                  <div>
                    <p className="font-medium">Prizes and recognition</p>
                    <p className="mt-1 text-muted-foreground">{competition.prize_details}</p>
                  </div>
                )}
                {competition.accessibility_note && (
                  <div className="rounded-lg border border-border bg-surface p-3">
                    <p className="flex items-center gap-2 font-medium">
                      <ShieldCheck className="size-4 text-teal" aria-hidden="true" />
                      Accessibility and accommodations
                    </p>
                    <p className="mt-1 text-muted-foreground">{competition.accessibility_note}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {session && registered && (
              <TeamsPanel
                competitionId={competitionId}
                teams={data.teams}
                members={data.members}
                myTeamId={myTeam?.id ?? null}
                onDone={refresh}
              />
            )}

            {session && registered && (
              <SubmissionPanel
                competitionId={competitionId}
                teamId={myTeam?.id ?? null}
                submission={mine?.submission ?? null}
                onDone={refresh}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leaderboard</CardTitle>
                <CardDescription>Average judge score across innovation, technical depth, impact and presentation.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Scores appear here once judging starts.</p>
                ) : (
                  <ol className="space-y-2">
                    {data.leaderboard.map((row) => (
                      <li
                        key={row.submission_id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                            {row.rank_position}
                          </span>
                          <div>
                            <p className="font-medium">{row.team_name || row.student_name || "Entry"}</p>
                            <p className="text-xs text-muted-foreground">{row.title}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{Number(row.avg_score).toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.judge_count} judge{Number(row.judge_count) === 1 ? "" : "s"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            {data.awards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Certificates issued</CardTitle>
                  <CardDescription>Every award below is verified and appears on the winner's Ability Passport.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.awards.map((award) => (
                      <li key={award.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Award className="size-4 text-teal" aria-hidden="true" />
                          <div>
                            <p className="font-medium">{award.award_label}</p>
                            <p className="text-xs text-muted-foreground">{award.profiles?.full_name ?? "Participant"}</p>
                          </div>
                        </div>
                        <code className="rounded bg-secondary px-2 py-1 text-xs">{award.certificate_code}</code>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {!session ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sign in to register</CardTitle>
                  <CardDescription>Create your free student account to take part.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="min-h-11 w-full">
                    <Link to="/register">Create account</Link>
                  </Button>
                  <Button asChild variant="outline" className="min-h-11 w-full">
                    <Link to="/login">Sign in</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : registered ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="size-4 text-teal" aria-hidden="true" />
                    You are registered
                  </CardTitle>
                  <CardDescription>
                    Status: {registration?.status === "submitted" ? "Entry submitted" : "Registered"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="min-h-11 w-full"
                    onClick={async () => {
                      if (!registration) return;
                      await withdrawRegistration(registration.id);
                      toast.success("You have withdrawn");
                      refresh();
                    }}
                  >
                    Withdraw
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <RegisterPanel competitionId={competitionId} onDone={refresh} />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function RegisterPanel({ competitionId, onDone }: { competitionId: string; onDone: () => void }) {
  const [motivation, setMotivation] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const mutation = useMutation({
    mutationFn: () => registerForCompetition(competitionId, motivation, accommodation),
    onSuccess: () => {
      toast.success("You are registered");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Register</CardTitle>
        <CardDescription>Tell the organiser why you want to take part.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="motivation">Why this challenge</Label>
          <Textarea
            id="motivation"
            className="mt-1"
            rows={3}
            value={motivation}
            onChange={(event) => setMotivation(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="accommodation">Accommodations you would like (optional)</Label>
          <Textarea
            id="accommodation"
            className="mt-1"
            rows={2}
            placeholder="For example: captions, extra time, remote participation"
            value={accommodation}
            onChange={(event) => setAccommodation(event.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Optional. You never need to disclose a disability, and it never affects judging.
          </p>
        </div>
        <Button className="min-h-11 w-full" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? "Registering…" : "Register now"}
        </Button>
      </CardContent>
    </Card>
  );
}

function TeamsPanel({
  competitionId,
  teams,
  members,
  myTeamId,
  onDone,
}: {
  competitionId: string;
  teams: { id: string; name: string; pitch: string; looking_for_members: boolean }[];
  members: { team_id: string; student_id: string; role_label: string; profiles: { full_name: string } | null }[];
  myTeamId: string | null;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");

  const create = useMutation({
    mutationFn: () => createTeam(competitionId, name, pitch),
    onSuccess: () => {
      toast.success("Team created");
      setName("");
      setPitch("");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const join = useMutation({
    mutationFn: (teamId: string) => joinTeam(competitionId, teamId),
    onSuccess: () => {
      toast.success("You joined the team");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const leave = useMutation({
    mutationFn: (teamId: string) => leaveTeam(competitionId, teamId),
    onSuccess: () => {
      toast.success("You left the team");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Teams</CardTitle>
        <CardDescription>Create a team or join one that is looking for members.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teams yet — be the first.</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team) => {
              const roster = members.filter((member) => member.team_id === team.id);
              const isMine = team.id === myTeamId;
              return (
                <li key={team.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {team.name} {isMine && <Badge className="ml-1 bg-primary-soft text-primary">My team</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">{team.pitch || "No pitch added yet."}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {roster.length} member{roster.length === 1 ? "" : "s"}:{" "}
                        {roster.map((member) => member.profiles?.full_name ?? "Member").join(", ") || "—"}
                      </p>
                    </div>
                    {isMine ? (
                      <Button variant="outline" className="min-h-11" onClick={() => leave.mutate(team.id)}>
                        Leave
                      </Button>
                    ) : myTeamId ? null : (
                      <Button variant="outline" className="min-h-11" onClick={() => join.mutate(team.id)}>
                        Join
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!myTeamId && (
          <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
            <Label htmlFor="team-name">Create your team</Label>
            <Input id="team-name" placeholder="Team name" value={name} onChange={(event) => setName(event.target.value)} />
            <Textarea
              rows={2}
              placeholder="What is your team building?"
              value={pitch}
              onChange={(event) => setPitch(event.target.value)}
            />
            <Button
              className="min-h-11"
              disabled={name.trim().length < 2 || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Creating…" : "Create team"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubmissionPanel({
  competitionId,
  teamId,
  submission,
  onDone,
}: {
  competitionId: string;
  teamId: string | null;
  submission: { title: string; summary: string; demo_link: string | null; repo_link: string | null } | null;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(submission?.title ?? "");
  const [summary, setSummary] = useState(submission?.summary ?? "");
  const [demoLink, setDemoLink] = useState(submission?.demo_link ?? "");
  const [repoLink, setRepoLink] = useState(submission?.repo_link ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      saveSubmission(competitionId, teamId, {
        title,
        summary,
        demoLink,
        repoLink,
      }),
    onSuccess: () => {
      toast.success("Submission saved");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your submission</CardTitle>
        <CardDescription>
          {submission ? "You can update your entry until the submission deadline." : "Share your entry with the judges."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="sub-title">Entry title</Label>
          <Input id="sub-title" className="mt-1" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="sub-summary">What you built</Label>
          <Textarea id="sub-summary" className="mt-1" rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="sub-demo">Demo link</Label>
            <Input id="sub-demo" className="mt-1" placeholder="https://" value={demoLink} onChange={(event) => setDemoLink(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="sub-repo">Code or document link</Label>
            <Input id="sub-repo" className="mt-1" placeholder="https://" value={repoLink} onChange={(event) => setRepoLink(event.target.value)} />
          </div>
        </div>
        <Button className="min-h-11" disabled={title.trim().length < 3 || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? "Saving…" : submission ? "Update submission" : "Submit entry"}
        </Button>
      </CardContent>
    </Card>
  );
}
