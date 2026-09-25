import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { currentUserId } from "@/lib/dna";

export type CommunityPost = Tables<"community_posts">;
export type CommunityStatus = "pending" | "approved" | "rejected" | "archived";
export type CommunityCategory = "problem" | "requirement" | "idea" | "request";

export const communityCategoryLabels: Record<CommunityCategory, string> = {
  problem: "Problem",
  requirement: "Requirement",
  idea: "Idea",
  request: "Request",
};

export const communityStatusLabels: Record<CommunityStatus, string> = {
  pending: "Pending review",
  approved: "Published",
  rejected: "Needs changes",
  archived: "Archived",
};

export const communityPostSchema = z.object({
  title: z.string().trim().min(6, "Title should be at least 6 characters").max(140),
  body: z.string().trim().min(20, "Please describe the problem or requirement in at least 20 characters").max(2000),
  category: z.enum(["problem", "requirement", "idea", "request"]),
  tags: z.array(z.string().trim().min(1).max(30)).max(8),
});

export type CommunityPostInput = z.infer<typeof communityPostSchema>;

export const communityPostsQueryOptions = queryOptions({
  queryKey: ["community", "approved"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("community_posts")
      .select("id, title, body, category, tags, created_at, updated_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Array<
      Pick<CommunityPost, "id" | "title" | "body" | "category" | "tags" | "created_at" | "updated_at">
    >;
  },
  staleTime: 30_000,
});

export const myCommunityPostsQueryOptions = queryOptions({
  queryKey: ["community", "mine"],
  queryFn: async () => {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("community_posts")
      .select("id, title, body, category, tags, status, admin_note, created_at, updated_at")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as CommunityPost[];
  },
});

export const communityModerationQueryOptions = queryOptions({
  queryKey: ["admin", "community", "pending"],
  queryFn: async () => {
    const { data: posts, error } = await supabase
      .from("community_posts")
      .select("id, author_id, title, body, category, tags, status, admin_note, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) throw error;
    const rows = (posts ?? []) as CommunityPost[];
    const authorIds = Array.from(new Set(rows.map((post) => post.author_id)));
    if (authorIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);

    if (profilesError) throw profilesError;
    const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
    return rows.map((post) => ({
      ...post,
      author_name: names.get(post.author_id) || "Community member",
    }));
  },
  staleTime: 15_000,
});

export async function submitCommunityPost(input: CommunityPostInput) {
  const parsed = communityPostSchema.parse(input);
  const authorId = await currentUserId();
  const { error } = await supabase.from("community_posts").insert({
    author_id: authorId,
    title: parsed.title,
    body: parsed.body,
    category: parsed.category,
    tags: parsed.tags.filter(Boolean),
    status: "pending",
  });
  if (error) throw error;
}

export async function moderateCommunityPost(
  id: string,
  decision: Extract<CommunityStatus, "approved" | "rejected" | "archived">,
  adminNote = "",
) {
  const { error } = await supabase
    .from("community_posts")
    .update({
      status: decision,
      admin_note: adminNote.trim() || null,
      reviewed_by: await currentUserId(),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}
