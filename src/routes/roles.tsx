import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BadgeCheck,
  Briefcase,
  Compass,
  IndianRupee,
  ListChecks,
  Loader2,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/lib/auth";
import {
  careerRolesQueryOptions,
  formatLpa,
  selectTargetRole,
  targetRoleQueryOptions,
  uniqueSorted,
  type CareerRole,
} from "@/lib/careers";

export const Route = createFileRoute("/roles")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Roles & Responsibilities — ABILITY360" },
      {
        name: "description",
        content:
          "Explore career roles by course and branch: responsibilities, required skills, certifications and India pay scales for freshers and experienced professionals.",
      },
      { property: "og:title", content: "Roles & Responsibilities — ABILITY360" },
      {
        property: "og:description",
        content: "Discover the right career role for your course and branch, then start your roadmap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RolesPage,
});

const ALL = "__all__";

function RolesPage() {
  const { data: roles, isPending } = useQuery(careerRolesQueryOptions);
  const { data: me } = useMe();
  const { data: target } = useQuery({ ...targetRoleQueryOptions, enabled: !!me });
  const queryClient = useQueryClient();

  const [course, setCourse] = useState<string>(ALL);
  const [branch, setBranch] = useState<string>(ALL);
  const [roleId, setRoleId] = useState<string>("");

  const all = useMemo(() => roles ?? [], [roles]);

  const courses = useMemo(() => uniqueSorted(all.map((r) => r.course)), [all]);
  const branches = useMemo(
    () => uniqueSorted(all.filter((r) => course === ALL || r.course === course).map((r) => r.branch)),
    [all, course],
  );
  const filtered = useMemo(
    () =>
      all.filter(
        (r) => (course === ALL || r.course === course) && (branch === ALL || r.branch === branch),
      ),
    [all, course, branch],
  );

  const selected: CareerRole | undefined =
    filtered.find((r) => r.id === roleId) ?? all.find((r) => r.id === roleId);

  const mutation = useMutation({
    mutationFn: selectTargetRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["career-roles", "target"] });
      toast.success("Target role saved. Your roadmap is now tuned to it.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const isTarget = !!selected && target?.target_role_id === selected.id;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-16">
            <Badge variant="secondary" className="mb-4">
              Career library
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Roles &amp; Responsibilities
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              Pick your course and branch, then compare real roles — what you would do day to day, the
              skills and certifications that matter, and what the role pays in India for freshers and
              experienced professionals.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="course">Course</Label>
              <Select
                value={course}
                onValueChange={(value) => {
                  setCourse(value);
                  setBranch(ALL);
                  setRoleId("");
                }}
              >
                <SelectTrigger id="course" className="mt-2 min-h-11">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All courses</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select
                value={branch}
                onValueChange={(value) => {
                  setBranch(value);
                  setRoleId("");
                }}
              >
                <SelectTrigger id="branch" className="mt-2 min-h-11">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="role" className="mt-2 min-h-11">
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {filtered.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isPending ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : selected ? (
            <RoleDetail
              role={selected}
              isTarget={isTarget}
              canSelect={me?.role === "student"}
              signedIn={!!me}
              saving={mutation.isPending}
              onSelect={() => mutation.mutate(selected.id)}
              onBack={() => setRoleId("")}
            />
          ) : (
            <>
              <p className="mt-8 text-sm text-muted-foreground" role="status">
                {filtered.length} role{filtered.length === 1 ? "" : "s"} match your filters.
              </p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((role) => (
                  <li key={role.id}>
                    <Card className="h-full transition-colors hover:border-primary/50">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary">{role.category}</Badge>
                          <span className="text-xs text-muted-foreground">{role.demand} demand</span>
                        </div>
                        <CardTitle className="text-lg">{role.title}</CardTitle>
                        <CardDescription>
                          {role.course} · {role.branch}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="line-clamp-3 text-sm text-muted-foreground">{role.summary}</p>
                        <p className="flex items-center gap-2 text-sm font-medium">
                          <IndianRupee className="size-4 text-teal" aria-hidden="true" />
                          Fresher {formatLpa(role.fresher_min_lpa, role.fresher_max_lpa)}
                        </p>
                        <Button
                          variant="outline"
                          className="min-h-11 w-full"
                          onClick={() => setRoleId(role.id)}
                        >
                          View role details
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
              {filtered.length === 0 && (
                <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No roles match these filters yet.
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function RoleDetail({
  role,
  isTarget,
  canSelect,
  signedIn,
  saving,
  onSelect,
  onBack,
}: {
  role: CareerRole;
  isTarget: boolean;
  canSelect: boolean;
  signedIn: boolean;
  saving: boolean;
  onSelect: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mt-8 space-y-6">
      <Button variant="ghost" className="min-h-11" onClick={onBack}>
        ← Back to all roles
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{role.course}</Badge>
            <Badge variant="secondary">{role.branch}</Badge>
            <Badge variant="outline">{role.demand} demand</Badge>
          </div>
          <CardTitle className="font-display text-2xl sm:text-3xl">{role.title}</CardTitle>
          <CardDescription className="text-base">{role.summary}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <IndianRupee className="size-4 text-teal" aria-hidden="true" />
              Fresher pay (India)
            </p>
            <p className="mt-1 text-xl font-semibold">
              {formatLpa(role.fresher_min_lpa, role.fresher_max_lpa)}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="size-4 text-teal" aria-hidden="true" />
              Experienced ({role.experienced_label})
            </p>
            <p className="mt-1 text-xl font-semibold">
              {formatLpa(role.experienced_min_lpa, role.experienced_max_lpa)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <ListCard title="Responsibilities" icon={ListChecks} items={role.responsibilities} />
        <ListCard title="Skills required" icon={Target} items={role.skills} />
        <ListCard title="Certifications" icon={Award} items={role.certifications} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="size-4 text-teal" aria-hidden="true" />
            Growth path
          </CardTitle>
          <CardDescription>{role.growth_path}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {canSelect ? (
            <Button className="min-h-11" onClick={onSelect} disabled={saving || isTarget}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : isTarget ? (
                <BadgeCheck className="size-4" aria-hidden="true" />
              ) : (
                <Compass className="size-4" aria-hidden="true" />
              )}
              {isTarget ? "This is your target role" : "Start my journey with this role"}
            </Button>
          ) : signedIn ? (
            <p className="text-sm text-muted-foreground">
              Target roles are tracked on student accounts.
            </p>
          ) : (
            <Button asChild className="min-h-11">
              <Link to="/register">Create a student account to start this roadmap</Link>
            </Button>
          )}
          {isTarget && (
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/dashboard/student">Go to my roadmap</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ListCard({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Target;
  items: string[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-teal" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
