# Backend Foundation — Roles, Institutions, RLS

The backend is already connected (Lovable Cloud / PostgreSQL) with `profiles`, `user_roles`, `opportunities`, a `has_role()` security-definer function, RLS, and a signup trigger. This pass extends it to the full eight-role model, adds `institutions`, and tightens access control — without changing any existing screen.

## Role model

The current enum has `student`, `industry`, `institution`, `admin`. Those stay (so existing dashboards keep working) and are given their proper meaning, with four new values added:

| Requested role | Stored value |
| --- | --- |
| Student | `student` |
| Industry | `industry` |
| Faculty | `faculty` (new) |
| Institution Admin | `institution` |
| Government Admin | `gov_admin` (new) |
| Mentor | `mentor` (new) |
| Opportunity Organizer | `organizer` (new) |
| Super Admin | `admin` |

Public registration keeps offering only Student, Industry and Institution — the signup trigger rejects any other value in the signup metadata and falls back to `student`, so Faculty, Government Admin, Mentor, Organizer and Super Admin can never be self-granted. Privileged roles are assigned only by a Super Admin (or directly in the database).

## Tables

**`institutions`** — name, short code, type (college / university / polytechnic / other), city, state, website, verification status, `created_by`, timestamps. Readable by everyone (public directory), created by institution admins, editable by its own admins and Super Admins, verification flag only settable by Super/Government Admins.

**`profiles`** — gains `institution_id` (nullable reference to `institutions`), `department`, `year_of_study`, `phone`. Existing columns and the auto-create trigger stay as-is.

**`user_roles`** — unchanged shape. Gains admin-only write policies so a Super Admin can grant and revoke roles; nobody else can insert or update roles.

## Row Level Security

Every table keeps RLS enabled, with explicit GRANTs. Access rules:

- Profiles: users read and update their own. Faculty, Institution Admins and Government Admins can read profiles belonging to their own institution; Super Admin reads all. No one can delete profiles.
- Roles: users read their own roles only; only Super Admin writes.
- Institutions: public read; institution admins manage their own record; Super Admin manages all.
- Opportunities: published rows public; Industry users and Organizers create and manage their own; Super Admin manages all.

Institution scoping uses two new security-definer helpers, `user_institution(uuid)` and `has_any_role(uuid, app_role[])`, so policies never recurse into `profiles` or `user_roles`.

## Technical notes

- Delivered as one migration: enum additions, then the new table with GRANT → ENABLE RLS → policies in that order, then profile columns, helper functions, and updated policies. Enum values are added in a separate statement batch since Postgres cannot use a new enum label in the same transaction that creates it.
- `handle_new_user()` is updated to whitelist self-selectable roles and to accept an optional `institution_id` from signup metadata.
- `src/lib/auth.ts` gains the four new role labels and dashboard paths; new roles route to a shared generic workspace so no dashboard is missing. `roleLabels`/`dashboardPathByRole` stay complete for every enum value, keeping `DashboardShell` type-safe.
- No visual or layout changes to existing pages; registration options stay exactly the same three.
- After the migration, generated types refresh and a security scan runs to confirm no table is left open.
