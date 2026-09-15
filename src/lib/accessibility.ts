import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AccessibilityRow = Database["public"]["Tables"]["accessibility_preferences"]["Row"];

/* ------------------------------------------------------------------ */
/* Saved (database) accommodation preferences                          */
/* ------------------------------------------------------------------ */

export const accessibilityPrefsSchema = z.object({
  screen_reader: z.boolean(),
  high_contrast: z.boolean(),
  captions: z.boolean(),
  keyboard_navigation: z.boolean(),
  reduced_motion: z.boolean(),
  remote_participation: z.boolean(),
  accessible_venue: z.boolean(),
  flexible_schedule: z.boolean(),
  other_accommodation: z.string().trim().max(280).optional(),
});
export type AccessibilityPrefs = z.infer<typeof accessibilityPrefsSchema>;

export const defaultPrefs: AccessibilityPrefs = {
  screen_reader: false,
  high_contrast: false,
  captions: false,
  keyboard_navigation: false,
  reduced_motion: false,
  remote_participation: false,
  accessible_venue: false,
  flexible_schedule: false,
  other_accommodation: "",
};

export const prefFields = [
  {
    key: "screen_reader",
    label: "Screen reader support",
    hint: "Descriptive labels, landmarks and live announcements.",
  },
  { key: "high_contrast", label: "High contrast", hint: "Stronger colour separation across the app." },
  { key: "captions", label: "Captions & transcripts", hint: "Prefer captioned video and media." },
  {
    key: "keyboard_navigation",
    label: "Keyboard navigation",
    hint: "Clear focus order, skip links and shortcuts.",
  },
  { key: "reduced_motion", label: "Reduced motion", hint: "Minimise transitions and animation." },
  {
    key: "remote_participation",
    label: "Remote participation",
    hint: "Prioritise remote-friendly opportunities.",
  },
  { key: "accessible_venue", label: "Accessible venue", hint: "Step-free access, accessible washrooms." },
  { key: "flexible_schedule", label: "Flexible schedule", hint: "Flexible timing and extra time." },
] as const satisfies ReadonlyArray<{
  key: keyof Omit<AccessibilityPrefs, "other_accommodation">;
  label: string;
  hint: string;
}>;

export const accessibilityPrefsQueryOptions = queryOptions({
  queryKey: ["accessibility", "prefs"],
  queryFn: async (): Promise<AccessibilityPrefs | null> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const { data, error } = await supabase
      .from("accessibility_preferences")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { ...defaultPrefs };
    return {
      screen_reader: data.screen_reader,
      high_contrast: data.high_contrast,
      captions: data.captions,
      keyboard_navigation: data.keyboard_navigation,
      reduced_motion: data.reduced_motion,
      remote_participation: data.remote_participation,
      accessible_venue: data.accessible_venue,
      flexible_schedule: data.flexible_schedule,
      other_accommodation: data.other_accommodation ?? "",
    };
  },
});

export async function saveAccessibilityPrefs(values: AccessibilityPrefs) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("You need to be signed in.");
  const { error } = await supabase.from("accessibility_preferences").upsert({
    id: user.id,
    ...values,
    other_accommodation: values.other_accommodation?.trim() ? values.other_accommodation.trim() : null,
  });
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/* Display settings (device-local, work signed out too)                */
/* ------------------------------------------------------------------ */

export type DisplaySettings = {
  textScale: "normal" | "large" | "xlarge";
  highContrast: boolean;
  reduceMotion: boolean;
  dyslexicFont: boolean;
  underlineLinks: boolean;
  textSpacing: boolean;
  comfortableReading: boolean;
  largeCursor: boolean;
  strongFocus: boolean;
  hideDecorativeImages: boolean;
  readingGuide: boolean;
};

export const defaultDisplaySettings: DisplaySettings = {
  textScale: "normal",
  highContrast: false,
  reduceMotion: false,
  dyslexicFont: false,
  underlineLinks: false,
  textSpacing: false,
  comfortableReading: false,
  largeCursor: false,
  strongFocus: false,
  hideDecorativeImages: false,
  readingGuide: false,
};

export const displayStorageKey = "ability360:a11y-display";

export function readDisplaySettings(): DisplaySettings {
  if (typeof window === "undefined") return defaultDisplaySettings;
  try {
    const raw = window.localStorage.getItem(displayStorageKey);
    if (!raw) return defaultDisplaySettings;
    return { ...defaultDisplaySettings, ...(JSON.parse(raw) as Partial<DisplaySettings>) };
  } catch {
    return defaultDisplaySettings;
  }
}

export function applyDisplaySettings(settings: DisplaySettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("a11y-text-large", settings.textScale === "large");
  root.classList.toggle("a11y-text-xlarge", settings.textScale === "xlarge");
  root.classList.toggle("a11y-high-contrast", settings.highContrast);
  root.classList.toggle("a11y-reduce-motion", settings.reduceMotion);
  root.classList.toggle("a11y-dyslexic", settings.dyslexicFont);
  root.classList.toggle("a11y-underline-links", settings.underlineLinks);
  root.classList.toggle("a11y-text-spacing", settings.textSpacing);
  root.classList.toggle("a11y-comfortable-reading", settings.comfortableReading);
  root.classList.toggle("a11y-large-cursor", settings.largeCursor);
  root.classList.toggle("a11y-strong-focus", settings.strongFocus);
  root.classList.toggle("a11y-hide-decorative-images", settings.hideDecorativeImages);
  root.classList.toggle("a11y-reading-guide", settings.readingGuide);
}

export function writeDisplaySettings(settings: DisplaySettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(displayStorageKey, JSON.stringify(settings));
  applyDisplaySettings(settings);
  window.dispatchEvent(new CustomEvent("ability360:a11y-change", { detail: settings }));
}

/* ------------------------------------------------------------------ */
/* Support resources for Divyangjan students (India)                   */
/* ------------------------------------------------------------------ */

export const supportResources = [
  {
    title: "UDID / Divyangjan certificate",
    body: "A Unique Disability ID unlocks reservations in education and government hiring, travel concessions and scheme benefits.",
    action: "Apply on the national UDID portal",
    href: "https://www.swavlambancard.gov.in/",
  },
  {
    title: "Scholarships for students with disabilities",
    body: "Pre-matric, post-matric, top-class education and free coaching scholarships from the Department of Empowerment of Persons with Disabilities.",
    action: "Open the National Scholarship Portal",
    href: "https://scholarships.gov.in/",
  },
  {
    title: "NHFDC skill training & loans",
    body: "Subsidised skill development programmes and concessional loans for self-employment and assistive equipment.",
    action: "Visit NHFDC",
    href: "https://nhfdc.nic.in/",
  },
  {
    title: "Your rights at work (RPwD Act 2016)",
    body: "4% reservation in government jobs, reasonable accommodation, and non-discrimination in private workplaces.",
    action: "Read the Act summary",
    href: "https://depwd.gov.in/rights-of-persons-with-disabilities-act-2016/",
  },
  {
    title: "Assistive technology (ADIP scheme)",
    body: "Free or subsidised aids and appliances — screen readers, hearing aids, mobility devices — through ADIP camps.",
    action: "Check ADIP",
    href: "https://depwd.gov.in/adip/",
  },
  {
    title: "Exam accommodations",
    body: "Scribes, extra time (20 minutes per hour), separate rooms and compensatory formats are your right in most Indian exams.",
    action: "Ask your institution's coordinator",
    href: null,
  },
] as const;

export const interviewTips = [
  "Request accommodations in writing after the interview invite — scribe, interpreter, extra time or a remote round.",
  "Prepare a one-line description of how you work best, not a medical history. Disclosure is always your choice.",
  "Test assistive tech with the meeting platform a day before the interview.",
  "Ask about step-free access, washrooms and transport before an on-site round.",
  "Keep your UDID and any accommodation letters ready as PDFs in your Student DNA.",
];
