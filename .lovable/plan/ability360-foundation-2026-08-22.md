# ABILITY360 — Foundation

A personalised Academia–Industry Career OS. Tagline: "From First Semester to First Career."

This pass builds the shell: public marketing surface, real authentication with roles, four role dashboards with placeholder widgets, and an opportunities listing. No advanced features (matching, analytics, applications workflow) yet.

## Design direction

- Typography: Space Grotesk headings, DM Sans body (loaded via `<link>` in the root route).
- Surfaces: white / off-white, navy primary, accessible teal + amber accents, subtle borders instead of heavy shadows.
- All colours defined as semantic tokens in `src/styles.css` (light + dark), no hardcoded colour classes.
- Accessibility first: single `<main>` per page, visible focus rings, labelled inputs, keyboard-usable nav, AA contrast, 44px tap targets, `prefers-reduced-motion` respected. Animations limited to short fades and hover transitions.
- Lucide icons throughout, shadcn/ui for all primitives.

## Pages

**Landing (`/`)** — hero with tagline and dual CTA (Get started / Explore opportunities), the five-pillar story (Students, Colleges, Faculty, Industry, Opportunities), a "first semester to first career" journey strip, role cards, and footer.

**Register (`/register`)** — name, email, password, and role selector (Student, Industry, Institution). Zod-validated with react-hook-form. Admin is never self-selectable.

**Login (`/login`)** — email + password, links to register, redirects to the dashboard matching the signed-in user's role.

**Opportunities (`/opportunities`)** — public list of internships/jobs/projects from the database: search box, filters (type, location, mode), and cards with role, org, tags, deadline. Empty and loading states included.

**Dashboards** (protected, role-gated):
- `/dashboard/student` — profile completeness, skill progress, recommended opportunities, upcoming deadlines.
- `/dashboard/industry` — posted roles, applicant pipeline, talent pool snapshot.
- `/dashboard/institution` — student cohort stats, placement readiness, faculty activity.
- `/dashboard/admin` — platform totals, recent signups, verification queue.

Each shares a responsive app shell: collapsible sidebar (sheet drawer on mobile), topbar with account menu and sign out, role-specific nav items, and stat cards / empty-state panels with placeholder content.

## Backend (Lovable Cloud)

Enable Lovable Cloud, then one migration creating:

- `app_role` enum: `student | industry | institution | admin`.
- `profiles` — id → `auth.users(id)` cascade, full_name, headline, avatar_url, timestamps. Auto-created on signup by a trigger reading signup metadata.
- `user_roles` — separate table (never on profiles), unique (user_id, role), plus a `has_role(uuid, app_role)` security-definer function used by all policies.
- `opportunities` — title, org name, type, location, work mode, description, tags, deadline, posted_by, is_published; seeded with literal INSERT rows so the page has real content immediately.

Every table gets explicit GRANTs, RLS enabled, and policies: users read/update only their own profile and roles; published opportunities readable by `anon` and `authenticated`; industry posters and admins manage their own rows.

## Technical notes

- TanStack Start file routes; dashboards live under `src/routes/_authenticated/` using the integration-managed gate, with a role check per dashboard route redirecting mismatched roles.
- Data reads via TanStack Query (`queryOptions` + `useQuery`), Zod schemas shared between forms and query parsing.
- Root route gets an `onAuthStateChange` subscriber invalidating the router; header CTA reflects session state; sign-out cancels and clears queries before navigating.
- Per-route `head()` metadata with unique titles/descriptions/OG tags; `<Toaster />` from sonner mounted once in the root.
