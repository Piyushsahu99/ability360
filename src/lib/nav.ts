import {
  Accessibility,
  BookOpen,
  Briefcase,
  Compass,
  LayoutDashboard,
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
