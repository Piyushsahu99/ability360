DROP POLICY IF EXISTS competitions_select_public ON public.competitions;

CREATE POLICY competitions_select_published ON public.competitions FOR SELECT
  USING (is_published = true);

CREATE POLICY competitions_select_owner ON public.competitions FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));