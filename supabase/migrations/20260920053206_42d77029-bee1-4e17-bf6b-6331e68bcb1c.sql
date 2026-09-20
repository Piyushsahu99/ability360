CREATE TABLE public.student_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 600),
  category text NOT NULL DEFAULT 'career' CHECK (category IN ('career', 'skill', 'learning', 'application', 'personal')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  priority smallint NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  target_date date,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_goals TO authenticated;
GRANT ALL ON public.student_goals TO service_role;

ALTER TABLE public.student_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own goals"
ON public.student_goals FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can create own goals"
ON public.student_goals FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own goals"
ON public.student_goals FOR UPDATE TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can delete own goals"
ON public.student_goals FOR DELETE TO authenticated
USING (student_id = auth.uid());

CREATE INDEX student_goals_student_status_priority_idx
ON public.student_goals (student_id, status, priority, target_date);

CREATE TRIGGER set_student_goals_updated_at
BEFORE UPDATE ON public.student_goals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();