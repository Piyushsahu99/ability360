
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_note text;

ALTER TABLE public.company_profiles
  DROP CONSTRAINT IF EXISTS company_profiles_verification_status_check;
ALTER TABLE public.company_profiles
  ADD CONSTRAINT company_profiles_verification_status_check
  CHECK (verification_status IN ('unverified','pending','verified','rejected'));

-- Employers may only move their own record between unverified and pending.
DROP POLICY IF EXISTS company_profiles_update_own ON public.company_profiles;
CREATE POLICY company_profiles_update_own ON public.company_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      public.has_role(auth.uid(), 'admin')
      OR verification_status IN ('unverified','pending')
    )
  );

DROP POLICY IF EXISTS company_profiles_update_admin ON public.company_profiles;
CREATE POLICY company_profiles_update_admin ON public.company_profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Employers can read the profile data of their own applicants only.
DROP POLICY IF EXISTS student_skills_select_applicants ON public.student_skills;
CREATE POLICY student_skills_select_applicants ON public.student_skills
  FOR SELECT TO authenticated
  USING (public.is_applicant_of(auth.uid(), student_id));

DROP POLICY IF EXISTS student_projects_select_applicants ON public.student_projects;
CREATE POLICY student_projects_select_applicants ON public.student_projects
  FOR SELECT TO authenticated
  USING (public.is_applicant_of(auth.uid(), student_id));

DROP POLICY IF EXISTS student_achievements_select_applicants ON public.student_achievements;
CREATE POLICY student_achievements_select_applicants ON public.student_achievements
  FOR SELECT TO authenticated
  USING (public.is_applicant_of(auth.uid(), student_id));

DROP POLICY IF EXISTS student_experiences_select_applicants ON public.student_experiences;
CREATE POLICY student_experiences_select_applicants ON public.student_experiences
  FOR SELECT TO authenticated
  USING (public.is_applicant_of(auth.uid(), student_id));

-- Verified outcome when an employer marks an application completed.
CREATE OR REPLACE FUNCTION public.sync_completion_outcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _opp public.opportunities%ROWTYPE;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    SELECT * INTO _opp FROM public.opportunities WHERE id = NEW.opportunity_id;

    INSERT INTO public.student_experiences (student_id, organisation, role, kind, start_date, end_date, description)
    SELECT NEW.student_id, _opp.organisation, _opp.title, _opp.type::text, NULL, CURRENT_DATE,
           'Completed through ABILITY360 and confirmed by the employer.'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.student_experiences e
      WHERE e.student_id = NEW.student_id
        AND e.organisation = _opp.organisation
        AND e.role = _opp.title
    );

    INSERT INTO public.student_achievements
      (student_id, title, issuer, category, achieved_on, description, verified_by, verified_at)
    SELECT NEW.student_id,
           'Completed ' || _opp.title,
           _opp.organisation,
           'experience',
           CURRENT_DATE,
           'Verified completion confirmed by the employer through ABILITY360.',
           _opp.posted_by,
           now()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.student_achievements a
      WHERE a.student_id = NEW.student_id
        AND a.title = 'Completed ' || _opp.title
        AND a.issuer = _opp.organisation
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_completion_outcome() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS opportunity_applications_completion ON public.opportunity_applications;
CREATE TRIGGER opportunity_applications_completion
  AFTER UPDATE ON public.opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_completion_outcome();
