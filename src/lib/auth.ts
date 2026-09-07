import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

export const appRoles = ["student", "industry", "institution", "faculty", "admin"] as const;
export type AppRole = (typeof appRoles)[number];

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(72, "Passwords can be at most 72 characters"),
  role: z.enum(["student", "industry", "institution"]),
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  password: z.string().min(1, "Enter your password").max(72),
});
export type SignInValues = z.infer<typeof signInSchema>;


export const roleLabels: Record<AppRole, string> = {
  student: "Student",
  industry: "Industry",
  institution: "Institution",
  faculty: "Faculty",
  admin: "Admin",
};

export const dashboardPathByRole: Record<AppRole, string> = {
  student: "/dashboard/student",
  industry: "/dashboard/industry",
  institution: "/dashboard/institution",
  faculty: "/dashboard/faculty",
  admin: "/dashboard/admin",
};

export const sessionQueryOptions = queryOptions({
  queryKey: ["auth", "session"],
  queryFn: async (): Promise<Session | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
  staleTime: 30_000,
});

export const meQueryOptions = queryOptions({
  queryKey: ["auth", "me"],
  queryFn: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;

    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);

    /* A user can hold several roles (e.g. mentor + student). Resolve the highest
       privileged workspace we actually have a dashboard for, never an unknown one. */
    const held = (roles ?? []).map((row) => row.role as string);
    const priority: AppRole[] = ["admin", "institution", "faculty", "industry", "student"];
    const role = priority.find((candidate) => held.includes(candidate)) ?? "student";
    return {
      id: user.id,
      email: user.email ?? "",
      fullName: profile?.full_name || (user.user_metadata?.["full_name"] as string) || "",
      role,
    };
  },
});

export function useSession() {
  return useQuery(sessionQueryOptions);
}

export function useMe() {
  return useQuery(meQueryOptions);
}

export function initials(name: string, fallback = "A3") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
