CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  organisation text NOT NULL DEFAULT '',
  link text,
  tags text[] NOT NULL DEFAULT '{}',
  audience text[] NOT NULL DEFAULT '{}',
  eligibility text NOT NULL DEFAULT '',
  benefit text NOT NULL DEFAULT '',
  deadline_label text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT 'All India',
  image_key text NOT NULL DEFAULT 'programs',
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resources_category_check CHECK (category IN ('program','scholarship','divyangjan','blog','exam'))
);

GRANT SELECT ON public.resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY resources_select_published ON public.resources
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY resources_insert_admin ON public.resources
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY resources_update_admin ON public.resources
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY resources_delete_admin ON public.resources
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX resources_category_idx ON public.resources (category);

CREATE TRIGGER resources_set_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();