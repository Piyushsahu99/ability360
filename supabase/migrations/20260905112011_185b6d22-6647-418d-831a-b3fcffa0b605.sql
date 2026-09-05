-- 1. Assignments
CREATE TABLE public.faculty_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cohort_label text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (faculty_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty_assignments TO authenticated;
GRANT ALL ON public.faculty_assignments TO service_role;
ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faculty_assignments_select" ON public.faculty_assignments
FOR SELECT TO authenticated
USING (
  faculty_id = auth.uid()
  OR student_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['institution','admin']::public.app_role[])
);
CREATE POLICY "faculty_assignments_insert" ON public.faculty_assignments
FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['institution','admin']::public.app_role[]));
CREATE POLICY "faculty_assignments_update" ON public.faculty_assignments
FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['institution','admin']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['institution','admin']::public.app_role[]));
CREATE POLICY "faculty_assignments_delete" ON public.faculty_assignments
FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['institution','admin']::public.app_role[]));

-- 2. Faculty scope helper
CREATE OR REPLACE FUNCTION private.is_faculty_of(_faculty uuid, _student uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT _faculty IS NOT NULL AND _student IS NOT NULL AND (
    private.has_role(_faculty, 'admin'::public.app_role)
    OR (
      private.has_role(_faculty, 'faculty'::public.app_role)
      AND EXISTS (
        SELECT 1 FROM public.profiles fp, public.profiles sp
        WHERE fp.id = _faculty AND sp.id = _student
          AND fp.institution_id IS NOT NULL
          AND fp.institution_id = sp.institution_id
          AND (
            EXISTS (SELECT 1 FROM public.faculty_assignments fa
                    WHERE fa.faculty_id = _faculty AND fa.student_id = _student)
            OR (fp.department IS NOT NULL AND fp.department = sp.department)
          )
      )
    )
  )
$$;

REVOKE ALL ON FUNCTION private.is_faculty_of(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_faculty_of(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_faculty_of(_faculty uuid, _student uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT private.is_faculty_of(_faculty, _student) $$;

-- 3. Feedback
CREATE TABLE public.faculty_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_kind text NOT NULL DEFAULT 'general',
  subject_label text,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty_feedback TO authenticated;
GRANT ALL ON public.faculty_feedback TO service_role;
ALTER TABLE public.faculty_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faculty_feedback_select" ON public.faculty_feedback
FOR SELECT TO authenticated
USING (student_id = auth.uid() OR faculty_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "faculty_feedback_insert" ON public.faculty_feedback
FOR INSERT TO authenticated
WITH CHECK (faculty_id = auth.uid() AND public.is_faculty_of(auth.uid(), student_id));
CREATE POLICY "faculty_feedback_update" ON public.faculty_feedback
FOR UPDATE TO authenticated
USING (faculty_id = auth.uid()) WITH CHECK (faculty_id = auth.uid());
CREATE POLICY "faculty_feedback_delete" ON public.faculty_feedback
FOR DELETE TO authenticated USING (faculty_id = auth.uid());

CREATE TRIGGER faculty_feedback_set_updated_at
BEFORE UPDATE ON public.faculty_feedback
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Recommendations
CREATE TABLE public.faculty_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (faculty_id, student_id, opportunity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty_recommendations TO authenticated;
GRANT ALL ON public.faculty_recommendations TO service_role;
ALTER TABLE public.faculty_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faculty_recommendations_select" ON public.faculty_recommendations
FOR SELECT TO authenticated
USING (student_id = auth.uid() OR faculty_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "faculty_recommendations_insert" ON public.faculty_recommendations
FOR INSERT TO authenticated
WITH CHECK (faculty_id = auth.uid() AND public.is_faculty_of(auth.uid(), student_id));
CREATE POLICY "faculty_recommendations_delete" ON public.faculty_recommendations
FOR DELETE TO authenticated USING (faculty_id = auth.uid());

-- 5. Project verification columns
ALTER TABLE public.student_projects
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- 6. Faculty read/verify policies on student data
CREATE POLICY "student_skills_select_faculty" ON public.student_skills
FOR SELECT TO authenticated USING (public.is_faculty_of(auth.uid(), student_id));
CREATE POLICY "student_skills_update_faculty" ON public.student_skills
FOR UPDATE TO authenticated
USING (public.is_faculty_of(auth.uid(), student_id))
WITH CHECK (public.is_faculty_of(auth.uid(), student_id));

CREATE POLICY "student_projects_select_faculty" ON public.student_projects
FOR SELECT TO authenticated USING (public.is_faculty_of(auth.uid(), student_id));
CREATE POLICY "student_projects_update_faculty" ON public.student_projects
FOR UPDATE TO authenticated
USING (public.is_faculty_of(auth.uid(), student_id))
WITH CHECK (public.is_faculty_of(auth.uid(), student_id));

CREATE POLICY "roadmap_progress_select_faculty" ON public.roadmap_progress
FOR SELECT TO authenticated USING (public.is_faculty_of(auth.uid(), student_id));

CREATE POLICY "assessment_attempts_select_faculty" ON public.assessment_attempts
FOR SELECT TO authenticated USING (public.is_faculty_of(auth.uid(), student_id));

CREATE POLICY "student_profiles_select_faculty" ON public.student_profiles
FOR SELECT TO authenticated USING (public.is_faculty_of(auth.uid(), id));

CREATE POLICY "profiles_select_faculty" ON public.profiles
FOR SELECT TO authenticated USING (public.is_faculty_of(auth.uid(), id));

-- 7. Faculty student directory
CREATE OR REPLACE FUNCTION private.faculty_directory(_viewer uuid)
RETURNS TABLE(
  student_id uuid,
  full_name text,
  department text,
  year_of_study smallint,
  degree text,
  semester smallint,
  academic_score numeric,
  career_goal text,
  target_role_title text,
  target_role_course text,
  target_role_branch text,
  skills_total bigint,
  skills_verified bigint,
  readiness smallint,
  roadmap_completed bigint,
  applications_total bigint,
  applications_active bigint,
  interviews bigint,
  internships bigint,
  placements bigint,
  onboarding_completed boolean,
  assigned boolean,
  cohort_label text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT d.*,
         fa.id IS NOT NULL AS assigned,
         fa.cohort_label
  FROM private.institution_directory(_viewer) d
  LEFT JOIN public.faculty_assignments fa
    ON fa.faculty_id = _viewer AND fa.student_id = d.student_id
  WHERE private.has_any_role(_viewer, ARRAY['faculty','admin']::public.app_role[])
    AND private.is_faculty_of(_viewer, d.student_id)
$$;

REVOKE ALL ON FUNCTION private.faculty_directory(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.faculty_directory(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.faculty_directory()
RETURNS TABLE(
  student_id uuid,
  full_name text,
  department text,
  year_of_study smallint,
  degree text,
  semester smallint,
  academic_score numeric,
  career_goal text,
  target_role_title text,
  target_role_course text,
  target_role_branch text,
  skills_total bigint,
  skills_verified bigint,
  readiness smallint,
  roadmap_completed bigint,
  applications_total bigint,
  applications_active bigint,
  interviews bigint,
  internships bigint,
  placements bigint,
  onboarding_completed boolean,
  assigned boolean,
  cohort_label text
)
LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT * FROM private.faculty_directory(auth.uid()) $$;