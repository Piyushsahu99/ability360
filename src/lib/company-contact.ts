import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CompanyContactMessage =
  Database["public"]["Tables"]["company_contact_messages"]["Row"];

/** Shown publicly instead of a real employer email address. */
export const genericContactPlaceholder = "Contact this employer through ABILITY360";

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in to continue.");
  return data.user.id;
}

/* ---------------- Private hiring contact (employer only) ---------------- */

export const contactEmailSchema = z
  .string()
  .trim()
  .max(255)
  .email("Enter a valid email")
  .or(z.literal(""));

export const companyContactQueryOptions = queryOptions({
  queryKey: ["employer", "company-contact"],
  queryFn: async (): Promise<{ hiring_contact_email: string | null } | null> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const { data, error } = await supabase
      .from("company_contacts")
      .select("hiring_contact_email")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  staleTime: 30_000,
});

export async function saveCompanyContactEmail(email: string) {
  const id = await requireUserId();
  const parsed = contactEmailSchema.parse(email);
  const { error } = await supabase
    .from("company_contacts")
    .upsert({ id, hiring_contact_email: parsed || null });
  if (error) throw error;
}

/* ---------------- Contact messages ---------------- */

export const contactMessageSchema = z.object({
  subject: z.string().trim().min(3, "Add a short subject").max(120),
  body: z.string().trim().min(20, "Write at least 20 characters").max(2000),
  reply_email: z.string().trim().max(255).email("Enter a valid email").or(z.literal("")),
});
export type ContactMessageValues = z.infer<typeof contactMessageSchema>;

export async function sendCompanyMessage(input: {
  companyId: string;
  opportunityId?: string | null;
  values: ContactMessageValues;
}) {
  const studentId = await requireUserId();
  const values = contactMessageSchema.parse(input.values);
  const { error } = await supabase.from("company_contact_messages").insert({
    company_id: input.companyId,
    student_id: studentId,
    opportunity_id: input.opportunityId ?? null,
    subject: values.subject,
    body: values.body,
    reply_email: values.reply_email || null,
  });
  if (error) throw error;
}

export type EmployerMessage = CompanyContactMessage & {
  profiles: { full_name: string; headline: string | null } | null;
  opportunities: { title: string } | null;
};

export const employerMessagesQueryOptions = queryOptions({
  queryKey: ["employer", "contact-messages"],
  queryFn: async (): Promise<EmployerMessage[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return [];
    const { data, error } = await supabase
      .from("company_contact_messages")
      .select("*, profiles(full_name, headline), opportunities(title)")
      .eq("company_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as EmployerMessage[];
  },
  staleTime: 15_000,
});
