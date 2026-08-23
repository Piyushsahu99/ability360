# Day 1 — Prompt 3: Student Onboarding

Days 1's first two steps are done (UI shell + auth/roles/RLS). Next, per your sequential plan, is student onboarding — so Day 1 ends with working login → onboarding → dashboard.

## What gets built

A multi-step onboarding wizard at `/onboarding` that a student completes right after signing up, then lands on the student dashboard.

**Step 1 — Academic profile**
Full name, college (searchable list of institutions, with "my college isn't listed" free-text fallback), department, degree, semester, academic performance (CGPA or percentage).

**Step 2 — Skills & interests**
Add skills with a self-rated level (chips + typeahead over a starter skill list), interests, preferred industries.

**Step 3 — Career goal & location**
Target career goal (free text now; wired to career roles on Day 3), preferred work location, preferred work mode.

**Step 4 — Accessibility preferences (optional, clearly skippable)**
Screen reader, high contrast, captions, keyboard navigation, reduced motion, remote participation, accessible venue, flexible schedule, other accommodation (free text). No disability disclosure is requested anywhere; the section is framed as "how we should adapt the experience for you".

Progress is saved per step so a student can leave and come back. On finish, onboarding is marked complete and the student is redirected to `/dashboard/student`.

## Routing behaviour

- Students who have not completed onboarding are sent to `/onboarding` when they open a dashboard route.
- Industry / institution / admin users are unaffected.
- The dashboard shows a small "Complete your profile" prompt if onboarding was skipped mid-way.

## Data model (technical)

New tables in the existing Postgres database, each with GRANTs, RLS enabled, and owner-scoped policies:

- `student_profiles` — one row per student: degree, semester, academic score + type, career goal, preferred location, preferred work mode, preferred industries, `onboarding_completed_at`. Institution/department reuse the existing `profiles.institution_id` and `profiles.department` columns.
- `skills` — shared catalogue (name, category), publicly readable, admin-managed writes.
- `student_skills` — student ↔ skill with self-rated level and a `verification_status` enum (`self_declared`, `assessment_verified`, `faculty_verified`, `industry_verified`) defaulting to self-declared, so Day 2's assessment module plugs straight in.
- `student_interests` — simple tag rows per student.
- `accessibility_preferences` — one private row per student, boolean flags plus `other_accommodation` text. RLS: readable and writable only by the owner (and no faculty/institution read policy), so it is never exposed publicly.

Seed the `skills` catalogue with a starter set spanning technical, soft, aptitude and domain categories.

## Implementation notes

- Zod schema per step, shared with a single `onboardingSchema`; forms use shadcn/ui form controls with visible labels, error text tied via `aria-describedby`, and 44px touch targets.
- Reads/writes go through TanStack Query mutations against the browser Supabase client under RLS (no service role).
- The wizard is keyboard-navigable end to end, announces step changes to screen readers, and respects reduced motion.
- Fully responsive: single-column stacked steps on mobile, two-column field grid from `md` up.

## Verification before finishing

Re-check existing routes, login/register, opportunities queries and RLS policies still work, and fix any build or console errors before this step is considered done.
