CREATE OR REPLACE FUNCTION private.skill_demand_overview()
RETURNS TABLE (
  skill_id uuid,
  skill_name text,
  category public.skill_category,
  demand_count bigint,
  recent_count bigint,
  prior_count bigint,
  student_supply bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inst AS (
    SELECT private.user_institution(auth.uid()) AS institution_id
  ),
  demand AS (
    SELECT os.skill_id,
           count(*)::bigint AS demand_count,
           count(*) FILTER (WHERE o.created_at >= now() - interval '90 days')::bigint AS recent_count,
           count(*) FILTER (WHERE o.created_at < now() - interval '90 days'
                              AND o.created_at >= now() - interval '180 days')::bigint AS prior_count
    FROM public.opportunity_skills os
    JOIN public.opportunities o ON o.id = os.opportunity_id
    WHERE o.is_published = true
    GROUP BY os.skill_id
  ),
  supply AS (
    SELECT ss.skill_id, count(DISTINCT ss.student_id)::bigint AS student_supply
    FROM public.student_skills ss
    JOIN public.profiles p ON p.id = ss.student_id
    CROSS JOIN inst
    WHERE inst.institution_id IS NULL OR p.institution_id = inst.institution_id
    GROUP BY ss.skill_id
  )
  SELECT s.id, s.name, s.category,
         COALESCE(d.demand_count, 0),
         COALESCE(d.recent_count, 0),
         COALESCE(d.prior_count, 0),
         COALESCE(sp.student_supply, 0)
  FROM public.skills s
  LEFT JOIN demand d ON d.skill_id = s.id
  LEFT JOIN supply sp ON sp.skill_id = s.id
  WHERE COALESCE(d.demand_count, 0) > 0
  ORDER BY COALESCE(d.demand_count, 0) DESC, s.name;
$$;

REVOKE EXECUTE ON FUNCTION private.skill_demand_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.skill_demand_overview() TO authenticated;

CREATE OR REPLACE FUNCTION private.role_demand_overview()
RETURNS TABLE (
  role_title text,
  opportunity_type public.opportunity_type,
  demand_count bigint,
  employer_count bigint,
  remote_share numeric,
  inclusive_share numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT initcap(btrim(o.title)) AS role_title,
         (array_agg(o.type ORDER BY o.created_at DESC))[1] AS opportunity_type,
         count(*)::bigint AS demand_count,
         count(DISTINCT lower(btrim(o.organisation)))::bigint AS employer_count,
         round(avg(CASE WHEN o.mode IN ('remote','hybrid') THEN 1 ELSE 0 END)::numeric, 2) AS remote_share,
         round(avg(CASE WHEN o.is_inclusive_employer THEN 1 ELSE 0 END)::numeric, 2) AS inclusive_share
  FROM public.opportunities o
  WHERE o.is_published = true
  GROUP BY initcap(btrim(o.title))
  ORDER BY count(*) DESC, initcap(btrim(o.title));
$$;

REVOKE EXECUTE ON FUNCTION private.role_demand_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.role_demand_overview() TO authenticated;

CREATE OR REPLACE FUNCTION public.skill_demand_overview()
RETURNS TABLE (
  skill_id uuid,
  skill_name text,
  category public.skill_category,
  demand_count bigint,
  recent_count bigint,
  prior_count bigint,
  student_supply bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$ SELECT * FROM private.skill_demand_overview() $$;

CREATE OR REPLACE FUNCTION public.role_demand_overview()
RETURNS TABLE (
  role_title text,
  opportunity_type public.opportunity_type,
  demand_count bigint,
  employer_count bigint,
  remote_share numeric,
  inclusive_share numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$ SELECT * FROM private.role_demand_overview() $$;