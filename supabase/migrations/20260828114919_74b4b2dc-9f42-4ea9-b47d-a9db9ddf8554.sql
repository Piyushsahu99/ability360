CREATE TABLE public.roadmap_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  task_key text not null,
  role_id uuid references public.career_roles(id) on delete set null,
  completed_at timestamptz not null default now(),
  unique (student_id, task_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_progress TO authenticated;
GRANT ALL ON public.roadmap_progress TO service_role;

ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own roadmap progress" ON public.roadmap_progress
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students insert own roadmap progress" ON public.roadmap_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students delete own roadmap progress" ON public.roadmap_progress
  FOR DELETE TO authenticated USING (auth.uid() = student_id);