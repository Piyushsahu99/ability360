CREATE TABLE public.company_contacts (
  id uuid PRIMARY KEY REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  hiring_contact_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_contacts TO authenticated;
GRANT ALL ON public.company_contacts TO service_role;

ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_contacts_select_own ON public.company_contacts
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY company_contacts_insert_own ON public.company_contacts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY company_contacts_update_own ON public.company_contacts
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER company_contacts_set_updated_at
  BEFORE UPDATE ON public.company_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.company_contacts (id, hiring_contact_email)
SELECT id, hiring_contact_email FROM public.company_profiles
WHERE hiring_contact_email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.company_profiles DROP COLUMN hiring_contact_email;

CREATE TABLE public.company_contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  subject text NOT NULL,
  body text NOT NULL,
  reply_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX company_contact_messages_company_idx ON public.company_contact_messages (company_id, created_at DESC);
CREATE INDEX company_contact_messages_student_idx ON public.company_contact_messages (student_id, created_at DESC);

GRANT SELECT, INSERT ON public.company_contact_messages TO authenticated;
GRANT ALL ON public.company_contact_messages TO service_role;

ALTER TABLE public.company_contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_contact_messages_insert_student ON public.company_contact_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY company_contact_messages_select_participants ON public.company_contact_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = company_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER company_contact_messages_set_updated_at
  BEFORE UPDATE ON public.company_contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();