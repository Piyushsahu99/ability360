import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { GraduationCap, Target, TrendingUp, Users } from "lucide-react";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { InstitutionFilters } from "@/components/institution-filters";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { institutionNav } from "@/lib/nav";
import {
  careerGoalBreakdown,
  departmentBreakdown,
  emptyFilters,
  filterDirectory,
  institutionDirectoryQueryOptions,
  summarise,
} from "@/lib/institution";

export const Route = createFileRoute("/_authenticated/institution/students")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Student directory — ABILITY360" },
      { name: "description", content: "Search your college's students by department, year and course with live readiness data." },
      { property: "og:title", content: "Student directory — ABILITY360" },
      { property: "og:description", content: "College-wide student directory with readiness, goals and application activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentDirectoryPage,
});

function StudentDirectoryPage() {
  const { data, isLoading } = useQuery(institutionDirectoryQueryOptions);
  const [filters, setFilters] = useState(emptyFilters);
  const rows = data ?? [];
  const filtered = useMemo(() => filterDirectory(rows, filters), [rows, filters]);
  const summary = summarise(filtered);
  const departments = departmentBreakdown(filtered);
  const goals = careerGoalBreakdown(filtered);

  return (
    <DashboardShell
      role="institution"
      title="Student directory"
      subtitle="Every enrolled student, with live skill readiness, goals and application activity."
      nav={institutionNav("/institution/students")}
    >
      <InstitutionFilters rows={rows} filters={filters} onChange={setFilters} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={String(summary.students)} hint={`${summary.onboarded} completed onboarding`} icon={GraduationCap} />
        <StatCard label="Average readiness" value={`${summary.avgReadiness}%`} hint="Against chosen target roles" icon={TrendingUp} />
        <StatCard label="With a career goal" value={String(summary.withTargetRole)} hint="Target role selected" icon={Target} />
        <StatCard label="Verified skills" value={String(summary.verifiedSkills)} hint="Assessment or mentor verified" icon={Users} />
      </div>

      <PanelCard title="Departments" description="Readiness and outcomes grouped by department.">
        {departments.length === 0 ? (
          <EmptyState message="No students match these filters yet." />
        ) : (
          <ul className="space-y-3">
            {departments.map((item) => (
              <li key={item.department} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{item.department}</span>
                  <span className="text-muted-foreground">
                    {item.summary.students} students · {item.summary.placements} placements
                  </span>
                </div>
                <Progress value={item.summary.avgReadiness} className="mt-2" aria-label={`${item.department} readiness`} />
                <p className="mt-1 text-xs text-muted-foreground">{item.summary.avgReadiness}% average readiness</p>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard title="Career goals" description="Most chosen target roles across the filtered students.">
        {goals.length === 0 ? (
          <EmptyState message="Students have not selected target roles yet." />
        ) : (
          <ul className="space-y-2">
            {goals.map((goal) => (
              <li key={goal.goal} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{goal.goal}</p>
                  {goal.course ? <p className="text-xs text-muted-foreground">{goal.course}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{goal.students} students</Badge>
                  <Badge variant="outline">{goal.avgReadiness}% ready</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard title={`Students (${filtered.length})`} description="Individual records visible to your college only.">
        {isLoading ? (
          <EmptyState message="Loading student records…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No students found"
            description="Invite students to register with your college, or clear the filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <caption className="sr-only">Student directory</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="py-2 pr-3">Student</th>
                  <th scope="col" className="py-2 pr-3">Department</th>
                  <th scope="col" className="py-2 pr-3">Year</th>
                  <th scope="col" className="py-2 pr-3">Target role</th>
                  <th scope="col" className="py-2 pr-3">Readiness</th>
                  <th scope="col" className="py-2 pr-3">Skills</th>
                  <th scope="col" className="py-2 pr-3">Roadmap</th>
                  <th scope="col" className="py-2 pr-3">Applications</th>
                  <th scope="col" className="py-2">Placements</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.student_id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3">
                      <p className="font-medium">{row.full_name || "Unnamed student"}</p>
                      <p className="text-xs text-muted-foreground">{row.degree ?? "Degree not set"}</p>
                    </td>
                    <td className="py-2 pr-3">{row.department ?? "—"}</td>
                    <td className="py-2 pr-3">{row.year_of_study ?? "—"}</td>
                    <td className="py-2 pr-3">{row.target_role_title ?? "—"}</td>
                    <td className="py-2 pr-3">{row.readiness}%</td>
                    <td className="py-2 pr-3">
                      {row.skills_total} <span className="text-xs text-muted-foreground">({row.skills_verified} verified)</span>
                    </td>
                    <td className="py-2 pr-3">{row.roadmap_completed}</td>
                    <td className="py-2 pr-3">
                      {row.applications_total} <span className="text-xs text-muted-foreground">({row.applications_active} active)</span>
                    </td>
                    <td className="py-2">{row.placements}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </DashboardShell>
  );
}
