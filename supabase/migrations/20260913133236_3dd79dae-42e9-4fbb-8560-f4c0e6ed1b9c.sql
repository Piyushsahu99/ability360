ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_domain text,
  ADD COLUMN IF NOT EXISTS auto_imported boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS resources_source_url_key ON public.resources (source_url) WHERE source_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS resources_expires_at_idx ON public.resources (expires_at);

CREATE TABLE IF NOT EXISTS public.crawl_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  label text NOT NULL,
  category text NOT NULL,
  query text NOT NULL,
  region text NOT NULL DEFAULT 'All India',
  is_active boolean NOT NULL DEFAULT true,
  last_crawled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.crawl_sources TO authenticated;
GRANT ALL ON public.crawl_sources TO service_role;
ALTER TABLE public.crawl_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crawl_sources_select_authenticated" ON public.crawl_sources
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "crawl_sources_manage_admin" ON public.crawl_sources
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.crawl_state (
  id text PRIMARY KEY,
  lease_until timestamptz,
  is_paused boolean NOT NULL DEFAULT false,
  pause_reason text,
  last_run_at timestamptz,
  last_result jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.crawl_state TO authenticated;
GRANT ALL ON public.crawl_state TO service_role;
ALTER TABLE public.crawl_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crawl_state_select_admin" ON public.crawl_state
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.crawl_state (id) VALUES ('resources') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.crawl_sources (domain, label, category, query) VALUES
  ('scholarships.gov.in', 'National Scholarship Portal', 'scholarship', 'scholarship scheme for college students last date apply'),
  ('buddy4study.com', 'Buddy4Study', 'scholarship', 'scholarship for college students India application last date'),
  ('vidyalakshmi.co.in', 'Vidya Lakshmi', 'scholarship', 'education loan and scholarship scheme students'),
  ('aicte-india.org', 'AICTE', 'program', 'internship and skilling scheme for engineering students'),
  ('ugc.gov.in', 'UGC', 'program', 'student scheme fellowship announcement'),
  ('msde.gov.in', 'Ministry of Skill Development', 'program', 'apprenticeship and skill training scheme for youth'),
  ('internship.aicte-india.org', 'AICTE Internship Portal', 'program', 'internship opportunity students apply'),
  ('depwd.gov.in', 'Department of Empowerment of Persons with Disabilities', 'divyangjan', 'scholarship scheme assistive support for divyangjan students'),
  ('nhfdc.nic.in', 'NHFDC', 'divyangjan', 'scholarship and education loan for persons with disabilities'),
  ('mygov.in', 'MyGov', 'program', 'student internship challenge programme announcement'),
  ('nta.ac.in', 'National Testing Agency', 'exam', 'examination notification registration date'),
  ('education.gov.in', 'Ministry of Education', 'blog', 'student initiative announcement higher education')
ON CONFLICT (domain) DO NOTHING;