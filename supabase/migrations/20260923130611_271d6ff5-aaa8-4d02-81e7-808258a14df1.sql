ALTER FUNCTION public.is_application_poster(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.shared_accessibility_for(uuid) SET SCHEMA private;
REVOKE EXECUTE ON FUNCTION private.is_application_poster(uuid, uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION private.shared_accessibility_for(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION private.is_application_poster(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.shared_accessibility_for(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_application_poster(_user uuid, _application uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT private.is_application_poster(_user, _application) $$;

CREATE OR REPLACE FUNCTION public.shared_accessibility_for(_student uuid)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT private.shared_accessibility_for(_student) $$;

REVOKE EXECUTE ON FUNCTION public.shared_accessibility_for(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shared_accessibility_for(uuid) TO authenticated;