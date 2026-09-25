import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Search, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth";
import {
  communityCategoryLabels,
  communityPostsQueryOptions,
  communityStatusLabels,
  myCommunityPostsQueryOptions,
  submitCommunityPost,
  type CommunityCategory,
} from "@/lib/community";

export const Route = createFileRoute("/community")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Community needs and problems — ABILITY360" },
      {
        name: "description",
        content:
          "Share a student problem, requirement or idea. Approved community needs become visible on ABILITY360 for the ecosystem to solve.",
      },
      { property: "og:title", content: "Community needs and problems — ABILITY360" },
      {
        property: "og:description",
        content: "A moderated space for students to share real problems and requirements.",
      },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const { data: session } = useSession();
  const { data: posts, isPending, isError } = useQuery(communityPostsQueryOptions);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CommunityCategory | "all">("all");

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (posts ?? []).filter((post) => {
      const matchesCategory = category === "all" || post.category === category;
      const matchesSearch =
        !term ||
        post.title.toLowerCase().includes(term) ||
        post.body.toLowerCase().includes(term) ||
        post.tags.some((tag) => tag.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [posts, search, category]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Community</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">
                Real problems. Shared requirements. Collective solutions.
              </h1>
              <p className="mt-4 max-w-2xl text-muted-foreground sm:text-lg">
                Students and community members can describe a problem, requirement or idea. Every submission is
                moderated first; only approved posts become public.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="secondary">Admin moderated</Badge>
                <Badge variant="outline">Student-first</Badge>
                <Badge variant="outline">Accessibility-aware</Badge>
              </div>
            </div>
            <Card className="border-primary/20 bg-primary-soft/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="size-5" aria-hidden="true" />
                  Why this belongs on ABILITY360
                </CardTitle>
                <CardDescription>
                  Turn scattered student pain points into a visible, structured input stream for colleges, mentors
                  and industry.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p><strong>1.</strong> A student shares a real problem.</p>
                <p><strong>2.</strong> Admin checks quality, relevance and safety.</p>
                <p><strong>3.</strong> Approved needs appear for the ecosystem to discover.</p>
                <p><strong>4.</strong> Future phases can connect needs to projects, mentors and industry challenges.</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_.72fr]">
            <section aria-labelledby="community-list-heading">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="community-list-heading" className="text-xl font-bold sm:text-2xl">Approved community posts</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Only moderated posts are shown here.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Label htmlFor="community-search" className="sr-only">Search community</Label>
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="community-search"
                    className="pl-9"
                    placeholder="Search a problem, requirement or tag"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Select value={category} onValueChange={(value) => setCategory(value as CommunityCategory | "all")}>
                  <SelectTrigger className="w-full sm:w-48" aria-label="Filter community category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {Object.entries(communityCategoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isPending ? (
                <div className="mt-4 h-56 animate-pulse rounded-2xl bg-muted" />
              ) : isError ? (
                <div className="mt-4 rounded-2xl border border-destructive/40 bg-card p-6 text-sm text-destructive">
                  We couldn't load community posts right now. Please refresh and try again.
                </div>
              ) : results.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                  <MessageSquarePlus className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-3 font-medium">No approved posts yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Be the first to submit a useful requirement.</p>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {results.map((post) => (
                    <li key={post.id}>
                      <Card className="transition-colors hover:border-primary/40">
                        <CardHeader>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>{communityCategoryLabels[post.category as CommunityCategory] ?? post.category}</Badge>
                            {post.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                          </div>
                          <CardTitle className="text-lg">{post.title}</CardTitle>
                          <CardDescription>
                            Published {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/85">{post.body}</p>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="space-y-4">
              <CommunitySubmitCard signedIn={Boolean(session)} />
              <MySubmissions signedIn={Boolean(session)} />
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function CommunitySubmitCard({ signedIn }: { signedIn: boolean }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<CommunityCategory>("problem");
  const [tags, setTags] = useState("");
  
  const mutation = useMutation({
    mutationFn: () =>
      submitCommunityPost({
        title,
        body,
        category,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success("Submitted for admin review");
      setTitle("");
      setBody("");
      setCategory("problem");
      setTags("");
      void queryClient.invalidateQueries({ queryKey: ["community", "mine"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!signedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Have a problem to share?</CardTitle>
          <CardDescription>Sign in to submit a requirement or problem for moderation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full min-h-11">
            <Link to="/login">Sign in to post</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Send className="size-4" aria-hidden="true" /> Submit a community need</CardTitle>
        <CardDescription>Your post stays private until an admin approves it.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div>
            <Label htmlFor="community-title">Title</Label>
            <Input id="community-title" className="mt-1.5" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Accessible internships for chemical engineering students" />
          </div>
          <div>
            <Label htmlFor="community-category">Type</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as CommunityCategory)}>
              <SelectTrigger id="community-category" className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(communityCategoryLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="community-body">Describe the problem / requirement</Label>
            <Textarea
              id="community-body"
              className="mt-1.5 min-h-32"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="What is difficult today? Who is affected? What would help?"
            />
          </div>
          <div>
            <Label htmlFor="community-tags">Tags</Label>
            <Input id="community-tags" className="mt-1.5" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="internships, accessibility, chemical engineering" />
          </div>
          <div className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
            Admin review checks relevance, duplication, abusive content and personal data before publication.
          </div>
          <Button type="submit" className="min-h-11 w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting…" : "Send for approval"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MySubmissions({ signedIn }: { signedIn: boolean }) {
  const { data, isPending } = useQuery({ ...myCommunityPostsQueryOptions, enabled: signedIn });
  if (!signedIn) return null;
  if (isPending || !data?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My submissions</CardTitle>
        <CardDescription>Track what is waiting for review.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {data.slice(0, 5).map((post) => (
            <li key={post.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{post.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <Badge variant={post.status === "approved" ? "default" : post.status === "rejected" ? "destructive" : "secondary"}>
                  {communityStatusLabels[post.status as keyof typeof communityStatusLabels] ?? post.status}
                </Badge>
              </div>
              {post.admin_note && <p className="mt-2 text-xs text-muted-foreground">Admin note: {post.admin_note}</p>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
