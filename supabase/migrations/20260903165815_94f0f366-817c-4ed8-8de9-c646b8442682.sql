CREATE TYPE public.application_status AS ENUM ('saved','preparing','applied','shortlisted','interview','selected','rejected','completed');
CREATE TYPE public.application_document_kind AS ENUM ('resume','cover_letter','certificate','portfolio','transcript','other');

CREATE TABLE public.opportunity_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'saved',
  note text NOT NULL DEFAULT '',
  applied_at timestamptz,
  deadline date,
  status_changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, opportunity_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_applications TO authenticated;
GRANT ALL ON public.opportunity_applications TO service_role;
ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own applications"
  ON public.opportunity_applications FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Poster and admin read applications"
  ON public.opportunity_applications FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.posted_by = auth.uid())
  );

CREATE POLICY "Poster and admin update applications"
  ON public.opportunity_applications FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.posted_by = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.posted_by = auth.uid())
  );

CREATE TRIGGER opportunity_applications_set_updated_at
  BEFORE UPDATE ON public.opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.opportunity_applications(id) ON DELETE CASCADE,
  from_status public.application_status,
  to_status public.application_status NOT NULL,
  note text NOT NULL DEFAULT '',
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.application_events TO authenticated;
GRANT ALL ON public.application_events TO service_role;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read events for visible applications"
  ON public.application_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.opportunity_applications a
    WHERE a.id = application_id
      AND (
        a.student_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = a.opportunity_id AND o.posted_by = auth.uid())
      )
  ));

CREATE POLICY "Insert events for own applications"
  ON public.application_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.opportunity_applications a
    WHERE a.id = application_id
      AND (
        a.student_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = a.opportunity_id AND o.posted_by = auth.uid())
      )
  ));

CREATE OR REPLACE FUNCTION public.log_application_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.application_events (application_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = now();
    INSERT INTO public.application_events (application_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER opportunity_applications_log_insert
  AFTER INSERT ON public.opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.log_application_status();

CREATE TRIGGER opportunity_applications_log_update
  BEFORE UPDATE ON public.opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.log_application_status();

CREATE TABLE public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.opportunity_applications(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind public.application_document_kind NOT NULL DEFAULT 'other',
  name text NOT NULL,
  storage_path text,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own application documents"
  ON public.application_documents FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Poster and admin read application documents"
  ON public.application_documents FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.opportunity_applications a
    WHERE a.id = application_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = a.opportunity_id AND o.posted_by = auth.uid())
      )
  ));

CREATE INDEX idx_applications_student ON public.opportunity_applications (student_id, status);
CREATE INDEX idx_application_events_app ON public.application_events (application_id, created_at DESC);
CREATE INDEX idx_application_documents_app ON public.application_documents (application_id);