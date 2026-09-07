import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { indianStates } from "@/lib/india";
import {
  resourceCategories,
  resourceCategoryDescriptions,
  resourceCategoryLabels,
  resourceImage,
  resourcesQueryOptions,
  type ResourceCategory,
} from "@/lib/resources";

export const Route = createFileRoute("/resources/")({
  head: () => ({
    meta: [
      { title: "Student resources, scholarships and Divyangjan support — ABILITY360" },
      {
        name: "description",
        content:
          "Indian skilling programmes, scholarships, Divyangjan rights and schemes, exam guides and career articles, in one searchable library.",
      },
      { property: "og:title", content: "Student resources and scholarships — ABILITY360" },
      {
        property: "og:description",
        content: "Programmes, scholarships, Divyangjan support, exams and career guidance for Indian college students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { data, isPending, isError } = useQuery(resourcesQueryOptions);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [state, setState] = useState<string>("all");

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((item) => {
      const matchesTerm =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.summary.toLowerCase().includes(term) ||
        item.organisation.toLowerCase().includes(term) ||
        item.tags.some((tag) => tag.toLowerCase().includes(term));
      const matchesCategory = category === "all" || item.category === category;
      const matchesState = state === "all" || item.region === "All India" || item.region === state;
      return matchesTerm && matchesCategory && matchesState;
    });
  }, [data, search, category, state]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <h1 className="text-2xl font-bold sm:text-4xl">Resources</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Skilling programmes, scholarships, Divyangjan rights and schemes, national exams and
            practical career guidance — written for Indian college students.
          </p>

          <div className="mt-6 grid gap-3 rounded-3xl border border-border bg-card p-3 sm:mt-8 sm:p-4 sm:grid-cols-[1fr_auto_auto]">
            <div>
              <Label htmlFor="resource-search" className="sr-only">
                Search resources
              </Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="resource-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search scheme, scholarship, exam or topic"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="resource-category" className="sr-only">
                Filter by category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="resource-category" className="w-full sm:w-52">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {resourceCategories.map((value) => (
                    <SelectItem key={value} value={value}>
                      {resourceCategoryLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resource-state" className="sr-only">
                Filter by state
              </Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger id="resource-state" className="w-full sm:w-52">
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states and UTs</SelectItem>
                  {indianStates.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ul className="-mx-4 mt-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {resourceCategories.map((value) => (
              <li key={value} className="shrink-0 snap-start">
                <Button
                  type="button"
                  size="sm"
                  variant={category === value ? "default" : "outline"}
                  onClick={() => setCategory(category === value ? "all" : value)}
                >
                  {resourceCategoryLabels[value]}
                </Button>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            {isPending ? "Loading resources…" : `${results.length} resource${results.length === 1 ? "" : "s"}`}
            {category !== "all" ? ` · ${resourceCategoryDescriptions[category as ResourceCategory]}` : ""}
          </p>

          {isError && (
            <div className="mt-6 rounded-2xl border border-destructive/40 bg-card p-6 text-sm text-destructive">
              We couldn't load the resource library right now. Please refresh and try again.
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-2">
            {isPending &&
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="rounded-3xl">
                  <Skeleton className="h-36 w-full rounded-t-3xl sm:h-40" />
                  <CardHeader className="gap-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-12 w-full" />
                  </CardHeader>
                </Card>
              ))}

            {!isPending &&
              results.map((item) => (
                <Card key={item.id} className="flex flex-col overflow-hidden rounded-3xl transition-colors hover:border-primary/50">
                  <img
                    src={resourceImage(item)}
                    alt=""
                    loading="lazy"
                    width={1024}
                    height={640}
                    className="h-36 w-full object-cover sm:h-40"
                  />
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">
                        {resourceCategoryLabels[item.category as ResourceCategory] ?? item.category}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {item.region}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2 text-lg">{item.title}</CardTitle>
                    {item.organisation && (
                      <CardDescription className="font-medium text-foreground">{item.organisation}</CardDescription>
                    )}
                    <CardDescription>{item.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    {item.benefit && (
                      <p className="text-sm">
                        <span className="font-medium">What you get: </span>
                        {item.benefit}
                      </p>
                    )}
                    {item.deadline_label && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">When: </span>
                        {item.deadline_label}
                      </p>
                    )}
                    <ul className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <li key={tag}>
                          <Badge variant="secondary" className="font-normal">
                            {tag}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link to="/resources/$slug" params={{ slug: item.slug }}>
                          Read details
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                      {item.link && (
                        <Button asChild size="sm" variant="outline">
                          <a href={item.link} target="_blank" rel="noreferrer noopener">
                            Official site
                            <ExternalLink className="size-4" aria-hidden="true" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {!isPending && !isError && results.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <p className="font-medium">No resources match those filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try another keyword, category or state.</p>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
