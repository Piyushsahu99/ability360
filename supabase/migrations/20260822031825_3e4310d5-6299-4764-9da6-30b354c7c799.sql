CREATE TYPE public.app_role AS ENUM ('student', 'industry', 'institution', 'admin');
CREATE TYPE public.opportunity_type AS ENUM ('internship', 'job', 'project', 'training');
CREATE TYPE public.work_mode AS ENUM ('onsite', 'remote', 'hybrid');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  headline TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''))
  ON CONFLICT (id) DO NOTHING;

  BEGIN
    _role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')::public.app_role;
  EXCEPTION WHEN others THEN
    _role := 'student';
  END;

  IF _role = 'admin' THEN
    _role := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organisation TEXT NOT NULL,
  type public.opportunity_type NOT NULL DEFAULT 'internship',
  location TEXT NOT NULL DEFAULT 'India',
  mode public.work_mode NOT NULL DEFAULT 'onsite',
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  stipend TEXT,
  deadline DATE,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunities_public_read" ON public.opportunities FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "opportunities_owner_read" ON public.opportunities FOR SELECT TO authenticated USING (auth.uid() = posted_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "opportunities_insert" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (auth.uid() = posted_by AND (public.has_role(auth.uid(), 'industry') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "opportunities_update_own" ON public.opportunities FOR UPDATE TO authenticated USING (auth.uid() = posted_by OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = posted_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "opportunities_delete_own" ON public.opportunities FOR DELETE TO authenticated USING (auth.uid() = posted_by OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER opportunities_set_updated_at BEFORE UPDATE ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.opportunities (title, organisation, type, location, mode, description, tags, stipend, deadline) VALUES
('Frontend Engineering Intern', 'Nexora Labs', 'internship', 'Bengaluru, KA', 'hybrid', 'Build accessible product interfaces with React and TypeScript alongside a senior design-systems team.', ARRAY['React','TypeScript','Accessibility'], 'INR 30,000 / month', CURRENT_DATE + 24),
('Data Analyst Trainee', 'Meridian Analytics', 'training', 'Pune, MH', 'onsite', 'Twelve-week structured training on SQL, Python and dashboarding with a guaranteed capstone project.', ARRAY['SQL','Python','Dashboards'], 'INR 18,000 / month', CURRENT_DATE + 12),
('Junior Backend Developer', 'Fintrail Systems', 'job', 'Hyderabad, TS', 'onsite', 'Own API endpoints and database work for a payments platform serving 2M+ monthly transactions.', ARRAY['Node.js','PostgreSQL','APIs'], 'INR 9 LPA', CURRENT_DATE + 30),
('Campus Research Project: Smart Grids', 'IIT Roorkee Energy Lab', 'project', 'Roorkee, UK', 'remote', 'Semester-long research collaboration modelling demand response for distributed solar networks.', ARRAY['Research','Python','Energy'], 'Stipend + credits', CURRENT_DATE + 18),
('UX Design Intern', 'Kalpa Studio', 'internship', 'Remote, India', 'remote', 'Run usability studies and ship WCAG-compliant flows for a health-tech product used by clinics.', ARRAY['Figma','User Research','WCAG'], 'INR 25,000 / month', CURRENT_DATE + 9),
('Quality Engineering Associate', 'Auralite Manufacturing', 'job', 'Coimbatore, TN', 'onsite', 'Graduate role in process quality with rotations through production, metrology and supplier audits.', ARRAY['Mechanical','Six Sigma','QA'], 'INR 6.5 LPA', CURRENT_DATE + 40),
('Cloud Infrastructure Intern', 'Stratus Cloudworks', 'internship', 'Gurugram, HR', 'hybrid', 'Automate deployment pipelines and observability for a multi-tenant SaaS platform.', ARRAY['AWS','Terraform','CI/CD'], 'INR 35,000 / month', CURRENT_DATE + 21),
('Content & Community Associate', 'LearnLoop', 'job', 'Remote, India', 'remote', 'Grow a student learning community through writing, events and campus ambassador programmes.', ARRAY['Writing','Community','Events'], 'INR 5 LPA', CURRENT_DATE + 15);