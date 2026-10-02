import { queryOptions } from "@tanstack/react-query";
import type { UIMessage } from "ai";

import { supabase } from "@/integrations/supabase/client";

export type SathiThread = { id: string; title: string; updated_at: string };

export const sathiThreadsQueryOptions = queryOptions({
  queryKey: ["sathi", "threads"],
  queryFn: async (): Promise<SathiThread[]> => {
    const { data, error } = await supabase
      .from("sathi_threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  },
});

export function sathiMessagesQueryOptions(threadId: string) {
  return queryOptions({
    queryKey: ["sathi", "messages", threadId],
    queryFn: async (): Promise<UIMessage[]> => {
      const { data, error } = await supabase
        .from("sathi_messages")
        .select("message")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((row) => row.message as unknown as UIMessage);
    },
    staleTime: Infinity,
  });
}

export async function createSathiThread(): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Please sign in first.");
  const { data, error } = await supabase
    .from("sathi_threads")
    .insert({ user_id: auth.user.id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteSathiThread(id: string) {
  const { error } = await supabase.from("sathi_threads").delete().eq("id", id);
  if (error) throw error;
}

export async function sathiAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Send a recorded clip for transcription and return the final text. */
export async function transcribeClip(file: File): Promise<string> {
  const token = await sathiAccessToken();
  if (!token) throw new Error("Please sign in to use voice input.");
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/sathi/transcribe", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (response.status === 429) throw new Error("Voice input is busy. Please try again in a minute.");
    if (response.status === 402) throw new Error("Voice input is out of AI credits.");
    throw new Error(body?.error ?? body?.message ?? "Could not understand the recording. Please try again.");
  }
  const raw = await response.text();
  let text = "";
  let final = "";
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const event = JSON.parse(payload) as { type?: string; delta?: string; text?: string };
      if (event.type === "transcript.text.delta" && event.delta) text += event.delta;
      if (event.type === "transcript.text.done" && typeof event.text === "string") final = event.text;
    } catch {
      /* ignore partial lines */
    }
  }
  if (!raw.includes("data:")) {
    try {
      final = (JSON.parse(raw) as { text?: string }).text ?? "";
    } catch {
      /* not JSON */
    }
  }
  const result = (final || text).trim();
  if (!result) throw new Error("I couldn't hear anything. Please try again.");
  return result;
}

/** Read text aloud with the device's voice. Returns false when unsupported. */
export function speakText(text: string, lang = "en-IN"): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const plain = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#`>|]/g, "")
    .slice(0, 4000);
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(plain);
  utterance.lang = /[\u0900-\u097F]/.test(plain) ? "hi-IN" : lang;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
