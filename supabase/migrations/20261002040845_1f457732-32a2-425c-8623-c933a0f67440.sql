CREATE TABLE public.sathi_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat' CHECK (char_length(title) <= 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sathi_threads_user_idx ON public.sathi_threads(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sathi_threads TO authenticated;
GRANT ALL ON public.sathi_threads TO service_role;
ALTER TABLE public.sathi_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own Sathi threads" ON public.sathi_threads FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.sathi_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.sathi_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ui_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  message jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, ui_id)
);
CREATE INDEX sathi_messages_thread_idx ON public.sathi_messages(thread_id, created_at);
CREATE INDEX sathi_messages_user_idx ON public.sathi_messages(user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.sathi_messages TO authenticated;
GRANT ALL ON public.sathi_messages TO service_role;
ALTER TABLE public.sathi_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own Sathi messages" ON public.sathi_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Add own Sathi messages" ON public.sathi_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sathi_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "Delete own Sathi messages" ON public.sathi_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());