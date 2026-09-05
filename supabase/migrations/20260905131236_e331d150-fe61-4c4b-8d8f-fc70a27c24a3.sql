-- ============ ENUMS ============
CREATE TYPE public.competition_status AS ENUM ('draft','open','judging','completed');
CREATE TYPE public.competition_registration_status AS ENUM ('registered','submitted','withdrawn');
CREATE TYPE public.mentorship_request_status AS ENUM ('pending','accepted','declined','completed');
CREATE TYPE public.mentorship_session_status AS ENUM ('scheduled','completed','cancelled');

-- ============ COMPETITIONS ============
CREATE TABLE public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  organisation text NOT NULL,
  category text NOT NULL DEFAULT 'hackathon',
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  mode public.work_mode NOT NULL DEFAULT 'remote',
  location text NOT NULL DEFAULT 'Online',
  team_min smallint NOT NULL DEFAULT 1,
  team_max smallint NOT NULL DEFAULT 4,
  registration_deadline date,
  submission_deadline date,
  starts_on date,
  ends_on date,
  prize_details text NOT NULL DEFAULT '',
  rules text NOT NULL DEFAULT '',
  status public.competition_status NOT NULL DEFAULT 'draft',
  is_published boolean NOT NULL DEFAULT false,
  is_inclusive boolean NOT NULL DEFAULT true,
  accessibility_note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.competitions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitions TO authenticated;
GRANT ALL ON public.competitions TO service_role;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitions_select_public ON public.competitions FOR SELECT
  USING (is_published = true OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY competitions_insert_owner ON public.competitions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid()
    AND public.has_any_role(auth.uid(), ARRAY['industry','institution','faculty','admin','organizer']::public.app_role[]));
CREATE POLICY competitions_update_owner ON public.competitions FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY competitions_delete_owner ON public.competitions FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER competitions_set_updated_at BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE FUNCTION private.is_competition_owner(_user uuid, _competition uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = _competition AND c.created_by = _user)
    OR private.has_role(_user, 'admin')
  )
$$;
REVOKE ALL ON FUNCTION private.is_competition_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_competition_owner(uuid, uuid) TO authenticated;
CREATE FUNCTION public.is_competition_owner(_user uuid, _competition uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$ SELECT private.is_competition_owner(_user, _competition) $$;

-- ============ JUDGES ============
CREATE TABLE public.competition_judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, judge_id)
);
GRANT SELECT, INSERT, DELETE ON public.competition_judges TO authenticated;
GRANT ALL ON public.competition_judges TO service_role;
ALTER TABLE public.competition_judges ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION private.is_competition_judge(_user uuid, _competition uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.competition_judges j WHERE j.competition_id = _competition AND j.judge_id = _user
  )
$$;
REVOKE ALL ON FUNCTION private.is_competition_judge(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_competition_judge(uuid, uuid) TO authenticated;
CREATE FUNCTION public.is_competition_judge(_user uuid, _competition uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$ SELECT private.is_competition_judge(_user, _competition) $$;

CREATE POLICY judges_select ON public.competition_judges FOR SELECT TO authenticated
  USING (judge_id = auth.uid() OR public.is_competition_owner(auth.uid(), competition_id));
CREATE POLICY judges_insert_owner ON public.competition_judges FOR INSERT TO authenticated
  WITH CHECK (public.is_competition_owner(auth.uid(), competition_id));
CREATE POLICY judges_delete_owner ON public.competition_judges FOR DELETE TO authenticated
  USING (public.is_competition_owner(auth.uid(), competition_id));

-- ============ TEAMS ============
CREATE TABLE public.competition_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  name text NOT NULL,
  pitch text NOT NULL DEFAULT '',
  leader_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  looking_for_members boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competition_teams TO authenticated;
GRANT ALL ON public.competition_teams TO service_role;
ALTER TABLE public.competition_teams ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER competition_teams_set_updated_at BEFORE UPDATE ON public.competition_teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.competition_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.competition_teams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_label text NOT NULL DEFAULT 'Member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competition_team_members TO authenticated;
GRANT ALL ON public.competition_team_members TO service_role;
ALTER TABLE public.competition_team_members ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION private.is_team_leader(_user uuid, _team uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.competition_teams t WHERE t.id = _team AND t.leader_id = _user
  )
$$;
REVOKE ALL ON FUNCTION private.is_team_leader(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_team_leader(uuid, uuid) TO authenticated;
CREATE FUNCTION public.is_team_leader(_user uuid, _team uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$ SELECT private.is_team_leader(_user, _team) $$;

CREATE FUNCTION private.is_team_member(_user uuid, _team uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.competition_team_members m WHERE m.team_id = _team AND m.student_id = _user
  )
$$;
REVOKE ALL ON FUNCTION private.is_team_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_team_member(uuid, uuid) TO authenticated;
CREATE FUNCTION public.is_team_member(_user uuid, _team uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$ SELECT private.is_team_member(_user, _team) $$;

CREATE POLICY teams_select ON public.competition_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY teams_insert_leader ON public.competition_teams FOR INSERT TO authenticated
  WITH CHECK (leader_id = auth.uid());
CREATE POLICY teams_update_leader ON public.competition_teams FOR UPDATE TO authenticated
  USING (leader_id = auth.uid() OR public.is_competition_owner(auth.uid(), competition_id))
  WITH CHECK (leader_id = auth.uid() OR public.is_competition_owner(auth.uid(), competition_id));
CREATE POLICY teams_delete_leader ON public.competition_teams FOR DELETE TO authenticated
  USING (leader_id = auth.uid() OR public.is_competition_owner(auth.uid(), competition_id));

CREATE POLICY team_members_select ON public.competition_team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY team_members_insert ON public.competition_team_members FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() OR public.is_team_leader(auth.uid(), team_id));
CREATE POLICY team_members_delete ON public.competition_team_members FOR DELETE TO authenticated
  USING (student_id = auth.uid() OR public.is_team_leader(auth.uid(), team_id));

-- ============ REGISTRATIONS ============
CREATE TABLE public.competition_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.competition_teams(id) ON DELETE SET NULL,
  status public.competition_registration_status NOT NULL DEFAULT 'registered',
  motivation text NOT NULL DEFAULT '',
  accommodation_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competition_registrations TO authenticated;
GRANT ALL ON public.competition_registrations TO service_role;
ALTER TABLE public.competition_registrations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER competition_registrations_set_updated_at BEFORE UPDATE ON public.competition_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY registrations_select ON public.competition_registrations FOR SELECT TO authenticated
  USING (student_id = auth.uid()
    OR public.is_competition_owner(auth.uid(), competition_id)
    OR public.is_competition_judge(auth.uid(), competition_id));
CREATE POLICY registrations_insert_self ON public.competition_registrations FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY registrations_update_self ON public.competition_registrations FOR UPDATE TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY registrations_delete_self ON public.competition_registrations FOR DELETE TO authenticated
  USING (student_id = auth.uid());

-- ============ SUBMISSIONS ============
CREATE TABLE public.competition_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.competition_teams(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  demo_link text,
  repo_link text,
  notes text NOT NULL DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competition_submissions TO authenticated;
GRANT ALL ON public.competition_submissions TO service_role;
ALTER TABLE public.competition_submissions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER competition_submissions_set_updated_at BEFORE UPDATE ON public.competition_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY submissions_select ON public.competition_submissions FOR SELECT TO authenticated
  USING (student_id = auth.uid()
    OR (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
    OR public.is_competition_owner(auth.uid(), competition_id)
    OR public.is_competition_judge(auth.uid(), competition_id));
CREATE POLICY submissions_insert_self ON public.competition_submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY submissions_update_self ON public.competition_submissions FOR UPDATE TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY submissions_delete_self ON public.competition_submissions FOR DELETE TO authenticated
  USING (student_id = auth.uid());

-- ============ SCORES ============
CREATE TABLE public.competition_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.competition_submissions(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  innovation smallint NOT NULL DEFAULT 0,
  technical smallint NOT NULL DEFAULT 0,
  impact smallint NOT NULL DEFAULT 0,
  presentation smallint NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, judge_id),
  CHECK (innovation BETWEEN 0 AND 10 AND technical BETWEEN 0 AND 10 AND impact BETWEEN 0 AND 10 AND presentation BETWEEN 0 AND 10)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competition_scores TO authenticated;
GRANT ALL ON public.competition_scores TO service_role;
ALTER TABLE public.competition_scores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER competition_scores_set_updated_at BEFORE UPDATE ON public.competition_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY scores_select ON public.competition_scores FOR SELECT TO authenticated
  USING (judge_id = auth.uid() OR public.is_competition_owner(auth.uid(), competition_id));
CREATE POLICY scores_insert_judge ON public.competition_scores FOR INSERT TO authenticated
  WITH CHECK (judge_id = auth.uid() AND public.is_competition_judge(auth.uid(), competition_id));
CREATE POLICY scores_update_judge ON public.competition_scores FOR UPDATE TO authenticated
  USING (judge_id = auth.uid()) WITH CHECK (judge_id = auth.uid());
CREATE POLICY scores_delete_judge ON public.competition_scores FOR DELETE TO authenticated
  USING (judge_id = auth.uid() OR public.is_competition_owner(auth.uid(), competition_id));

-- ============ ACHIEVEMENT VERIFICATION COLUMNS ============
ALTER TABLE public.student_achievements
  ADD COLUMN verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN verified_at timestamptz,
  ADD COLUMN certificate_code text,
  ADD COLUMN competition_id uuid REFERENCES public.competitions(id) ON DELETE SET NULL;

-- ============ AWARDS / CERTIFICATES ============
CREATE TABLE public.competition_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.competition_teams(id) ON DELETE SET NULL,
  rank_position smallint NOT NULL DEFAULT 1,
  award_label text NOT NULL DEFAULT 'Winner',
  score numeric(6,2),
  certificate_code text NOT NULL UNIQUE DEFAULT 'A360-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, student_id)
);
GRANT SELECT ON public.competition_awards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competition_awards TO authenticated;
GRANT ALL ON public.competition_awards TO service_role;
ALTER TABLE public.competition_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY awards_select_public ON public.competition_awards FOR SELECT USING (true);
CREATE POLICY awards_insert_owner ON public.competition_awards FOR INSERT TO authenticated
  WITH CHECK (public.is_competition_owner(auth.uid(), competition_id));
CREATE POLICY awards_update_owner ON public.competition_awards FOR UPDATE TO authenticated
  USING (public.is_competition_owner(auth.uid(), competition_id))
  WITH CHECK (public.is_competition_owner(auth.uid(), competition_id));
CREATE POLICY awards_delete_owner ON public.competition_awards FOR DELETE TO authenticated
  USING (public.is_competition_owner(auth.uid(), competition_id));

CREATE FUNCTION public.sync_award_achievement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _title text;
  _org text;
BEGIN
  SELECT c.title, c.organisation INTO _title, _org FROM public.competitions c WHERE c.id = NEW.competition_id;

  INSERT INTO public.student_achievements
    (student_id, title, issuer, category, achieved_on, description, verified_by, verified_at, certificate_code, competition_id)
  VALUES (
    NEW.student_id,
    COALESCE(NEW.award_label, 'Winner') || ' - ' || COALESCE(_title, 'Competition'),
    COALESCE(_org, 'ABILITY360'),
    'competition',
    NEW.issued_at::date,
    'Verified competition result issued through ABILITY360. Certificate code ' || NEW.certificate_code || '.',
    NEW.issued_by,
    NEW.issued_at,
    NEW.certificate_code,
    NEW.competition_id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_award_achievement() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER competition_awards_sync_achievement AFTER INSERT ON public.competition_awards
  FOR EACH ROW EXECUTE FUNCTION public.sync_award_achievement();

-- ============ LEADERBOARD ============
CREATE FUNCTION private.competition_leaderboard(_competition uuid)
RETURNS TABLE (
  submission_id uuid, title text, team_id uuid, team_name text,
  student_id uuid, student_name text, judge_count bigint, avg_score numeric, rank_position bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.title, s.team_id, t.name, s.student_id, p.full_name,
    count(sc.id),
    COALESCE(round(avg(sc.innovation + sc.technical + sc.impact + sc.presentation)::numeric, 2), 0),
    row_number() OVER (
      ORDER BY COALESCE(avg(sc.innovation + sc.technical + sc.impact + sc.presentation), 0) DESC, s.submitted_at ASC
    )
  FROM public.competition_submissions s
  LEFT JOIN public.competition_teams t ON t.id = s.team_id
  LEFT JOIN public.profiles p ON p.id = s.student_id
  LEFT JOIN public.competition_scores sc ON sc.submission_id = s.id
  WHERE s.competition_id = _competition
  GROUP BY s.id, s.title, s.team_id, t.name, s.student_id, p.full_name, s.submitted_at
$$;
REVOKE ALL ON FUNCTION private.competition_leaderboard(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.competition_leaderboard(uuid) TO authenticated, anon;
CREATE FUNCTION public.competition_leaderboard(_competition uuid)
RETURNS TABLE (
  submission_id uuid, title text, team_id uuid, team_name text,
  student_id uuid, student_name text, judge_count bigint, avg_score numeric, rank_position bigint
)
LANGUAGE sql STABLE SET search_path = public AS $$ SELECT * FROM private.competition_leaderboard(_competition) $$;

-- ============ MENTORSHIP ============
CREATE TABLE public.mentor_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  organisation text,
  designation text,
  expertise text[] NOT NULL DEFAULT '{}',
  industries text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  years_experience smallint NOT NULL DEFAULT 0,
  session_mode public.work_mode NOT NULL DEFAULT 'remote',
  availability text NOT NULL DEFAULT '',
  max_active_mentees smallint NOT NULL DEFAULT 5,
  accepts_requests boolean NOT NULL DEFAULT true,
  supports_accessibility boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_profiles TO authenticated;
GRANT ALL ON public.mentor_profiles TO service_role;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER mentor_profiles_set_updated_at BEFORE UPDATE ON public.mentor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY mentor_profiles_select ON public.mentor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY mentor_profiles_insert_self ON public.mentor_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY mentor_profiles_update_self ON public.mentor_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY mentor_profiles_delete_self ON public.mentor_profiles FOR DELETE TO authenticated
  USING (id = auth.uid());

CREATE TABLE public.mentorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  focus_skills text[] NOT NULL DEFAULT '{}',
  status public.mentorship_request_status NOT NULL DEFAULT 'pending',
  response_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, mentor_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_requests TO authenticated;
GRANT ALL ON public.mentorship_requests TO service_role;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER mentorship_requests_set_updated_at BEFORE UPDATE ON public.mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY mentorship_requests_select ON public.mentorship_requests FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR mentor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY mentorship_requests_insert_student ON public.mentorship_requests FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY mentorship_requests_update ON public.mentorship_requests FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR mentor_id = auth.uid())
  WITH CHECK (student_id = auth.uid() OR mentor_id = auth.uid());
CREATE POLICY mentorship_requests_delete_student ON public.mentorship_requests FOR DELETE TO authenticated
  USING (student_id = auth.uid());

CREATE TABLE public.mentorship_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.mentorship_requests(id) ON DELETE SET NULL,
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic text NOT NULL DEFAULT 'Mentorship session',
  agenda text NOT NULL DEFAULT '',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes smallint NOT NULL DEFAULT 30,
  mode public.work_mode NOT NULL DEFAULT 'remote',
  meeting_link text,
  status public.mentorship_session_status NOT NULL DEFAULT 'scheduled',
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_sessions TO authenticated;
GRANT ALL ON public.mentorship_sessions TO service_role;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER mentorship_sessions_set_updated_at BEFORE UPDATE ON public.mentorship_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY mentorship_sessions_select ON public.mentorship_sessions FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR mentor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY mentorship_sessions_insert ON public.mentorship_sessions FOR INSERT TO authenticated
  WITH CHECK (mentor_id = auth.uid() OR student_id = auth.uid());
CREATE POLICY mentorship_sessions_update ON public.mentorship_sessions FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid() OR student_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid() OR student_id = auth.uid());
CREATE POLICY mentorship_sessions_delete ON public.mentorship_sessions FOR DELETE TO authenticated
  USING (mentor_id = auth.uid() OR student_id = auth.uid());

CREATE TABLE public.mentorship_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.mentorship_sessions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating smallint NOT NULL DEFAULT 5,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, author_id),
  CHECK (rating BETWEEN 1 AND 5)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_feedback TO authenticated;
GRANT ALL ON public.mentorship_feedback TO service_role;
ALTER TABLE public.mentorship_feedback ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION private.is_session_participant(_user uuid, _session uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.mentorship_sessions s
    WHERE s.id = _session AND (s.mentor_id = _user OR s.student_id = _user)
  )
$$;
REVOKE ALL ON FUNCTION private.is_session_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_session_participant(uuid, uuid) TO authenticated;
CREATE FUNCTION public.is_session_participant(_user uuid, _session uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$ SELECT private.is_session_participant(_user, _session) $$;

CREATE POLICY mentorship_feedback_select ON public.mentorship_feedback FOR SELECT TO authenticated
  USING (public.is_session_participant(auth.uid(), session_id));
CREATE POLICY mentorship_feedback_insert ON public.mentorship_feedback FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.is_session_participant(auth.uid(), session_id));
CREATE POLICY mentorship_feedback_update ON public.mentorship_feedback FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY mentorship_feedback_delete ON public.mentorship_feedback FOR DELETE TO authenticated
  USING (author_id = auth.uid());