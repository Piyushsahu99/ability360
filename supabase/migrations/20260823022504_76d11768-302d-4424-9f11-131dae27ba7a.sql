CREATE TYPE public.skill_category AS ENUM ('technical','soft','aptitude','domain');
CREATE TYPE public.skill_verification AS ENUM ('self_declared','assessment_verified','faculty_verified','industry_verified');

CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category public.skill_category NOT NULL DEFAULT 'technical',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY skills_public_read ON public.skills FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY skills_admin_insert ON public.skills FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY skills_admin_update ON public.skills FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY skills_admin_delete ON public.skills FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.student_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  degree text,
  semester smallint,
  academic_score numeric(5,2),
  academic_score_type text NOT NULL DEFAULT 'cgpa',
  career_goal text,
  preferred_location text,
  preferred_work_mode public.work_mode,
  preferred_industries text[] NOT NULL DEFAULT '{}',
  onboarding_step smallint NOT NULL DEFAULT 0,
  onboarding_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_profiles_select_own ON public.student_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY student_profiles_select_institution ON public.student_profiles FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR (
    public.has_any_role(auth.uid(), ARRAY['faculty','institution','gov_admin']::public.app_role[])
    AND public.user_institution(id) IS NOT NULL
    AND public.user_institution(id) = public.user_institution(auth.uid())
  )
);
CREATE POLICY student_profiles_insert_own ON public.student_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY student_profiles_update_own ON public.student_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER student_profiles_set_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.student_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  level smallint NOT NULL DEFAULT 1,
  verification_status public.skill_verification NOT NULL DEFAULT 'self_declared',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_skills TO authenticated;
GRANT ALL ON public.student_skills TO service_role;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_skills_select_own ON public.student_skills FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY student_skills_select_institution ON public.student_skills FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR (
    public.has_any_role(auth.uid(), ARRAY['faculty','institution','gov_admin']::public.app_role[])
    AND public.user_institution(student_id) IS NOT NULL
    AND public.user_institution(student_id) = public.user_institution(auth.uid())
  )
);
CREATE POLICY student_skills_insert_own ON public.student_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY student_skills_update_own ON public.student_skills FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY student_skills_delete_own ON public.student_skills FOR DELETE TO authenticated USING (auth.uid() = student_id);
CREATE TRIGGER student_skills_set_updated_at BEFORE UPDATE ON public.student_skills FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.student_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, interest)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_interests TO authenticated;
GRANT ALL ON public.student_interests TO service_role;
ALTER TABLE public.student_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_interests_select_own ON public.student_interests FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY student_interests_insert_own ON public.student_interests FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY student_interests_delete_own ON public.student_interests FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE TABLE public.accessibility_preferences (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  screen_reader boolean NOT NULL DEFAULT false,
  high_contrast boolean NOT NULL DEFAULT false,
  captions boolean NOT NULL DEFAULT false,
  keyboard_navigation boolean NOT NULL DEFAULT false,
  reduced_motion boolean NOT NULL DEFAULT false,
  remote_participation boolean NOT NULL DEFAULT false,
  accessible_venue boolean NOT NULL DEFAULT false,
  flexible_schedule boolean NOT NULL DEFAULT false,
  other_accommodation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accessibility_preferences TO authenticated;
GRANT ALL ON public.accessibility_preferences TO service_role;
ALTER TABLE public.accessibility_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY accessibility_preferences_select_own ON public.accessibility_preferences FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY accessibility_preferences_insert_own ON public.accessibility_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY accessibility_preferences_update_own ON public.accessibility_preferences FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY accessibility_preferences_delete_own ON public.accessibility_preferences FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER accessibility_preferences_set_updated_at BEFORE UPDATE ON public.accessibility_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.skills (name, category) VALUES
('Python','technical'),('Java','technical'),('C++','technical'),('JavaScript','technical'),
('SQL','technical'),('Data Structures & Algorithms','technical'),('Machine Learning','technical'),
('Data Visualisation','technical'),('Excel & Spreadsheets','technical'),('Git & Version Control','technical'),
('Cloud Fundamentals','technical'),('UI/UX Design','technical'),('Figma','technical'),
('Web Development','technical'),('Mobile App Development','technical'),('Embedded Systems','technical'),
('AutoCAD','technical'),('MATLAB','technical'),('Statistics','aptitude'),
('Quantitative Aptitude','aptitude'),('Logical Reasoning','aptitude'),('Verbal Ability','aptitude'),
('Problem Solving','aptitude'),('Communication','soft'),('Teamwork','soft'),('Leadership','soft'),
('Time Management','soft'),('Presentation Skills','soft'),('Critical Thinking','soft'),
('Adaptability','soft'),('Business Analysis','domain'),('Digital Marketing','domain'),
('Product Management','domain'),('Process Engineering','domain'),('Chemical Process Simulation','domain'),
('Quality Control','domain'),('Supply Chain Basics','domain'),('Financial Accounting','domain'),
('Research Methodology','domain'),('Technical Writing','domain');