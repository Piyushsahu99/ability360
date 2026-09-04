CREATE OR REPLACE FUNCTION private.institution_directory(_viewer uuid)
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
  onboarding_completed boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  WITH ctx AS (
    SELECT private.has_any_role(_viewer, ARRAY['institution','faculty','gov_admin','admin']::public.app_role[]) AS ok,
           private.has_role(_viewer, 'admin'::public.app_role) AS is_admin,
           private.user_institution(_viewer) AS inst
  ),
  students AS (
    SELECT p.id, p.full_name, p.department, p.year_of_study
    FROM public.profiles p, ctx
    WHERE ctx.ok
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'student')
      AND (ctx.is_admin OR (p.institution_id IS NOT NULL AND p.institution_id = ctx.inst))
  )
  SELECT
    s.id,
    s.full_name,
    s.department,
    s.year_of_study,
    sp.degree,
    sp.semester,
    sp.academic_score,
    sp.career_goal,
    cr.title,
    cr.course,
    cr.branch,
    COALESCE(sk.total, 0),
    COALESCE(sk.verified, 0),
    COALESCE(
      CASE WHEN cr.id IS NULL OR array_length(cr.skills, 1) IS NULL THEN 0
      ELSE (
        SELECT ROUND(100.0 * COUNT(*) FILTER (
                 WHERE EXISTS (
                   SELECT 1 FROM public.student_skills ss2
                   JOIN public.skills k2 ON k2.id = ss2.skill_id
                   WHERE ss2.student_id = s.id AND lower(btrim(k2.name)) = lower(btrim(rs))
                 )) / GREATEST(COUNT(*), 1))
        FROM unnest(cr.skills) AS rs
      ) END, 0)::smallint,
    COALESCE(rp.done, 0),
    COALESCE(ap.total, 0),
    COALESCE(ap.active, 0),
    COALESCE(ap.interviews, 0),
    COALESCE(ap.internships, 0),
    COALESCE(ap.placements, 0),
    sp.onboarding_completed_at IS NOT NULL
  FROM students s
  LEFT JOIN public.student_profiles sp ON sp.id = s.id
  LEFT JOIN public.career_roles cr ON cr.id = sp.target_role_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total,
           COUNT(*) FILTER (WHERE ss.verification_status <> 'self_declared') AS verified
    FROM public.student_skills ss WHERE ss.student_id = s.id
  ) sk ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS done FROM public.roadmap_progress r WHERE r.student_id = s.id
  ) rp ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*) FILTER (WHERE a.status <> 'saved') AS total,
           COUNT(*) FILTER (WHERE a.status IN ('preparing','applied','shortlisted','interview')) AS active,
           COUNT(*) FILTER (WHERE a.status = 'interview') AS interviews,
           COUNT(*) FILTER (WHERE o.type = 'internship' AND a.status IN ('selected','completed')) AS internships,
           COUNT(*) FILTER (WHERE a.status IN ('selected','completed')) AS placements
    FROM public.opportunity_applications a
    JOIN public.opportunities o ON o.id = a.opportunity_id
    WHERE a.student_id = s.id
  ) ap ON TRUE
$$;

REVOKE ALL ON FUNCTION private.institution_directory(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.institution_directory(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.institution_directory()
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
  onboarding_completed boolean
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$ SELECT * FROM private.institution_directory(auth.uid()) $$;

REVOKE ALL ON FUNCTION public.institution_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.institution_directory() TO authenticated;

CREATE OR REPLACE FUNCTION private.institution_partnerships(_viewer uuid)
RETURNS TABLE(
  organisation text,
  opportunity_count bigint,
  applications bigint,
  shortlisted bigint,
  interviews bigint,
  offers bigint,
  inclusive boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  WITH ctx AS (
    SELECT private.has_any_role(_viewer, ARRAY['institution','faculty','gov_admin','admin']::public.app_role[]) AS ok,
           private.has_role(_viewer, 'admin'::public.app_role) AS is_admin,
           private.user_institution(_viewer) AS inst
  ),
  students AS (
    SELECT p.id FROM public.profiles p, ctx
    WHERE ctx.ok AND (ctx.is_admin OR (p.institution_id IS NOT NULL AND p.institution_id = ctx.inst))
  )
  SELECT o.organisation,
         COUNT(DISTINCT o.id),
         COUNT(a.id) FILTER (WHERE a.status <> 'saved'),
         COUNT(a.id) FILTER (WHERE a.status = 'shortlisted'),
         COUNT(a.id) FILTER (WHERE a.status = 'interview'),
         COUNT(a.id) FILTER (WHERE a.status IN ('selected','completed')),
         bool_or(o.is_inclusive_employer)
  FROM public.opportunities o
  LEFT JOIN public.opportunity_applications a
    ON a.opportunity_id = o.id AND a.student_id IN (SELECT id FROM students)
  WHERE o.is_published AND EXISTS (SELECT 1 FROM ctx WHERE ctx.ok)
  GROUP BY o.organisation
$$;

REVOKE ALL ON FUNCTION private.institution_partnerships(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.institution_partnerships(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.institution_partnerships()
RETURNS TABLE(
  organisation text,
  opportunity_count bigint,
  applications bigint,
  shortlisted bigint,
  interviews bigint,
  offers bigint,
  inclusive boolean
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$ SELECT * FROM private.institution_partnerships(auth.uid()) $$;

REVOKE ALL ON FUNCTION public.institution_partnerships() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.institution_partnerships() TO authenticated;