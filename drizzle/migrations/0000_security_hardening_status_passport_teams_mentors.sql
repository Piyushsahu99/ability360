CREATE OR REPLACE FUNCTION public.guard_student_application_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF auth.uid() = NEW.student_id
     AND NOT public.has_role(auth.uid(), 'admin')
     AND NOT EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = NEW.opportunity_id AND o.posted_by = auth.uid()) THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.status NOT IN ('saved','preparing','applied') THEN
        RAISE EXCEPTION 'Students can only save, prepare or apply';
      END IF;
      NEW.employer_feedback := NULL; NEW.employer_rating := NULL; NEW.interview_at := NULL;
    ELSE
      IF NEW.status IS DISTINCT FROM OLD.status
         AND NEW.status NOT IN ('saved','preparing','applied','rejected') THEN
        RAISE EXCEPTION 'Only the employer can move an application to this stage';
      END IF;
      IF NEW.status IS DISTINCT FROM OLD.status AND OLD.status IN ('shortlisted','interview','selected','completed')
         AND NEW.status <> 'rejected' THEN
        RAISE EXCEPTION 'Only the employer can change this stage';
      END IF;
      NEW.employer_feedback := OLD.employer_feedback;
      NEW.employer_rating := OLD.employer_rating;
      NEW.interview_at := OLD.interview_at;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS opportunity_applications_guard_status ON public.opportunity_applications;
CREATE TRIGGER opportunity_applications_guard_status
BEFORE INSERT OR UPDATE ON public.opportunity_applications
FOR EACH ROW EXECUTE FUNCTION public.guard_student_application_status();

CREATE OR REPLACE FUNCTION public.passport_shares(_student uuid, _key text)
RETURNS boolean LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT COALESCE((SELECT (ps.categories ->> _key)::boolean FROM public.passport_sharing ps WHERE ps.student_id = _student), true)
$$;

DROP POLICY IF EXISTS student_skills_select_applicants ON public.student_skills;
CREATE POLICY student_skills_select_applicants ON public.student_skills FOR SELECT TO authenticated
USING (public.is_applicant_of(auth.uid(), student_id) AND (
  public.passport_shares(student_id, 'skills')
  OR (verification_status <> 'self_declared' AND public.passport_shares(student_id, 'verified_skills'))));

DROP POLICY IF EXISTS student_projects_select_applicants ON public.student_projects;
CREATE POLICY student_projects_select_applicants ON public.student_projects FOR SELECT TO authenticated
USING (public.is_applicant_of(auth.uid(), student_id) AND public.passport_shares(student_id, 'projects'));

DROP POLICY IF EXISTS student_experiences_select_applicants ON public.student_experiences;
CREATE POLICY student_experiences_select_applicants ON public.student_experiences FOR SELECT TO authenticated
USING (public.is_applicant_of(auth.uid(), student_id) AND public.passport_shares(student_id, 'internships'));

DROP POLICY IF EXISTS student_achievements_select_applicants ON public.student_achievements;
CREATE POLICY student_achievements_select_applicants ON public.student_achievements FOR SELECT TO authenticated
USING (public.is_applicant_of(auth.uid(), student_id) AND public.passport_shares(student_id,
  CASE WHEN competition_id IS NOT NULL OR category = 'competition' THEN 'competitions'
       WHEN category ILIKE 'certif%' THEN 'certifications'
       ELSE 'achievements' END));

DROP POLICY IF EXISTS team_members_select ON public.competition_team_members;
CREATE POLICY team_members_select ON public.competition_team_members FOR SELECT TO authenticated
USING (
  student_id = auth.uid()
  OR public.is_team_member(auth.uid(), team_id)
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.competition_teams t WHERE t.id = team_id
             AND (public.is_competition_owner(auth.uid(), t.competition_id)
                  OR public.is_competition_judge(auth.uid(), t.competition_id)))
);

DROP POLICY IF EXISTS mentor_profiles_select ON public.mentor_profiles;
CREATE POLICY mentor_profiles_select ON public.mentor_profiles FOR SELECT TO authenticated
USING (
  accepts_requests
  OR id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.mentorship_requests r WHERE r.mentor_id = mentor_profiles.id AND r.student_id = auth.uid())
);

DROP POLICY IF EXISTS crawl_sources_select_authenticated ON public.crawl_sources;

DROP POLICY IF EXISTS application_documents_allowed_types ON storage.objects;
CREATE POLICY application_documents_allowed_types ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (bucket_id <> 'application-documents'
  OR lower(storage.extension(name)) IN ('pdf','doc','docx','png','jpg','jpeg','webp','txt'));