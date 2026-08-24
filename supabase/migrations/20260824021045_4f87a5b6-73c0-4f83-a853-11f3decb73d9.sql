-- 1. Student projects
CREATE TABLE public.student_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  role text,
  technologies text[] NOT NULL DEFAULT '{}',
  link text,
  started_on date,
  completed_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_projects TO authenticated;
GRANT ALL ON public.student_projects TO service_role;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_projects_select_own ON public.student_projects FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY student_projects_select_institution ON public.student_projects FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_any_role(auth.uid(), ARRAY['faculty','institution','gov_admin']::public.app_role[])
      AND public.user_institution(student_id) IS NOT NULL
      AND public.user_institution(student_id) = public.user_institution(auth.uid()))
);
CREATE POLICY student_projects_insert_own ON public.student_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY student_projects_update_own ON public.student_projects FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY student_projects_delete_own ON public.student_projects FOR DELETE TO authenticated USING (auth.uid() = student_id);
CREATE TRIGGER student_projects_set_updated_at BEFORE UPDATE ON public.student_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Student experiences
CREATE TABLE public.student_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organisation text NOT NULL,
  role text NOT NULL,
  kind text NOT NULL DEFAULT 'internship',
  start_date date,
  end_date date,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_experiences TO authenticated;
GRANT ALL ON public.student_experiences TO service_role;
ALTER TABLE public.student_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_experiences_select_own ON public.student_experiences FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY student_experiences_select_institution ON public.student_experiences FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_any_role(auth.uid(), ARRAY['faculty','institution','gov_admin']::public.app_role[])
      AND public.user_institution(student_id) IS NOT NULL
      AND public.user_institution(student_id) = public.user_institution(auth.uid()))
);
CREATE POLICY student_experiences_insert_own ON public.student_experiences FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY student_experiences_update_own ON public.student_experiences FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY student_experiences_delete_own ON public.student_experiences FOR DELETE TO authenticated USING (auth.uid() = student_id);
CREATE TRIGGER student_experiences_set_updated_at BEFORE UPDATE ON public.student_experiences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Student achievements
CREATE TABLE public.student_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  issuer text,
  category text NOT NULL DEFAULT 'award',
  achieved_on date,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_achievements TO authenticated;
GRANT ALL ON public.student_achievements TO service_role;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_achievements_select_own ON public.student_achievements FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY student_achievements_select_institution ON public.student_achievements FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_any_role(auth.uid(), ARRAY['faculty','institution','gov_admin']::public.app_role[])
      AND public.user_institution(student_id) IS NOT NULL
      AND public.user_institution(student_id) = public.user_institution(auth.uid()))
);
CREATE POLICY student_achievements_insert_own ON public.student_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY student_achievements_update_own ON public.student_achievements FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY student_achievements_delete_own ON public.student_achievements FOR DELETE TO authenticated USING (auth.uid() = student_id);
CREATE TRIGGER student_achievements_set_updated_at BEFORE UPDATE ON public.student_achievements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Assessment question bank (answers never exposed to clients)
CREATE TABLE public.assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.skill_category NOT NULL,
  topic text NOT NULL DEFAULT '',
  prompt text NOT NULL,
  options text[] NOT NULL,
  correct_index smallint NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.assessment_questions TO service_role;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_questions_admin_all ON public.assessment_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_questions TO authenticated;

-- Safe view without the answer key
CREATE VIEW public.assessment_questions_public
WITH (security_invoker = off) AS
  SELECT id, category, topic, prompt, options
  FROM public.assessment_questions
  WHERE is_active = true;
GRANT SELECT ON public.assessment_questions_public TO authenticated;
GRANT SELECT ON public.assessment_questions_public TO service_role;

-- 5. Assessment attempts
CREATE TABLE public.assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category public.skill_category NOT NULL,
  total_questions smallint NOT NULL,
  correct_count smallint NOT NULL,
  score smallint NOT NULL,
  level smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assessment_attempts TO authenticated;
GRANT ALL ON public.assessment_attempts TO service_role;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_attempts_select_own ON public.assessment_attempts FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY assessment_attempts_select_institution ON public.assessment_attempts FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_any_role(auth.uid(), ARRAY['faculty','institution','gov_admin']::public.app_role[])
      AND public.user_institution(student_id) IS NOT NULL
      AND public.user_institution(student_id) = public.user_institution(auth.uid()))
);

-- 6. Seed question bank
INSERT INTO public.assessment_questions (category, topic, prompt, options, correct_index) VALUES
('technical','Programming','What is the time complexity of binary search on a sorted array?', ARRAY['O(n)','O(log n)','O(n log n)','O(1)'], 1),
('technical','Programming','Which data structure works on a Last In First Out principle?', ARRAY['Queue','Stack','Linked list','Heap'], 1),
('technical','Databases','Which SQL clause filters rows after grouping?', ARRAY['WHERE','HAVING','ORDER BY','LIMIT'], 1),
('technical','Databases','A primary key column must be', ARRAY['Nullable and unique','Unique and not null','Indexed only','Auto incremented'], 1),
('technical','Web','Which HTTP status code means "resource not found"?', ARRAY['200','301','404','500'], 2),
('technical','Version control','Which git command creates a new branch and switches to it?', ARRAY['git branch -d','git checkout -b','git merge','git clone'], 1),
('technical','Networking','What does an IP address identify?', ARRAY['A device on a network','A file on disk','A database row','A browser tab'], 0),
('technical','Programming','Which of these is NOT a programming paradigm?', ARRAY['Functional','Object oriented','Procedural','Relational caching'], 3),
('soft','Communication','A teammate misunderstands your message. The best first step is to', ARRAY['Repeat it louder','Ask what part was unclear and rephrase','Escalate to the manager','Send a long email'], 1),
('soft','Teamwork','During a group project a member misses deadlines. The most constructive action is', ARRAY['Do their work silently','Talk to them and re-plan the tasks','Report them immediately','Ignore the delay'], 1),
('soft','Time management','Which task should you generally do first?', ARRAY['Urgent and important','Important but not urgent','Urgent but not important','Neither urgent nor important'], 0),
('soft','Feedback','Good feedback is best described as', ARRAY['General and positive only','Specific, timely and actionable','Anonymous and delayed','Focused on personality'], 1),
('soft','Leadership','A leader running a stand-up meeting should mainly', ARRAY['Assign blame for delays','Unblock the team and align priorities','Report every detail upward','Do the work themselves'], 1),
('soft','Adaptability','Requirements change midway through a project. You should first', ARRAY['Refuse the change','Understand the impact and re-prioritise','Restart from scratch','Keep building the old plan'], 1),
('soft','Conflict','In a disagreement about approach, the most professional response is', ARRAY['Insist on your view','Compare options against shared goals','Stay silent','Ask someone else to decide'], 1),
('soft','Presentation','The strongest way to open a technical presentation is with', ARRAY['A detailed architecture diagram','The problem and why it matters','A list of tools used','Your full CV'], 1),
('aptitude','Numerical','If a shirt costs 800 after a 20% discount, the original price was', ARRAY['960','1000','1020','1600'], 1),
('aptitude','Numerical','A train travels 180 km in 3 hours. Its average speed is', ARRAY['50 km/h','55 km/h','60 km/h','70 km/h'], 2),
('aptitude','Series','Find the next number: 2, 6, 12, 20, 30, ?', ARRAY['36','40','42','46'], 2),
('aptitude','Logic','All engineers are problem solvers. Riya is an engineer. Therefore', ARRAY['Riya is a problem solver','Riya is a manager','Some engineers are not problem solvers','Nothing can be concluded'], 0),
('aptitude','Ratio','If 5 machines make 5 items in 5 minutes, 100 machines make 100 items in', ARRAY['1 minute','5 minutes','20 minutes','100 minutes'], 1),
('aptitude','Percentage','A student scores 45 out of 60. The percentage is', ARRAY['70%','72%','75%','80%'], 2),
('aptitude','Data interpretation','Average of 10, 20, 30, 40 is', ARRAY['20','25','30','35'], 1),
('aptitude','Logic','Which figure of speech applies: "Book is to Reading as Fork is to"', ARRAY['Drawing','Writing','Eating','Stirring'], 2),
('domain','Data','Which chart best shows the trend of a value over time?', ARRAY['Pie chart','Line chart','Treemap','Venn diagram'], 1),
('domain','Data','In a dataset, the median is preferred over the mean when data is', ARRAY['Normally distributed','Highly skewed','Very small','Categorical'], 1),
('domain','Product','A minimum viable product is best described as', ARRAY['A cheap prototype with no users','The smallest release that validates a hypothesis','The final feature-complete product','A design mockup'], 1),
('domain','Design','In UI design, visual hierarchy mainly guides', ARRAY['Server performance','Where the user looks first','Database structure','Code quality'], 1),
('domain','Engineering','In a chemical process, a mass balance states that mass is', ARRAY['Created in the reactor','Conserved across the system','Always lost','Equal to energy'], 1),
('domain','Engineering','A P&ID diagram is used mainly to show', ARRAY['Piping and instrumentation','Project timelines','Staff hierarchy','Financial flows'], 0),
('domain','Business','Which metric measures how many users return after first use?', ARRAY['Retention','Revenue','Reach','Runway'], 0),
('domain','Research','A literature review is done primarily to', ARRAY['Fill pages','Understand existing work and gaps','Avoid experiments','Cite friends'], 1);