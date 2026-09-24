import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callTool } from "@/lib/access-ai.server";

export const simplifyText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ text: z.string().trim().min(20).max(6000) }).parse(d))
  .handler(async ({ data }) =>
    callTool<{ summary: string; points: string[] }>({
      system:
        "Rewrite web page text in plain, simple English (reading age about 12). Keep every fact. Never add information. Short sentences.",
      user: data.text,
      toolName: "simplified",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "2-3 sentence plain summary" },
          points: { type: "array", items: { type: "string" }, description: "Up to 8 key points, one short sentence each" },
        },
        required: ["summary", "points"],
        additionalProperties: false,
      },
    }),
  );

export const suggestSupports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ barrier: z.string().trim().min(3).max(500) }).parse(d))
  .handler(async ({ data }) =>
    callTool<{ supports: string[] }>({
      system:
        "A student describes a participation barrier in education or work. Suggest 3-5 practical participation supports an institution or employer could offer (e.g. virtual interview, captions, written checklist). Never diagnose, never mention medical conditions, never give medical advice. Each support max 8 words.",
      user: data.barrier,
      toolName: "supports",
      parameters: {
        type: "object",
        properties: { supports: { type: "array", items: { type: "string" } } },
        required: ["supports"],
        additionalProperties: false,
      },
    }),
  );

export type PracticeFeedback = {
  structure: string;
  relevance: string;
  completeness: string;
  technical: string;
  organisation: string;
  star: { situation: boolean; task: boolean; action: boolean; result: boolean };
  next_step: string;
};

export const practiceFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ question: z.string().trim().min(5).max(400), answer: z.string().trim().min(10).max(4000) }).parse(d),
  )
  .handler(async ({ data }) =>
    callTool<PracticeFeedback>({
      system:
        "You are a supportive interview practice coach for college students. Give feedback ONLY on answer structure, relevance to the question, completeness, technical content and organisation. NEVER comment on or score accent, speech differences, grammar mistakes caused by speech-to-text, voice, personality, confidence, facial expression or eye contact. The answer may be dictated; ignore transcription errors. Be specific, kind and brief (1-2 sentences per field). Encourage STAR (Situation, Task, Action, Result) where relevant.",
      user: `Question: ${data.question}\n\nAnswer: ${data.answer}`,
      toolName: "feedback",
      parameters: {
        type: "object",
        properties: {
          structure: { type: "string" },
          relevance: { type: "string" },
          completeness: { type: "string" },
          technical: { type: "string" },
          organisation: { type: "string" },
          star: {
            type: "object",
            properties: {
              situation: { type: "boolean" },
              task: { type: "boolean" },
              action: { type: "boolean" },
              result: { type: "boolean" },
            },
            required: ["situation", "task", "action", "result"],
            additionalProperties: false,
          },
          next_step: { type: "string" },
        },
        required: ["structure", "relevance", "completeness", "technical", "organisation", "star", "next_step"],
        additionalProperties: false,
      },
    }),
  );

export type VisualExplanation = {
  title: string;
  summary: string;
  layout: "flow" | "cycle" | "layers";
  nodes: { label: string; detail: string }[];
};

export const explainVisually = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ concept: z.string().trim().min(3).max(200), context: z.string().trim().max(4000).optional() }).parse(d),
  )
  .handler(async ({ data }) =>
    callTool<VisualExplanation>({
      system:
        "Explain a complex concept for a college student as an interactive diagram. Choose layout: 'flow' for sequential steps, 'cycle' for repeating processes, 'layers' for hierarchies/stacks. Give 3-7 nodes, each with a short label (max 5 words) and a plain-language detail (1-2 sentences). Keep facts accurate.",
      user: `Concept: ${data.concept}\n\nContext:\n${data.context ?? ""}`,
      toolName: "diagram",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          layout: { type: "string", enum: ["flow", "cycle", "layers"] },
          nodes: {
            type: "array",
            items: {
              type: "object",
              properties: { label: { type: "string" }, detail: { type: "string" } },
              required: ["label", "detail"],
              additionalProperties: false,
            },
          },
        },
        required: ["title", "summary", "layout", "nodes"],
        additionalProperties: false,
      },
    }),
  );
