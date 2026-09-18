import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export const chatBodySchema = z
  .string()
  .trim()
  .min(1, "Write a message")
  .max(4000, "Keep it under 4000 characters");

export type ChatRow = ChatMessage & {
  profiles: { full_name: string; headline: string | null } | null;
  company_profiles: { company_name: string; logo_url: string | null } | null;
  opportunities: { title: string } | null;
};

export type ChatThread = {
  key: string;
  companyId: string;
  studentId: string;
  companyName: string;
  studentName: string;
  opportunityTitle: string | null;
  messages: ChatRow[];
  lastMessage: ChatRow;
  unread: number;
};

const selectAll =
  "*, profiles(full_name, headline), company_profiles(company_name, logo_url), opportunities(title)";

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in to continue.");
  return data.user.id;
}

function buildThreads(rows: ChatRow[], viewerId: string): ChatThread[] {
  const map = new Map<string, ChatThread>();
  for (const row of rows) {
    const key = `${row.company_id}:${row.student_id}`;
    const existing = map.get(key);
    if (existing) {
      existing.messages.push(row);
      existing.lastMessage = row;
      if (!row.read_at && row.sender_id !== viewerId) existing.unread += 1;
      if (!existing.opportunityTitle && row.opportunities?.title) {
        existing.opportunityTitle = row.opportunities.title;
      }
      continue;
    }
    map.set(key, {
      key,
      companyId: row.company_id,
      studentId: row.student_id,
      companyName: row.company_profiles?.company_name ?? "Employer",
      studentName: row.profiles?.full_name ?? "Student",
      opportunityTitle: row.opportunities?.title ?? null,
      messages: [row],
      lastMessage: row,
      unread: !row.read_at && row.sender_id !== viewerId ? 1 : 0,
    });
  }
  return [...map.values()].sort(
    (a, b) =>
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime(),
  );
}

async function fetchThreads(column: "company_id" | "student_id"): Promise<ChatThread[]> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return [];
  const { data, error } = await supabase
    .from("chat_messages")
    .select(selectAll)
    .eq(column, user.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return buildThreads((data ?? []) as unknown as ChatRow[], user.id);
}

export const employerChatQueryOptions = queryOptions({
  queryKey: ["chat", "employer"],
  queryFn: () => fetchThreads("company_id"),
  staleTime: 10_000,
  refetchInterval: 20_000,
});

export const studentChatQueryOptions = queryOptions({
  queryKey: ["chat", "student"],
  queryFn: () => fetchThreads("student_id"),
  staleTime: 10_000,
  refetchInterval: 20_000,
});

export async function sendChatMessage(input: {
  companyId: string;
  studentId: string;
  opportunityId?: string | null;
  body: string;
  as: "student" | "employer";
}) {
  const userId = await requireUserId();
  const body = chatBodySchema.parse(input.body);
  const { error } = await supabase.from("chat_messages").insert({
    company_id: input.companyId,
    student_id: input.studentId,
    opportunity_id: input.opportunityId ?? null,
    sender_id: userId,
    sender_role: input.as,
    body,
  });
  if (error) throw error;
}

export async function markThreadRead(thread: ChatThread, viewerId: string) {
  const ids = thread.messages
    .filter((message) => !message.read_at && message.sender_id !== viewerId)
    .map((message) => message.id);
  if (ids.length === 0) return;
  await supabase
    .from("chat_messages")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids);
}
