ALTER TABLE public.accessibility_preferences
  ADD COLUMN IF NOT EXISTS communication text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learning text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS work text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interview text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS environment text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sharing jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Employer accessibility profile
CREATE TABLE public.employer_accessibility_profiles (
  id uuid PRIMARY KEY REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  features text[] NOT NULL DEFAULT '{}',
  accessibility_contact text,
  accommodation_process text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_accessibility_profiles TO authenticated;
GRANT ALL ON public.employer_accessibility_profiles TO service_role;
ALTER TABLE public.employer_accessibility_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read employer accessibility" ON public.employer_accessibility_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Company inserts own accessibility" ON public.employer_accessibility_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Company updates own accessibility" ON public.employer_accessibility_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Company deletes own accessibility" ON public.employer_accessibility_profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER employer_accessibility_profiles_set_updated_at BEFORE UPDATE ON public.employer_accessibility_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: is the user the poster of this application's opportunity
CREATE OR REPLACE FUNCTION public.is_application_poster(_user uuid, _application uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.opportunity_applications a
    JOIN public.opportunities o ON o.id = a.opportunity_id
    WHERE a.id = _application AND o.posted_by = _user
  )
$$;

-- Application accommodations
CREATE TABLE public.application_accommodations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES public.opportunity_applications(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supports text[] NOT NULL DEFAULT '{}',
  request_text text NOT NULL CHECK (char_length(request_text) BETWEEN 10 AND 1500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','clarification','alternative','arranged','withdrawn')),
  employer_response text CHECK (employer_response IS NULL OR char_length(employer_response) <= 1500),
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX application_accommodations_student_idx ON public.application_accommodations(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_accommodations TO authenticated;
GRANT ALL ON public.application_accommodations TO service_role;
ALTER TABLE public.application_accommodations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Student reads own accommodations" ON public.application_accommodations
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Poster reads accommodations for own applications" ON public.application_accommodations
  FOR SELECT TO authenticated USING (public.is_application_poster(auth.uid(), application_id));
CREATE POLICY "Student creates accommodation for own application" ON public.application_accommodations
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = student_id AND EXISTS (
      SELECT 1 FROM public.opportunity_applications a WHERE a.id = application_id AND a.student_id = auth.uid()
    )
  );
CREATE POLICY "Student updates own accommodation" ON public.application_accommodations
  FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Poster responds to accommodation" ON public.application_accommodations
  FOR UPDATE TO authenticated USING (public.is_application_poster(auth.uid(), application_id))
  WITH CHECK (public.is_application_poster(auth.uid(), application_id));
CREATE POLICY "Student deletes own accommodation" ON public.application_accommodations
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE OR REPLACE FUNCTION public.guard_application_accommodation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM OLD.student_id THEN
    -- employers may only change status + response
    IF NEW.request_text IS DISTINCT FROM OLD.request_text
      OR NEW.supports IS DISTINCT FROM OLD.supports
      OR NEW.student_id IS DISTINCT FROM OLD.student_id
      OR NEW.application_id IS DISTINCT FROM OLD.application_id THEN
      RAISE EXCEPTION 'Only the student can edit the request';
    END IF;
    IF NEW.status = 'withdrawn' THEN
      RAISE EXCEPTION 'Only the student can withdraw';
    END IF;
  ELSE
    NEW.application_id := OLD.application_id;
    IF NEW.status NOT IN ('pending','withdrawn') AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Students can only resubmit or withdraw';
    END IF;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.history := OLD.history || jsonb_build_array(jsonb_build_object(
      'from', OLD.status, 'to', NEW.status, 'by', auth.uid(), 'at', now()));
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER application_accommodations_guard BEFORE UPDATE ON public.application_accommodations
  FOR EACH ROW EXECUTE FUNCTION public.guard_application_accommodation();

-- Barrier supports
CREATE TABLE public.accessibility_support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  barrier text NOT NULL CHECK (char_length(barrier) BETWEEN 3 AND 500),
  supports jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX accessibility_support_requests_student_idx ON public.accessibility_support_requests(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accessibility_support_requests TO authenticated;
GRANT ALL ON public.accessibility_support_requests TO service_role;
ALTER TABLE public.accessibility_support_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own barrier supports" ON public.accessibility_support_requests
  FOR ALL TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE TRIGGER accessibility_support_requests_set_updated_at BEFORE UPDATE ON public.accessibility_support_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Passport sharing
CREATE TABLE public.passport_sharing (
  student_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.passport_sharing TO authenticated;
GRANT ALL ON public.passport_sharing TO service_role;
ALTER TABLE public.passport_sharing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own passport sharing" ON public.passport_sharing
  FOR ALL TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Employers read sharing of applicants" ON public.passport_sharing
  FOR SELECT TO authenticated USING (public.is_applicant_of(auth.uid(), student_id));
CREATE TRIGGER passport_sharing_set_updated_at BEFORE UPDATE ON public.passport_sharing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Shared accessibility sections for authorised viewers
CREATE OR REPLACE FUNCTION public.shared_accessibility_for(_student uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.accessibility_preferences%ROWTYPE;
  audience text;
  result jsonb := '{}'::jsonb;
  sec text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN '{}'::jsonb; END IF;
  IF auth.uid() = _student THEN audience := 'self';
  ELSIF public.is_faculty_of(auth.uid(), _student)
     OR (public.has_any_role(auth.uid(), ARRAY['institution','faculty']::app_role[])
         AND public.user_institution(auth.uid()) IS NOT NULL
         AND public.user_institution(auth.uid()) = public.user_institution(_student)) THEN audience := 'institution';
  ELSIF public.is_applicant_of(auth.uid(), _student) THEN audience := 'employer';
  ELSE RETURN '{}'::jsonb;
  END IF;
  SELECT * INTO p FROM public.accessibility_preferences WHERE id = _student;
  IF NOT FOUND THEN RETURN '{}'::jsonb; END IF;
  FOREACH sec IN ARRAY ARRAY['communication','learning','work','interview','environment'] LOOP
    IF audience = 'self' OR COALESCE(p.sharing ->> sec, 'private') = audience THEN
      result := result || jsonb_build_object(sec, to_jsonb(CASE sec
        WHEN 'communication' THEN p.communication WHEN 'learning' THEN p.learning
        WHEN 'work' THEN p.work WHEN 'interview' THEN p.interview ELSE p.environment END));
    END IF;
  END LOOP;
  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.shared_accessibility_for(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shared_accessibility_for(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_application_poster(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_application_poster(uuid, uuid) TO authenticated;