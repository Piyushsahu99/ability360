import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, GraduationCap, Target, Users } from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { facultyDirectoryQueryOptions } from "@/lib/faculty";
import { facultyNav } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/dashboard/faculty")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Faculty overview — ABILITY360" },
      {
        name: "description",
        content:
          "See how your students are progressing: readiness, verified skills, roadmap activity and who needs support next.",
      },
      { property: "og:title", content: "Faculty overview — ABILITY360" },
      {
        property: "og:description",
        content: "Track student readiness, verified skills and roadmap progress in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FacultyDashboard,
});

function FacultyDashboard() {
  const { data: rows = [], isPending } = useQuery(facultyDirectoryQueryOptions);

  const total = rows.length;
  const avgReadiness =
    total === 0 ? 0 : Math.round(rows.reduce((sum, row) => sum + Number(row.readiness), 0) / total);
  const verified = rows.reduce((sum, row) => sum + Number(row.skills_verified), 0);
  const unverified = rows.reduce(
    (sum, row) => sum + Math.max(Number(row.skills_total) - Number(row.skills_verified), 0),
    0,
  );

  const needsSupport = [...rows].sort((a, b) => Number(a.readiness) - Number(b.readiness)).slice(0, 6);
  const noTargetRole = rows.filter((row) => !row.target_role_title);

  return (
    <DashboardShell
      role="faculty"
      title="Faculty overview"
      subtitle="Your students at a glance — readiness, verification backlog and who to mentor next."
      nav={facultyNav("/dashboard/faculty")}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students in scope" value={String(total)} hint="Assigned or in your department" icon={Users} />
        <StatCard label="Average readiness" value={`${avgReadiness}%`} hint="Against their target roles" icon={Target} />
        <StatCard label="Verified skills" value={String(verified)} hint="Assessment or faculty verified" icon={BadgeCheck} />
        <StatCard label="Awaiting verification" value={String(unverified)} hint="Self-declared skills" icon={GraduationCap} />
      </div>

      <PanelCard
        title="Students who need support"
        description="Lowest career readiness first."
        action={
          <Button asChild variant="outline">
            <Link to="/faculty/students">Open my students</Link>
          </Button>
        }
      >
        {isPending ? (
          <EmptyState message="Loading your students…" />
        ) : needsSupport.length === 0 ? (
          <EmptyState
            title="No students yet"
            description="Ask your college admin to assign students to you, or set your department on your profile."
          />
        ) : (
          <ul className="space-y-3">
            {needsSupport.map((row) => (
              <li key={row.student_id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{row.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[row.department, row.target_role_title].filter(Boolean).join(" · ") ||
                        "No target role yet"}
                    </p>
                  </div>
                  <Badge variant={row.assigned ? "default" : "secondary"}>
                    {row.assigned ? "Assigned" : "Department"}
                  </Badge>
                </div>
                <Progress value={Number(row.readiness)} className="mt-3" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Readiness {Number(row.readiness)}% · {Number(row.skills_verified)}/{Number(row.skills_total)} skills
                  verified · {Number(row.roadmap_completed)} roadmap steps done
                </p>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard title="No target role yet" description="These students cannot see a personalised roadmap.">
        {noTargetRole.length === 0 ? (
          <EmptyState message="Every student in your scope has chosen a target role." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {noTargetRole.map((row) => (
              <Badge key={row.student_id} variant="outline">
                {row.full_name}
              </Badge>
            ))}
          </div>
        )}
      </PanelCard>
    </DashboardShell>
  );
}
