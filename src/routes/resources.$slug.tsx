import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  resourceCategoryLabels,
  resourceImage,
  resourceQueryOptions,
  type ResourceCategory,
} from "@/lib/resources";

export const Route = createFileRoute("/resources/$slug")({
  head: ({ params }) => {
    const readable = params.slug.replace(/-/g, " ");
    return {
      meta: [
        { title: `${readable} — ABILITY360 resources` },
        {
          name: "description",
          content: `Eligibility, benefits and how to apply for ${readable}, explained for Indian college students.`,
        },
        { property: "og:title", content: `${readable} — ABILITY360 resources` },
        {
          property: "og:description",
          content: `Eligibility, benefits and how to apply for ${readable}.`,
        },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ResourceDetailPage,
});

function ResourceDetailPage() {
  const { slug } = Route.useParams();
  const { data, isPending } = useQuery(resourceQueryOptions(slug));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 bg-surface">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <Button asChild variant="ghost" size="sm" className="mb-6">
            <Link to="/resources">
              <ArrowLeft className="size-4" aria-hidden="true" />
              All resources
            </Link>
          </Button>

          {isPending && (
            <div className="space-y-4">
              <Skeleton className="h-56 w-full rounded-3xl" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {!isPending && !data && (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <p className="font-medium">We couldn't find that resource</p>
              <p className="mt-1 text-sm text-muted-foreground">It may have been renamed or removed.</p>
              <Button asChild className="mt-4">
                <Link to="/resources">Browse all resources</Link>
              </Button>
            </div>
          )}

          {data && (
            <article>
              <img
                src={resourceImage(data)}
                alt=""
                width={1024}
                height={640}
                className="h-56 w-full rounded-3xl object-cover"
              />

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">
                  {resourceCategoryLabels[data.category as ResourceCategory] ?? data.category}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {data.region}
                </Badge>
                {data.audience.map((item) => (
                  <Badge key={item} variant="secondary" className="font-normal">
                    {item}
                  </Badge>
                ))}
              </div>

              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{data.title}</h1>
              {data.organisation && <p className="mt-1 font-medium">{data.organisation}</p>}
              <p className="mt-3 text-lg text-muted-foreground">{data.summary}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {data.eligibility && (
                  <Card className="rounded-3xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Who can apply</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{data.eligibility}</CardContent>
                  </Card>
                )}
                {data.benefit && (
                  <Card className="rounded-3xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">What you get</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{data.benefit}</CardContent>
                  </Card>
                )}
                {data.deadline_label && (
                  <Card className="rounded-3xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">When to apply</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{data.deadline_label}</CardContent>
                  </Card>
                )}
              </div>

              {data.body && (
                <div className="mt-8 space-y-4">
                  {data.body.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={index} className="leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              {data.tags.length > 0 && (
                <ul className="mt-8 flex flex-wrap gap-1.5">
                  {data.tags.map((tag) => (
                    <li key={tag}>
                      <Badge variant="secondary" className="font-normal">
                        {tag}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8 flex flex-wrap gap-2">
                {data.link && (
                  <Button asChild>
                    <a href={data.link} target="_blank" rel="noreferrer noopener">
                      Visit official site
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/opportunities">Find matching opportunities</Link>
                </Button>
              </div>
            </article>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
