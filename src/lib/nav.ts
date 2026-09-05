import {
  Accessibility,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardList,
  Users,
  Compass,
  BadgeCheck,
  MessageSquare,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  TrendingUp,
  Route as RouteIcon,
  Target,
  UserRound,
} from "lucide-react";

import type { NavItem } from "@/components/dashboard-shell";

const studentItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard/student" },
  { label: "Student DNA", icon: UserRound, to: "/dna" },
  { label: "Career roles", icon: Compass, to: "/roles" },
  { label: "My roadmap", icon: RouteIcon, to: "/roadmap" },
  { label: "Skills", icon: Target, to: "/assessment" },
  { label: "Accessibility", icon: Accessibility, to: "/accessibility" },
  { label: "Learning", icon: BookOpen },
  { label: "Applications", icon: Briefcase, to: "/applications" },
  { label: "Opportunities", icon: Compass, to: "/opportunities" },
];

export function studentNav(activePath: string): NavItem[] {
  return studentItems.map((item) => ({ ...item, active: item.to === activePath }));
}

const employerItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard/industry" },
  { label: "Company profile", icon: Building2, to: "/employer/company" },
  { label: "Opportunities", icon: ClipboardList, to: "/employer/opportunities" },
  { label: "Applicants", icon: Users, to: "/employer/applicants" },
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
];

export function institutionNav(activePath: string): NavItem[] {
  return institutionItems.map((item) => ({ ...item, active: item.to === activePath }));
}

const facultyItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard/faculty" },
  { label: "My students", icon: GraduationCap, to: "/faculty/students" },
  { label: "Verifications", icon: BadgeCheck, to: "/faculty/students" },
  { label: "Feedback", icon: MessageSquare, to: "/faculty/students" },
  { label: "Opportunities", icon: Compass, to: "/opportunities" },
];

export function facultyNav(activePath: string): NavItem[] {
  return facultyItems.map((item) => ({ ...item, active: item.to === activePath }));
}
