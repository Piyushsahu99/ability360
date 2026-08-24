DROP VIEW IF EXISTS public.assessment_questions_public;

REVOKE ALL ON public.assessment_questions FROM authenticated;
GRANT SELECT (id, category, topic, prompt, options) ON public.assessment_questions TO authenticated;

CREATE POLICY assessment_questions_read_active ON public.assessment_questions
  FOR SELECT TO authenticated
  USING (is_active = true);