DROP POLICY IF EXISTS resources_select_published ON public.resources;

CREATE POLICY resources_select_published
  ON public.resources FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY resources_select_admin
  ON public.resources FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));