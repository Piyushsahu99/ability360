import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gradeMockTest } from "@/lib/mock-tests.server";

const submitSchema = z.object({
  testId: z.string().uuid(),
  secondsUsed: z.number().int().min(0).max(24 * 60 * 60),
  extraTime: z.boolean(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        choice: z.number().int().min(0).max(9).nullable(),
      }),
    )
    .min(1)
    .max(100),
});

export const submitMockTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data, context }) =>
    gradeMockTest(context.userId, data.testId, data.answers, data.secondsUsed, data.extraTime),
  );
