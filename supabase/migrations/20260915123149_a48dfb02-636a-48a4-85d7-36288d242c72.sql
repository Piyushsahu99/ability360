CREATE TABLE public.learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  level text NOT NULL DEFAULT 'beginner',
  summary text NOT NULL,
  body text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 10,
  format_tags text[] NOT NULL DEFAULT '{}',
  accessibility_tags text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learning_modules TO anon;
GRANT SELECT ON public.learning_modules TO authenticated;
GRANT ALL ON public.learning_modules TO service_role;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_modules_public_read" ON public.learning_modules FOR SELECT USING (is_published);

CREATE TABLE public.learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_progress TO authenticated;
GRANT ALL ON public.learning_progress TO service_role;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_progress_own" ON public.learning_progress FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE TABLE public.mock_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 15,
  difficulty text NOT NULL DEFAULT 'foundation',
  accessibility_notes text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mock_tests TO anon;
GRANT SELECT ON public.mock_tests TO authenticated;
GRANT ALL ON public.mock_tests TO service_role;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mock_tests_public_read" ON public.mock_tests FOR SELECT USING (is_published);

CREATE TABLE public.mock_test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  position integer NOT NULL,
  topic text NOT NULL,
  prompt text NOT NULL,
  options text[] NOT NULL,
  correct_index integer NOT NULL,
  explanation text NOT NULL DEFAULT '',
  UNIQUE (test_id, position)
);
GRANT SELECT (id, test_id, position, topic, prompt, options) ON public.mock_test_questions TO authenticated;
GRANT ALL ON public.mock_test_questions TO service_role;
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mock_test_questions_read" ON public.mock_test_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mock_tests t WHERE t.id = test_id AND t.is_published));

CREATE TABLE public.mock_test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  score integer NOT NULL,
  correct_count integer NOT NULL,
  total_questions integer NOT NULL,
  seconds_used integer NOT NULL DEFAULT 0,
  extra_time boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mock_test_attempts TO authenticated;
GRANT ALL ON public.mock_test_attempts TO service_role;
ALTER TABLE public.mock_test_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mock_test_attempts_own" ON public.mock_test_attempts FOR SELECT TO authenticated
  USING (student_id = auth.uid());

INSERT INTO public.learning_modules (slug, title, category, level, summary, body, duration_minutes, format_tags, accessibility_tags) VALUES
('rights-under-rpwd-act', 'Your rights under the RPwD Act, 2016', 'Divyangjan rights', 'beginner',
 'What the Rights of Persons with Disabilities Act guarantees you in college and at work, in plain language.',
 'The Rights of Persons with Disabilities Act, 2016 recognises 21 disabilities and gives you enforceable rights.

## In higher education
- Government and government-aided institutions reserve not less than 5% of seats for students with benchmark disabilities.
- You are entitled to a scribe, extra time (usually 20 minutes per hour), and question papers in an accessible format.
- Institutions must provide accessible buildings, toilets, libraries and transport.

## At work
- Government establishments reserve not less than 4% of posts for persons with benchmark disabilities.
- No employer may discriminate in recruitment, promotion or transfer on the ground of disability.
- Every establishment must publish an equal opportunity policy and appoint a liaison officer.

## Documents that help
- UDID card (Unique Disability ID) from swavlambancard.gov.in.
- Disability certificate issued by a notified medical authority.

## If your rights are denied
- Raise it in writing with the institution grievance officer first.
- Escalate to the State Commissioner or Chief Commissioner for Persons with Disabilities.
- National helpline for persons with disabilities: 1800-11-1265.',
 12, ARRAY['reading','checklist'], ARRAY['plain language','screen reader friendly']),
('exam-accommodations-guide', 'Asking for exam accommodations without stress', 'Divyangjan rights', 'beginner',
 'A step-by-step script for requesting a scribe, extra time or an accessible format before an exam.',
 'Accommodations are a right, not a favour. Asking early makes them routine.

## Four weeks before
- Write to the examination cell with your UDID or disability certificate number.
- Name the exact adjustment you need: scribe, 20 extra minutes per hour, large print, a ground-floor room, or a computer with a screen reader.

## A sample request
"I am registered for the end-semester examination on [date]. Under the RPwD Act, 2016 I request a scribe and compensatory time of 20 minutes per hour. My UDID number is [number]. Please confirm the arrangement in writing."

## One week before
- Confirm the room, the scribe''s name and the reporting time.
- If you use a screen reader, ask to test the machine once before the exam day.

## On the day
- Carry a printed copy of the approval email.
- If anything promised is missing, ask the invigilator to note it on the attendance sheet.',
 8, ARRAY['reading','template'], ARRAY['plain language','printable']),
('assistive-tech-toolkit', 'Assistive technology toolkit for students', 'Assistive technology', 'beginner',
 'Free screen readers, magnifiers, speech-to-text and note-taking tools that work well for Indian students.',
 'You do not need expensive software to study or work productively.

## Screen readers
- NVDA (Windows, free), VoiceOver (Mac and iPhone, built in), TalkBack (Android, built in).
- Learn five shortcuts first: read from here, next heading, next link, table navigation, and stop speech.

## Low vision
- Built-in magnifier, high contrast mode, and browser zoom at 150-200%.
- On ABILITY360, use the accessibility button in the corner for larger text, high contrast and a reading guide.

## Speech and typing
- Voice typing in Google Docs and on the Android keyboard supports Indian English and several Indian languages.
- Dictation cuts writing time when typing is painful or slow.

## Hearing
- Live captions in Google Meet and on Android.
- Ask for transcripts of recorded lectures; most platforms generate them automatically.

## Practice tip
Use your tools during practice tests, not only in the real exam. Speed comes from familiarity.',
 10, ARRAY['reading','tool list'], ARRAY['screen reader friendly','captions']),
('disclosure-at-work', 'Disclosure at work: your choice, your timing', 'Divyangjan rights', 'intermediate',
 'How to decide whether, when and how to tell an employer about a disability.',
 'You are never obliged to disclose a disability. Disclosure is a decision about getting what you need.

## Reasons students choose to disclose
- You need an adjustment in the interview or on the job.
- The role is under a reserved quota or an inclusive hiring drive.
- You want the accommodation on record from day one.

## Reasons students choose not to
- The role needs no adjustment.
- You prefer to be assessed first on your work.

## If you do disclose
- Talk about the adjustment, not the diagnosis: "I work best with written instructions" rather than a medical history.
- Put the agreed adjustment in an email after the conversation.
- Ask about the equal opportunity policy and the liaison officer.

## Interview adjustments you can request
- Questions shared in advance, extra time, a quiet room, a sign language interpreter, or a remote interview.

ABILITY360 never shows your accommodation settings to employers, and disability information is never used to rank you.',
 9, ARRAY['reading'], ARRAY['plain language']),
('resume-that-works', 'A resume that passes the first filter', 'Career skills', 'beginner',
 'Structure, wording and the mistakes that get Indian fresher resumes rejected in ten seconds.',
 '## One page, five sections
1. Name, city, phone, email, GitHub or portfolio link.
2. Education with CGPA or percentage.
3. Projects (the most important section for a fresher).
4. Skills, grouped by type.
5. Achievements and certifications.

## Write projects as results
Weak: "Made a website using React."
Strong: "Built a college event portal in React used by 400 students; cut manual registration work by 6 hours a week."

## Keywords matter
Most large employers filter resumes by software. Mirror the words used in the job description: the exact tool names, the exact role title.

## Common rejections
- Photos, date of birth, marital status and father''s name are not needed.
- Fancy templates with columns often break automated readers. A clean single column is safer, and it is also easier for a screen reader.
- Inconsistent tense and spelling. Read once aloud before sending.',
 10, ARRAY['reading','checklist'], ARRAY['plain language','screen reader friendly']),
('interview-confidence', 'Interview answers with the STAR method', 'Career skills', 'beginner',
 'Prepare six stories that answer forty questions, and practise them out loud.',
 '## STAR
- **Situation**: where and when.
- **Task**: what you had to achieve.
- **Action**: what you personally did.
- **Result**: the number, the outcome, the lesson.

## Six stories to prepare
1. A project you are proud of.
2. A time you failed.
3. A conflict in a team.
4. Something you learned quickly.
5. A deadline you managed.
6. A time you helped someone else succeed.

## Practise out loud
Record yourself once. Ninety seconds per answer is the target.

## Accommodations are fair game
You can ask for questions in advance, extra thinking time, captions, an interpreter, or a written response. Ask when the interview is scheduled, not on the day.',
 12, ARRAY['reading','practice'], ARRAY['plain language','captions']),
('aptitude-basics', 'Aptitude foundations: percentages, ratios and series', 'Aptitude', 'beginner',
 'The three question types that make up most campus placement aptitude papers.',
 '## Percentages
Percentage change = (new - old) / old x 100. If a price rises 25% and then falls 20%, you are back where you started.

## Ratios and proportion
If a : b = 3 : 4 and b : c = 2 : 5, make b common: a : b : c = 6 : 8 : 20 = 3 : 4 : 10.

## Time, speed and distance
Average speed for equal distances = 2xy / (x + y), not the plain average.

## Number series
Check in this order: difference, second difference, multiplication, squares and cubes, alternating patterns.

## Exam strategy
Attempt the easy two-thirds first. In most papers every question carries the same mark, so the order you answer in decides your score.',
 15, ARRAY['reading','worked examples'], ARRAY['plain language']),
('sql-fundamentals', 'SQL fundamentals every fresher is asked', 'Technical', 'beginner',
 'SELECT, JOIN, GROUP BY and the interview questions built on them.',
 '## The order the database reads your query
FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT. This is why you cannot use a SELECT alias inside WHERE.

## Joins
- INNER JOIN keeps rows matched on both sides.
- LEFT JOIN keeps every row of the left table, with NULLs where there is no match.
- Counting with a LEFT JOIN: COUNT(column) ignores NULLs, COUNT(*) does not.

## Grouping
WHERE filters rows before grouping; HAVING filters groups after.

## A classic question
Second highest salary:
SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);

## Practice
Write every query by hand once before running it. Interviews are on paper or in a shared document.',
 15, ARRAY['reading','code'], ARRAY['screen reader friendly']);

INSERT INTO public.mock_tests (slug, title, description, category, duration_minutes, difficulty, accessibility_notes) VALUES
('aptitude-foundation', 'Aptitude foundation mock test', 'Percentages, ratios, speed and number series, in the style of campus placement papers.', 'Aptitude', 12, 'foundation', 'Extra time, one question at a time and a paused timer are available.'),
('sql-basics', 'SQL basics mock test', 'Joins, grouping and query order for first technical rounds.', 'Technical', 12, 'foundation', 'Code is written in plain text so screen readers can read it.'),
('workplace-communication', 'Workplace communication mock test', 'Email tone, feedback, teamwork and asking for what you need at work.', 'Soft skills', 10, 'foundation', 'Plain-language questions with no time pressure required.');

INSERT INTO public.mock_test_questions (test_id, position, topic, prompt, options, correct_index, explanation)
SELECT t.id, q.position, q.topic, q.prompt, q.options, q.correct_index, q.explanation
FROM public.mock_tests t
JOIN (VALUES
 ('aptitude-foundation', 1, 'Percentages', 'A price rises by 25% and then falls by 20%. What is the net change?', ARRAY['No change','5% increase','5% decrease','45% increase'], 0, '1.25 x 0.80 = 1.00, so the price returns to the original value.'),
 ('aptitude-foundation', 2, 'Ratios', 'If a : b = 3 : 4 and b : c = 2 : 5, what is a : c?', ARRAY['3 : 10','6 : 20','3 : 5','4 : 5'], 0, 'Make b common: a : b : c = 6 : 8 : 20, so a : c = 6 : 20 = 3 : 10.'),
 ('aptitude-foundation', 3, 'Speed', 'A student cycles to college at 10 km/h and returns at 15 km/h. What is the average speed?', ARRAY['12.5 km/h','12 km/h','13 km/h','11 km/h'], 1, 'For equal distances, average speed = 2xy/(x+y) = 2(10)(15)/25 = 12 km/h.'),
 ('aptitude-foundation', 4, 'Series', 'What comes next: 2, 6, 12, 20, 30, ?', ARRAY['36','40','42','44'], 2, 'Differences are 4, 6, 8, 10, so the next difference is 12 and 30 + 12 = 42.'),
 ('aptitude-foundation', 5, 'Profit and loss', 'An item bought for Rs 800 is sold for Rs 1,000. What is the profit percentage?', ARRAY['20%','25%','ered 18%','12.5%'], 1, 'Profit is Rs 200 on a cost of Rs 800, which is 25%.'),
 ('aptitude-foundation', 6, 'Work', 'A finishes a task in 6 days, B in 12 days. Working together, how many days do they take?', ARRAY['4','5','8','9'], 0, 'Combined rate = 1/6 + 1/12 = 1/4, so 4 days.'),
 ('sql-basics', 1, 'Joins', 'Which join keeps every row from the left table even when there is no match?', ARRAY['INNER JOIN','LEFT JOIN','CROSS JOIN','SELF JOIN'], 1, 'LEFT JOIN returns all left rows and fills unmatched right columns with NULL.'),
 ('sql-basics', 2, 'Filtering', 'Which clause filters groups after GROUP BY?', ARRAY['WHERE','HAVING','ORDER BY','LIMIT'], 1, 'WHERE filters rows before grouping; HAVING filters after grouping.'),
 ('sql-basics', 3, 'Aggregates', 'How does COUNT(column) treat NULL values?', ARRAY['Counts them','Ignores them','Throws an error','Counts them as zero'], 1, 'COUNT(column) skips NULLs, while COUNT(*) counts every row.'),
 ('sql-basics', 4, 'Query order', 'Why can a SELECT alias not be used inside WHERE?', ARRAY['Aliases are only for display','WHERE runs before SELECT','Aliases must be quoted','WHERE does not allow columns'], 1, 'The database evaluates FROM and WHERE before SELECT, so the alias does not exist yet.'),
 ('sql-basics', 5, 'Duplicates', 'Which keyword removes duplicate rows from a result?', ARRAY['UNIQUE','DISTINCT','GROUP','SEPARATE'], 1, 'SELECT DISTINCT returns only unique combinations of the selected columns.'),
 ('sql-basics', 6, 'Subqueries', 'Which query returns the second highest salary?', ARRAY['SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)','SELECT salary FROM employees LIMIT 2','SELECT MIN(salary) FROM employees','SELECT TOP 2 salary FROM employees'], 0, 'Take the maximum of all salaries below the overall maximum.'),
 ('workplace-communication', 1, 'Email', 'What belongs in the subject line of a professional email?', ARRAY['A greeting','The specific request and any deadline','Your full name','Nothing, it is optional'], 1, 'A clear subject naming the request and deadline gets faster replies.'),
 ('workplace-communication', 2, 'Feedback', 'A manager criticises your work in a review. What is the best first response?', ARRAY['Defend the work immediately','Ask for a specific example so you can act on it','Say nothing and leave','Blame the timeline'], 1, 'Asking for a specific example turns criticism into something you can fix.'),
 ('workplace-communication', 3, 'Accommodations', 'You need written instructions rather than verbal ones. What is the best approach?', ARRAY['Share your medical history','Ask for a written summary after meetings, in writing','Manage without saying anything','Complain to HR first'], 1, 'Request the adjustment, not the diagnosis, and confirm it in writing.'),
 ('workplace-communication', 4, 'Teamwork', 'A teammate misses a shared deadline. What is the most effective first step?', ARRAY['Raise it with the manager','Ask them privately what is blocking them','Redo the work yourself silently','Post about it in the team channel'], 1, 'A private, direct question usually resolves the block fastest and preserves trust.'),
 ('workplace-communication', 5, 'Meetings', 'What is the best way to make a meeting accessible for everyone?', ARRAY['Speak faster to save time','Share an agenda in advance and turn on captions','Avoid written notes','Use only verbal updates'], 1, 'An agenda plus captions helps people who read, lip-read or process at different speeds.'),
 ('workplace-communication', 6, 'Escalation', 'An agreed adjustment is not provided after two reminders. What should you do next?', ARRAY['Wait longer','Put it in writing to your manager and the liaison officer','Resign','Stop doing the work'], 1, 'A written escalation to the manager and equal opportunity liaison officer creates a record and usually resolves it.')
) AS q(slug, position, topic, prompt, options, correct_index, explanation) ON q.slug = t.slug;