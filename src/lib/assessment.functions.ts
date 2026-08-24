import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gradeAttempt } from "@/lib/assessment.server";

const submitSchema = z.object({
  category: z.enum(["technical", "soft", "aptitude", "domain"]),
  answers: z
    .array(z.object({ questionId: z.string().uuid(), choice: z.number().int().min(0).max(9) }))
    .min(1)
    .max(50),
});

export const submitAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data, context }) => gradeAttempt(context.userId, data.category, data.answers));
