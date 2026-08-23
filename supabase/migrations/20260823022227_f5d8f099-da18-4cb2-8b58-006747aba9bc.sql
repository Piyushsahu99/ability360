-- Institutions
CREATE TYPE public.institution_type AS ENUM ('college', 'university', 'polytechnic', 'other');

CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  type public.institution_type NOT NULL DEFAULT 'college',
  city text,
  state text,
  website text,
  is_verified boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.institutions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institutions TO authenticated;
GRANT ALL ON public.institutions TO service_role;

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER institutions_set_updated_at
BEFORE UPDATE ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Profile extensions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS year_of_study smallint,
  ADD COLUMN IF NOT EXISTS phone text;

-- Helper functions (security definer, no recursion)
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.user_institution(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE id = _user_id
$$;

REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_institution(uuid) FROM public, anon, authenticated;

-- Institution policies
CREATE POLICY institutions_public_read ON public.institutions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY institutions_insert ON public.institutions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.has_any_role(auth.uid(), ARRAY['institution','admin']::public.app_role[])
  );

CREATE POLICY institutions_update ON public.institutions
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gov_admin')
    OR (public.has_role(auth.uid(), 'institution') AND id = public.user_institution(auth.uid()))
    OR (public.has_role(auth.uid(), 'institution') AND created_by = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gov_admin')
    OR (public.has_role(auth.uid(), 'institution') AND is_verified = false)
  );

CREATE POLICY institutions_delete ON public.institutions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: institution-scoped and super admin reads
CREATE POLICY profiles_select_institution ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      institution_id IS NOT NULL
      AND institution_id = public.user_institution(auth.uid())
      AND public.has_any_role(auth.uid(), ARRAY['faculty','institution','gov_admin']::public.app_role[])
    )
  );

-- user_roles: only super admin may write
CREATE POLICY user_roles_select_admin ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY user_roles_admin_insert ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY user_roles_admin_update ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY user_roles_admin_delete ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Opportunities: organizers may post too
DROP POLICY IF EXISTS opportunities_insert ON public.opportunities;
CREATE POLICY opportunities_insert ON public.opportunities
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = posted_by
    AND public.has_any_role(auth.uid(), ARRAY['industry','organizer','admin']::public.app_role[])
  );

-- Signup trigger: whitelist self-selectable roles, accept institution_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _role public.app_role;
  _institution uuid;
BEGIN
  BEGIN
    _institution := NULLIF(NEW.raw_user_meta_data ->> 'institution_id', '')::uuid;
  EXCEPTION WHEN others THEN
    _institution := NULL;
  END;

  INSERT INTO public.profiles (id, full_name, institution_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), _institution)
  ON CONFLICT (id) DO NOTHING;

  BEGIN
    _role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')::public.app_role;
  EXCEPTION WHEN others THEN
    _role := 'student';
  END;

  -- Only these roles may ever be self-selected at registration.
  IF _role NOT IN ('student', 'industry', 'institution') THEN
    _role := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;