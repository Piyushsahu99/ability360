import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import programsImage from "@/assets/res-programs.jpg";
import scholarshipsImage from "@/assets/res-scholarships.jpg";
import divyangjanImage from "@/assets/res-divyangjan.jpg";
import blogsImage from "@/assets/res-blogs.jpg";
import examsImage from "@/assets/res-exams.jpg";
import blogInternshipPpo from "@/assets/blog-posters/internship-to-ppo.jpg";
import blogPwdAdmission from "@/assets/blog-posters/pwd-admission-reservation-guide.jpg";
import blogPwdBusPass from "@/assets/blog-posters/pwd-bus-travel-pass-guide.jpg";
import blogPwdRailway from "@/assets/blog-posters/pwd-railway-concession-guide.jpg";
import blogPwdTourism from "@/assets/blog-posters/pwd-tourism-monument-benefits.jpg";
import blogPwdUdid from "@/assets/blog-posters/pwd-udid-and-other-benefits.jpg";
import blogResumeIndia from "@/assets/blog-posters/resume-india.jpg";
import blogNspFirstYear from "@/assets/blog-posters/scholarship-nsp-first-year-guide.jpg";
import blogStateNgo from "@/assets/blog-posters/scholarship-state-and-ngo-options.jpg";
import blogFirstSemester from "@/assets/blog-posters/skill-first-semester.jpg";
import blogStipendGuide from "@/assets/blog-posters/stipend-guide.jpg";

export type ResourceRow = Database["public"]["Tables"]["resources"]["Row"];

export const resourceCategories = ["program", "scholarship", "divyangjan", "blog", "exam"] as const;
export type ResourceCategory = (typeof resourceCategories)[number];

export const resourceCategoryLabels: Record<ResourceCategory, string> = {
  program: "Programmes",
  scholarship: "Scholarships",
  divyangjan: "Divyangjan support",
  blog: "Guidance articles",
  exam: "Exams",
};

export const resourceCategoryDescriptions: Record<ResourceCategory, string> = {
  program: "Government and industry skilling, apprenticeship and internship programmes.",
  scholarship: "Central, state and institutional financial support for your course.",
  divyangjan: "Rights, schemes, assistive devices and inclusive placement support.",
  blog: "Practical guidance written for Indian campus students.",
  exam: "Major national entrance and recruitment examinations.",
};

const categoryImages: Record<string, string> = {
  programs: programsImage,
  scholarships: scholarshipsImage,
  divyangjan: divyangjanImage,
  blogs: blogsImage,
  exams: examsImage,
  "blog-internship-to-ppo": blogInternshipPpo,
  "blog-pwd-admission-reservation-guide": blogPwdAdmission,
  "blog-pwd-bus-travel-pass-guide": blogPwdBusPass,
  "blog-pwd-railway-concession-guide": blogPwdRailway,
  "blog-pwd-tourism-monument-benefits": blogPwdTourism,
  "blog-pwd-udid-and-other-benefits": blogPwdUdid,
  "blog-resume-india": blogResumeIndia,
  "blog-scholarship-nsp-first-year-guide": blogNspFirstYear,
  "blog-scholarship-state-and-ngo-options": blogStateNgo,
  "blog-skill-first-semester": blogFirstSemester,
  "blog-stipend-guide": blogStipendGuide,
};

const fallbackImageByCategory: Record<ResourceCategory, string> = {
  program: programsImage,
  scholarship: scholarshipsImage,
  divyangjan: divyangjanImage,
  blog: blogsImage,
  exam: examsImage,
};

export function resourceImage(resource: Pick<ResourceRow, "image_key" | "category">) {
  return (
    categoryImages[resource.image_key] ??
    fallbackImageByCategory[resource.category as ResourceCategory] ??
    programsImage
  );
}

export function isResourceCategory(value: string): value is ResourceCategory {
  return (resourceCategories as readonly string[]).includes(value);
}

/** Imported listings disappear on their own closing date (or 30 days after import). */
function liveFilter() {
  return `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`;
}

export const resourcesQueryOptions = queryOptions({
  queryKey: ["resources", "list"],
  queryFn: async (): Promise<ResourceRow[]> => {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("is_published", true)
      .or(liveFilter())
      .order("category")
      .order("title");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60_000,
});

export function resourceQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ["resources", "detail", slug],
    queryFn: async (): Promise<ResourceRow | null> => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("slug", slug)
        .or(liveFilter())
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    staleTime: 5 * 60_000,
  });
}

export function formatClosingDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
