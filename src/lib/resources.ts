import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import programsImage from "@/assets/res-programs.jpg";
import scholarshipsImage from "@/assets/res-scholarships.jpg";
import divyangjanImage from "@/assets/res-divyangjan.jpg";
import blogsImage from "@/assets/res-blogs.jpg";
import examsImage from "@/assets/res-exams.jpg";

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

export const resourcesQueryOptions = queryOptions({
  queryKey: ["resources", "list"],
  queryFn: async (): Promise<ResourceRow[]> => {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("is_published", true)
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
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    staleTime: 5 * 60_000,
  });
}
