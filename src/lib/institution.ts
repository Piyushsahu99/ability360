import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DirectoryRow =
  Database["public"]["Functions"]["institution_directory"]["Returns"][number];
export type PartnershipRow =
  Database["public"]["Functions"]["institution_partnerships"]["Returns"][number];

/** Institution-scoped student directory. Server enforces role + college scope. */
export const institutionDirectoryQueryOptions = queryOptions({
  queryKey: ["institution", "directory"],
  queryFn: async (): Promise<DirectoryRow[]> => {
    const { data, error } = await supabase.rpc("institution_directory");
    if (error) throw error;
    return (data ?? []) as DirectoryRow[];
  },
  staleTime: 60_000,
});

export const institutionPartnershipsQueryOptions = queryOptions({
  queryKey: ["institution", "partnerships"],
  queryFn: async (): Promise<PartnershipRow[]> => {
    const { data, error } = await supabase.rpc("institution_partnerships");
    if (error) throw error;
    return (data ?? []) as PartnershipRow[];
  },
  staleTime: 60_000,
});

export type DirectoryFilters = {
  department: string;
  year: string;
  course: string;
  search: string;
};

export const emptyFilters: DirectoryFilters = {
  department: "all",
  year: "all",
  course: "all",
  search: "",
};

export function uniqueValues(rows: DirectoryRow[], key: keyof DirectoryRow) {
  const values = rows
    .map((row) => row[key])
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function yearOptions(rows: DirectoryRow[]) {
  const years = rows
    .map((row) => row.year_of_study)
    .filter((year): year is number => typeof year === "number");
  return Array.from(new Set(years)).sort((a, b) => a - b);
}

export function filterDirectory(rows: DirectoryRow[], filters: DirectoryFilters) {
  const search = filters.search.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    if (filters.department !== "all" && (row.department ?? "") !== filters.department) return false;
    if (filters.year !== "all" && String(row.year_of_study ?? "") !== filters.year) return false;
    if (filters.course !== "all" && (row.target_role_course ?? "") !== filters.course) return false;
    if (!search) return true;
    const haystack = [row.full_name, row.department, row.degree, row.target_role_title, row.career_goal]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return haystack.includes(search);
  });
}

export type Summary = {
  students: number;
  onboarded: number;
  avgReadiness: number;
  verifiedSkills: number;
  roadmapActive: number;
  applications: number;
  activeApplications: number;
  interviews: number;
  internships: number;
  placements: number;
  placementRate: number;
  withTargetRole: number;
};

export function summarise(rows: DirectoryRow[]): Summary {
  const students = rows.length;
  const sum = (pick: (row: DirectoryRow) => number) => rows.reduce((total, row) => total + pick(row), 0);
  const placements = sum((row) => Number(row.placements));
  return {
    students,
    onboarded: rows.filter((row) => row.onboarding_completed).length,
    avgReadiness: students === 0 ? 0 : Math.round(sum((row) => Number(row.readiness)) / students),
    verifiedSkills: sum((row) => Number(row.skills_verified)),
    roadmapActive: rows.filter((row) => Number(row.roadmap_completed) > 0).length,
    applications: sum((row) => Number(row.applications_total)),
    activeApplications: sum((row) => Number(row.applications_active)),
    interviews: sum((row) => Number(row.interviews)),
    internships: sum((row) => Number(row.internships)),
    placements,
    placementRate: students === 0 ? 0 : Math.round((rows.filter((row) => Number(row.placements) > 0).length / students) * 100),
    withTargetRole: rows.filter((row) => Boolean(row.target_role_title)).length,
  };
}

export type Cohort = {
  key: string;
  department: string;
  year: number | null;
  summary: Summary;
};

export function groupBy(rows: DirectoryRow[], pick: (row: DirectoryRow) => string) {
  const map = new Map<string, DirectoryRow[]>();
  for (const row of rows) {
    const key = pick(row);
    const list = map.get(key);
    if (list) list.push(row);
    else map.set(key, [row]);
  }
  return map;
}

export function departmentBreakdown(rows: DirectoryRow[]) {
  return Array.from(groupBy(rows, (row) => row.department?.trim() || "Unassigned").entries())
    .map(([department, list]) => ({ department, summary: summarise(list) }))
    .sort((a, b) => b.summary.students - a.summary.students);
}

export function cohortBreakdown(rows: DirectoryRow[]): Cohort[] {
  return Array.from(
    groupBy(rows, (row) => `${row.department?.trim() || "Unassigned"}|${row.year_of_study ?? ""}`).entries(),
  )
    .map(([key, list]) => {
      const [department, year] = key.split("|");
      return {
        key,
        department: department || "Unassigned",
        year: year ? Number(year) : null,
        summary: summarise(list),
      };
    })
    .sort((a, b) => (a.department.localeCompare(b.department) || (a.year ?? 0) - (b.year ?? 0)));
}

export function careerGoalBreakdown(rows: DirectoryRow[], limit = 8) {
  const map = groupBy(
    rows.filter((row) => row.target_role_title || row.career_goal),
    (row) => row.target_role_title || row.career_goal || "Undecided",
  );
  return Array.from(map.entries())
    .map(([goal, list]) => ({
      goal,
      students: list.length,
      course: list[0]?.target_role_course ?? null,
      avgReadiness: summarise(list).avgReadiness,
    }))
    .sort((a, b) => b.students - a.students)
    .slice(0, limit);
}

export function readinessBands(rows: DirectoryRow[]) {
  const band = (min: number, max: number) =>
    rows.filter((row) => Number(row.readiness) >= min && Number(row.readiness) <= max).length;
  const total = Math.max(rows.length, 1);
  return [
    { label: "Placement ready (75%+)", count: band(75, 100) },
    { label: "Demonstrate (50–74%)", count: band(50, 74) },
    { label: "Develop (25–49%)", count: band(25, 49) },
    { label: "Discover (0–24%)", count: band(0, 24) },
  ].map((item) => ({ ...item, percent: Math.round((item.count / total) * 100) }));
}
