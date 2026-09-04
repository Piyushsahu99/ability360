ALTER TYPE public.opportunity_type ADD VALUE IF NOT EXISTS 'apprenticeship';
ALTER TYPE public.opportunity_type ADD VALUE IF NOT EXISTS 'challenge';
ALTER TYPE public.opportunity_type ADD VALUE IF NOT EXISTS 'mentorship';

CREATE TABLE IF NOT EXISTS public.company_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  website text,
  industry text,
  company_size text,
  headquarters text,
  about text NOT NULL DEFAULT '',
  logo_url text,
  hiring_contact_email text,
  is_inclusive_employer boolean NOT NULL DEFAULT false,
  accessibility_commitment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.company_profiles TO authenticated;
GRANT SELECT ON public.company_profiles TO anon;
GRANT ALL ON public.company_profiles TO service_role;

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_profiles_public_read ON public.company_profiles
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY company_profiles_insert_own ON public.company_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY company_profiles_update_own ON public.company_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER company_profiles_set_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.opportunity_applications
  ADD COLUMN IF NOT EXISTS interview_at timestamptz,
  ADD COLUMN IF NOT EXISTS employer_feedback text,
  ADD COLUMN IF NOT EXISTS employer_rating smallint;

CREATE OR REPLACE FUNCTION private.is_applicant_of(_poster uuid, _student uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.opportunity_applications a
    JOIN public.opportunities o ON o.id = a.opportunity_id
    WHERE o.posted_by = _poster
      AND a.student_id = _student
      AND a.status <> 'saved'
  )
$$;

REVOKE ALL ON FUNCTION private.is_applicant_of(uuid, uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.is_applicant_of(_poster uuid, _student uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$ SELECT private.is_applicant_of(_poster, _student) $$;

GRANT EXECUTE ON FUNCTION public.is_applicant_of(uuid, uuid) TO authenticated;

CREATE POLICY profiles_select_applicants ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_applicant_of(auth.uid(), id));

CREATE POLICY student_profiles_select_applicants ON public.student_profiles
  FOR SELECT TO authenticated
  USING (public.is_applicant_of(auth.uid(), id));

CREATE POLICY application_documents_select_poster ON public.application_documents
  FOR SELECT TO authenticated
  USING (public.is_applicant_of(auth.uid(), student_id));