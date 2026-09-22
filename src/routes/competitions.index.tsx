import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Search, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  competitionCategoryLabels,
  competitionStatusLabels,
  competitionsQueryOptions,
  daysLeft,
  formatDate,
} from "@/lib/competitions";
import { workModeLabels } from "@/lib/opportunities";

export const Route = createFileRoute("/competitions/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Competitions and challenges — ABILITY360" },
      {
        name: "description",
        content:
          "Join hackathons, case studies and innovation challenges, build a team, submit your work and earn verified certificates.",
      },
      { property: "og:title", content: "Competitions and challenges — ABILITY360" },
      { property: "og:description", content: "Compete, build real evidence and earn verified achievements for your Ability Passport." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompetitionsPage,
});

function CompetitionsPage() {
  const { data, isPending } = useQuery(competitionsQueryOptions);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data ?? []).filter((row) => {
      if (category !== "all" && row.category !== category) return false;
      if (status !== "all" && row.status !== status) return false;
      if (!query) return true;
      return [row.title, row.organisation, row.location, ...row.skills]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [data, search, category, status]);

  const categories = useMemo(
    () => Array.from(new Set((data ?? []).map((row) => row.category))).sort(),
    [data],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <p className="text-sm font-medium uppercase tracking-widest text-teal">Compete and prove it</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-4xl">Competitions and challenges</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Register solo or with a team, submit your work, get judged on a transparent rubric and earn a verified
          certificate that lands straight in your Ability Passport.
        </p>

        <div className="mt-8 grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Label htmlFor="competition-search">Search</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="competition-search"
                className="pl-9"
                placeholder="Title, organiser or skill"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="competition-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="competition-category" className="mt-1">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {competitionCategoryLabels[item] ?? item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="competition-status">Stage</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="competition-status" className="mt-1">
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                <SelectItem value="open">Registrations open</SelectItem>
                <SelectItem value="judging">Judging in progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isPending ? (
          <div className="mt-8 h-40 animate-pulse rounded-lg bg-muted" />
        ) : rows.length === 0 ? (
          <p className="mt-8 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            No competitions match your filters yet.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {rows.map((row) => {
              const left = daysLeft(row.registration_deadline);
              return (
                <li key={row.id}>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{competitionCategoryLabels[row.category] ?? row.category}</Badge>
                        <Badge variant="outline">{competitionStatusLabels[row.status]}</Badge>
                        {row.is_inclusive && <Badge className="bg-primary-soft text-primary">Inclusive</Badge>}
                      </div>
                      <CardTitle className="mt-2 text-lg">{row.title}</CardTitle>
                      <CardDescription>{row.organisation}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{row.summary || row.description.slice(0, 160)}</p>
                      <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {row.location} · {workModeLabels[row.mode]}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="size-3.5" aria-hidden="true" />
                          Team of {row.team_min}–{row.team_max}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" aria-hidden="true" />
                          Register by {formatDate(row.registration_deadline)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Trophy className="size-3.5" aria-hidden="true" />
                          {row.prize_details || "Certificates for winners"}
                        </div>
                      </dl>
                      {left !== null && left >= 0 && left <= 14 && (
                        <p className="text-xs font-medium text-teal">Closing in {left} day{left === 1 ? "" : "s"}</p>
                      )}
                      <Button asChild className="min-h-11 w-full">
                        <Link to="/competitions/$competitionId" params={{ competitionId: row.id }}>
                          View challenge
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
