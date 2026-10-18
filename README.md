# ABILITY360

**From First Semester to First Career.**

ABILITY360 is an accessibility-first academia–industry career platform for Indian college students. It connects students, colleges, faculty and employers around career direction, learning, opportunities and progress towards employment.

## Platform capabilities

- **Student workspace:** onboarding, Student DNA, skill assessments, career roles, readiness, a personal roadmap, goals and a journey timeline.
- **Applications:** discover vacancies, save opportunities, prepare documents, apply and track outcomes.
- **Employer workspace:** company profiles, vacancy publishing, applicant review, interviews, feedback and private student messaging.
- **Institution workspace:** student directories, cohort readiness, skill demand and placement outcomes.
- **ABILITY360 ACCESS:** optional accessibility preferences, accommodation requests, inclusive-employer information and selective Ability Passport sharing.
- **Learning:** accessible lessons, mock tests, scholarships, programmes, sign-language links and official government platforms.
- **Sathi:** private saved conversations, read-only platform searches, microphone input, read-aloud replies and live voice calls.
- **Assistant connections:** authenticated, read-only tools for opportunities, career roles and the user's own applications and goals.

## Technology

| Area | Stack |
| --- | --- |
| Application | React 19, TypeScript, TanStack Start and TanStack Router |
| Data loading | TanStack Query |
| Interface | Tailwind CSS v4, shadcn/ui, Radix UI and Lucide icons |
| Validation | Zod |
| Data and authentication | PostgreSQL (Cloud SQL), Firebase Authentication and row-level security |
| Server | TanStack server functions and HTTP routes |
| Quality | ESLint, TypeScript, Bun tests and GitHub Actions |

## Google services

ABILITY360 runs on Google Cloud and uses the following Google services.

| Google service | Role in ABILITY360 |
| --- | --- |
| Gemini API | Sathi chatbot, accessible explanations, structured AI feedback and assessment support |
| Gemma | Lightweight classification, summaries and text simplification |
| Firebase Authentication | Email/password and Google sign-in, with server-side token verification |
| Cloud SQL for PostgreSQL | Application records and user-scoped data access |
| Cloud Storage / Firebase Storage | Private application documents and verification uploads |
| Cloud Scheduler | Scheduled trusted-source imports |
| Cloud Run | Hosting and deployment |
| Google Search Console | Site verification, sitemap submission and search visibility |

The sitemap is available at `/sitemap.xml` on the deployed domain.

### Before changing hosting environments

Review and verify:

1. The Gemini API key stored only on the server, never in the browser bundle.
2. Firebase token verification and role permissions on every protected request.
3. Cloud SQL schema, reference content and user-scoped access controls.
4. Private document storage and authorised download links, preserving upload restrictions.
5. Cloud Run configuration and scheduled-import configuration.
6. End-to-end tests for registration, applications, employer review, PWD verification and Sathi.

Never commit Gemini API keys, service-account JSON files, database passwords or sign-in tokens. Public Firebase web settings are not a substitute for server-side authentication and authorisation.

## Local development

### Prerequisites

- Bun 1.3.3 (the version used by repository checks).
- Access to a configured backend and its public connection settings.
- Server-side credentials for the AI or import features you intend to exercise.

```sh
bun install --frozen-lockfile
cp .env.example .env
```

Fill in the connection settings in `.env`, then start the application:

```sh
bun run dev
```

Use the address printed by the development server. The example environment file contains names only, not working credentials. Never commit `.env`, service-account files, access tokens or private API keys.

### Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the local application |
| `bun run lint` | Check source-code quality |
| `bun run typecheck` | Check TypeScript types |
| `bun run test` | Run focused business-rule tests |
| `bun run check` | Run type, lint and test checks together |
| `bun run build` | Produce the deployment build |
| `bun run preview` | Preview the build locally |
| `bun run format` | Format files; review changes before committing |

## Repository layout

```text
src/
  assets/                  Bundled images
  components/              Shared interface and workflow components
  hooks/                   Reusable React hooks
  integrations/            Authentication and backend integrations
  lib/                     Data access, validation and business logic
  routes/                  File-based pages and HTTP endpoints
  styles.css               Shared theme and accessibility styles
  start.ts                 Request and server-function middleware
  server.ts                Server entry
supabase/migrations/       Existing backend schema migrations
drizzle/                   Additional schema and migration tooling
.github/workflows/         Repository quality checks
```

Generated route and integration files should not be edited manually. Navigation uses TanStack Router; server-only code belongs behind server functions or server routes.

## Privacy and accessibility

- Private records are scoped to the authenticated user through row-level security. Privileged credentials must never enter the browser bundle.
- Sathi verifies tokens server-side, loads saved history from the database and runs read-only tools as the user.
- Accessibility preferences are optional. Disability information must never reduce a career recommendation score.
- Employer accessibility information must come from recorded details, not assumptions or fabricated ratings.
- Accommodation requests require student approval. Passport sharing must respect selected categories.
- Imported listings use approved sources and expiry dates. Consult the official source before applying.

## Contributing

1. Keep changes focused and work on a separate branch.
2. Preserve authentication, role permissions and existing workflows.
3. Add a focused test when changing a business rule.
4. Run `bun run check` before opening a pull request.
5. Verify keyboard operation, small-screen layouts and loading, empty and error states for interface changes.
6. Never rewrite shared branch history or commit secrets, dependency folders or build output.

GitHub Actions runs installation, type checks, lint and tests for pull requests and configured push branches. These checks do not replace authenticated end-to-end testing.

## Deployment status

ABILITY360 is deployed on Google Cloud Run. Sign-in is provided by Firebase Authentication (email/password and Google), the Sathi chatbot runs on the Gemini API, and application data lives in PostgreSQL on Cloud SQL.

Review server credentials, database migrations, storage permissions and deployment configuration before changing hosting environments.

## GitHub synchronisation

Project changes are synchronised automatically when a GitHub repository is connected, on the branch selected in the project's Git settings. Check those settings to confirm the repository, selected branch and sync status; a README update alone does not prove a remote push succeeded.

For local contributions, use a feature branch and merge it into the synced branch after the repository checks pass. Do not force-push or rewrite shared history. If synchronisation reports a conflict, preserve and merge both sets of changes rather than discarding either version.