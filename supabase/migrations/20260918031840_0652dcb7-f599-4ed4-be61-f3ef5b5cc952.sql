CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('student','employer')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_thread_idx ON public.chat_messages (company_id, student_id, created_at);
CREATE INDEX chat_messages_student_idx ON public.chat_messages (student_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read their chat"
ON public.chat_messages FOR SELECT TO authenticated
USING (auth.uid() = student_id OR auth.uid() = company_id);

CREATE POLICY "Students send in their own chat"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = student_id AND sender_id = auth.uid() AND sender_role = 'student'
);

CREATE POLICY "Employers send in their company chat"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = company_id AND sender_id = auth.uid() AND sender_role = 'employer'
);

CREATE POLICY "Participants mark messages read"
ON public.chat_messages FOR UPDATE TO authenticated
USING (auth.uid() = student_id OR auth.uid() = company_id)
WITH CHECK (auth.uid() = student_id OR auth.uid() = company_id);