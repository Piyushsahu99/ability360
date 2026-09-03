import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Accessibility, BadgeCheck, Bookmark, BookmarkCheck, CalendarDays, MapPin, Search, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { applicationsQueryOptions, saveOpportunity, statusLabels } from "@/lib/applications";
import { useSession } from "@/lib/auth";
import {
  formatDeadline,
  opportunitiesQueryOptions,
  opportunityTypeLabels,
  workModeLabels,
  type Opportunity,
} from "@/lib/opportunities";


export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — ABILITY360" },
      {
        name: "description",
        content:
          "Browse internships, jobs, training programmes and research projects curated for college students on ABILITY360.",
      },
      { property: "og:title", content: "Opportunities — ABILITY360" },
      {
        property: "og:description",
        content: "Internships, jobs, training and research projects for college students.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const { data, isPending, isError } = useQuery(opportunitiesQueryOptions);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [mode, setMode] = useState("all");
  const [inclusiveOnly, setInclusiveOnly] = useState(false);

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((item) => {
      const matchesTerm =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.organisation.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term) ||
        item.tags.some((tag) => tag.toLowerCase().includes(term));
      const matchesType = type === "all" || item.type === type;
      const matchesMode = mode === "all" || item.mode === mode;
      const matchesInclusive = !inclusiveOnly || item.is_inclusive_employer;
      return matchesTerm && matchesType && matchesMode && matchesInclusive;
    });
  }, [data, search, type, mode, inclusiveOnly]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <h1 className="text-3xl font-bold sm:text-4xl">Opportunities</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Internships, jobs, training programmes and research projects — matched to where you are in
            your course.
          </p>

          <div className="mt-8 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]">
            <div>
              <Label htmlFor="opportunity-search" className="sr-only">
                Search opportunities
              </Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="opportunity-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search role, company, skill or city"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filter-type" className="sr-only">
                Filter by type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="filter-type" className="w-full sm:w-44">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.entries(opportunityTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-mode" className="sr-only">
                Filter by work mode
              </Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger id="filter-mode" className="w-full sm:w-44">
                  <SelectValue placeholder="All modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  {Object.entries(workModeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <Label htmlFor="filter-inclusive" className="flex items-center gap-2 text-sm">
                <Accessibility className="size-4 text-primary" aria-hidden="true" />
                Inclusive employers only
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Roles that publish their accommodations for Divyangjan candidates.
              </p>
            </div>
            <Switch id="filter-inclusive" checked={inclusiveOnly} onCheckedChange={setInclusiveOnly} />
          </div>

          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            {isPending ? "Loading opportunities…" : `${results.length} opportunit${results.length === 1 ? "y" : "ies"}`}
          </p>

          {isError && (
            <div className="mt-6 rounded-lg border border-destructive/40 bg-card p-6 text-sm text-destructive">
              We couldn't load opportunities right now. Please refresh and try again.
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {isPending &&
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="gap-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                  </CardHeader>
                </Card>
              ))}

            {!isPending &&
              results.map((item) => (
                <Card key={item.id} className="flex flex-col transition-colors hover:border-teal/50">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">
                        {opportunityTypeLabels[item.type]}
                      </Badge>
                      <Badge variant="outline">{workModeLabels[item.mode]}</Badge>
                      {item.is_inclusive_employer && (
                        <Badge variant="outline" className="gap-1 border-teal/50 text-teal">
                          <BadgeCheck className="size-3.5" aria-hidden="true" />
                          Inclusive employer
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-2 text-lg">{item.title}</CardTitle>
                    <CardDescription className="font-medium text-foreground">
                      {item.organisation}
                    </CardDescription>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    <ul className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <li key={tag}>
                          <Badge variant="secondary" className="font-normal">
                            {tag}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    {item.accessibility_features.length > 0 && (
                      <div>
                        <p className="text-xs font-medium">Accommodations offered</p>
                        <ul className="mt-1.5 flex flex-wrap gap-1.5">
                          {item.accessibility_features.map((feature) => (
                            <li key={feature}>
                              <Badge variant="outline" className="font-normal">
                                {feature}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                        {item.accessibility_note && (
                          <p className="mt-1.5 text-xs text-muted-foreground">{item.accessibility_note}</p>
                        )}
                      </div>
                    )}
                    <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-4 shrink-0" aria-hidden="true" />
                        <dt className="sr-only">Location</dt>
                        <dd>{item.location}</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wallet className="size-4 shrink-0" aria-hidden="true" />
                        <dt className="sr-only">Compensation</dt>
                        <dd>{item.stipend ?? "Not disclosed"}</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                        <dt className="sr-only">Apply by</dt>
                        <dd>{formatDeadline(item.deadline)}</dd>
                      </div>
                    </dl>
                    <SaveAction opportunity={item} />
                  </CardContent>
                </Card>

              ))}
          </div>

          {!isPending && !isError && results.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <p className="font-medium">No opportunities match those filters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different keyword, type or work mode.
              </p>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function SaveAction({ opportunity }: { opportunity: Opportunity }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: applications } = useQuery({
    ...applicationsQueryOptions,
    enabled: Boolean(session),
  });

  const existing = (applications ?? []).find((item) => item.opportunity_id === opportunity.id);

  const saveMutation = useMutation({
    mutationFn: () => saveOpportunity(opportunity),
    onSuccess: () => {
      toast.success("Saved to your applications");
      void queryClient.invalidateQueries({ queryKey: ["student", "applications"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!session) {
    return (
      <Button asChild variant="outline" size="sm" className="w-full">
        <Link to="/login">Sign in to save and apply</Link>
      </Button>
    );
  }

  if (existing) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1 border-teal/50 text-teal">
          <BookmarkCheck className="size-3.5" aria-hidden="true" />
          {statusLabels[existing.status]}
        </Badge>
        <Button asChild variant="outline" size="sm">
          <Link to="/applications">Manage application</Link>
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      className="w-full"
      onClick={() => saveMutation.mutate()}
      disabled={saveMutation.isPending}
    >
      <Bookmark className="size-4" aria-hidden="true" />
      Save &amp; track
    </Button>
  );
}
