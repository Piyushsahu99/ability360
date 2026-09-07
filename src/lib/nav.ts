import {
  Accessibility,
  Briefcase,
  Building2,
  ClipboardList,
  Users,
  Compass,
  BookOpen,
  Activity,
  Gavel,
  HeartHandshake,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  TrendingUp,
  Route as RouteIcon,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";

import type { NavItem } from "@/components/dashboard-shell";
import type { AppRole } from "@/lib/auth";

const studentItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard/student" },
  { label: "My journey", icon: Activity, to: "/journey" },
  { label: "Student DNA", icon: UserRound, to: "/dna" },
  { label: "Career roles", icon: Compass, to: "/roles" },
  { label: "My roadmap", icon: RouteIcon, to: "/roadmap" },
  { label: "Skills", icon: Target, to: "/assessment" },
  { label: "Competitions", icon: Trophy, to: "/competitions" },
  { label: "Mentorship", icon: HeartHandshake, to: "/mentorship" },
  { label: "Accessibility", icon: Accessibility, to: "/accessibility" },
  { label: "Applications", icon: Briefcase, to: "/applications" },
  { label: "Opportunities", icon: Compass, to: "/opportunities" },
  { label: "Resources", icon: BookOpen, to: "/resources" },
];

export function studentNav(activePath: string): NavItem[] {
  return studentItems.map((item) => ({ ...item, active: item.to === activePath }));
}

const employerItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard/industry" },
  { label: "Company profile", icon: Building2, to: "/employer/company" },
  { label: "Opportunities", icon: ClipboardList, to: "/employer/opportunities" },
  { label: "Applicants", icon: Users, to: "/employer/applicants" },
  { label: "Competitions", icon: Trophy, to: "/organiser/competitions" },
  { label: "Judging", icon: Gavel, to: "/judging" },
  { label: "Mentoring", icon: HeartHandshake, to: "/mentor" },
  { label: "Browse talent pool", icon: Compass, to: "/opportunities" },
];

export function employerNav(activePath: string): NavItem[] {
  return employerItems.map((item) => ({ ...item, active: item.to === activePath }));
}

const institutionItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard/institution" },
  { label: "Students", icon: GraduationCap, to: "/institution/students" },
  { label: "Cohorts", icon: Users, to: "/institution/cohorts" },
  { label: "Outcomes", icon: LineChart, to: "/institution/outcomes" },
  { label: "Industry partners", icon: Building2, to: "/institution/partners" },
  { label: "Skill demand", icon: TrendingUp, to: "/institution/skill-demand" },
  { label: "Competitions", icon: Trophy, to: "/organiser/competitions" },
  { label: "Judging", icon: Gavel, to: "/judging" },
  { label: "Mentoring", icon: HeartHandshake, to: "/mentor" },
];

export function institutionNav(activePath: string): NavItem[] {
  return institutionItems.map((item) => ({ ...item, active: item.to === activePath }));
}

const facultyItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard/faculty" },
  { label: "My students", icon: GraduationCap, to: "/faculty/students" },
  { label: "Competitions", icon: Trophy, to: "/organiser/competitions" },
  { label: "Judging", icon: Gavel, to: "/judging" },
  { label: "Mentoring", icon: HeartHandshake, to: "/mentor" },
  { label: "Opportunities", icon: Compass, to: "/opportunities" },
];

export function facultyNav(activePath: string): NavItem[] {
  return facultyItems.map((item) => ({ ...item, active: item.to === activePath }));
}

export function navForRole(role: AppRole, activePath: string): NavItem[] {
  if (role === "student") return studentNav(activePath);
  if (role === "institution") return institutionNav(activePath);
  if (role === "faculty") return facultyNav(activePath);
  return employerNav(activePath);
}
