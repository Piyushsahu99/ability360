import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

export const udidSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{6,40}$/, "Enter the ID exactly as printed on your card (letters and numbers only)");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,13}$/, "Enter a valid mobile number, e.g. +919876543210");

export const pwdAllowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const pwdMaxBytes = 5 * 1024 * 1024;

export type PwdVerification = {
  student_id: string;
  udid_number: string;
  storage_path: string;
  status: "pending" | "verified" | "rejected";
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export const verificationStatusQueryOptions = queryOptions({
  queryKey: ["verification", "me"],
  queryFn: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const [{ data: pwd }, { data: profile }] = await Promise.all([
      supabase.from("pwd_verifications").select("*").eq("student_id", user.id).maybeSingle(),
      supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle(),
    ]);
    return {
      userId: user.id,
      email: user.email ?? "",
      emailVerified: Boolean(user.email_confirmed_at),
      phone: user.phone || profile?.phone || "",
      phoneVerified: Boolean(user.phone_confirmed_at),
      pwd: (pwd as PwdVerification | null) ?? null,
    };
  },
});

export async function submitPwdVerification(userId: string, udid: string, file: File) {
  const number = udidSchema.parse(udid);
  if (!pwdAllowedTypes.includes(file.type)) throw new Error("Upload a PDF, JPG, PNG or WEBP file.");
  if (file.size > pwdMaxBytes) throw new Error("The file must be 5 MB or smaller.");
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("pwd-documents").upload(path, file, { upsert: false });
  if (upErr) throw upErr;
  const { error } = await supabase
    .from("pwd_verifications")
    .upsert({ student_id: userId, udid_number: number, storage_path: path, status: "pending" }, { onConflict: "student_id" });
  if (error) throw error;
}

export async function resendEmailVerification(email: string) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${window.location.origin}/dna` },
  });
  if (error) throw error;
}

export async function startPhoneVerification(userId: string, phone: string) {
  const value = phoneSchema.parse(phone);
  const e164 = value.startsWith("+") ? value : `+91${value.slice(-10)}`;
  await supabase.from("profiles").update({ phone: e164 }).eq("id", userId);
  const { error } = await supabase.auth.updateUser({ phone: e164 });
  if (error) {
    throw new Error(
      "Your number is saved, but we can't send SMS codes yet. Phone verification will switch on once SMS is enabled.",
    );
  }
  return e164;
}

export async function confirmPhoneCode(phone: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ phone, token: token.trim(), type: "phone_change" });
  if (error) throw new Error("That code didn't work. Check it and try again.");
}

export const pwdQueueQueryOptions = queryOptions({
  queryKey: ["admin", "pwd-queue"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("pwd_verifications")
      .select("*, profiles!pwd_verifications_student_id_fkey(full_name)")
      .eq("status", "pending")
      .order("created_at");
    if (error) throw error;
    return data as unknown as (PwdVerification & { profiles: { full_name: string } | null })[];
  },
});

export async function pwdDocumentUrl(path: string) {
  const { data, error } = await supabase.storage.from("pwd-documents").createSignedUrl(path, 120);
  if (error) throw error;
  return data.signedUrl;
}

export async function decidePwd(studentId: string, approve: boolean, note?: string) {
  const { error } = await supabase
    .from("pwd_verifications")
    .update({ status: approve ? "verified" : "rejected", review_note: note?.trim() || null })
    .eq("student_id", studentId);
  if (error) throw error;
}
