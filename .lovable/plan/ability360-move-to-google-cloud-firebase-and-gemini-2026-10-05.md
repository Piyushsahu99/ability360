# ABILITY360: move to Google Cloud, Firebase and Gemini

Goal: ABILITY360 runs on your own Google Cloud setup (Cloud SQL Postgres, Firebase sign-in, Gemini and Gemma for AI) and can be deployed from GitHub, while the preview here keeps working until you switch. Existing accounts and data are not moved over: the new system starts empty, with the reference content (roles, colleges, resources, learning, mock tests) seeded again.

## What you need to provide (I'll ask through secure forms, never in chat)
1. **Gemini API key**: saved securely as `GEMINI_API_KEY`. The key you pasted in chat should be treated as exposed. Please create a new one in Google AI Studio or Google Cloud and enter that one in the form.
2. **Firebase service account file**: the full JSON file (Firebase console, Project settings, Service accounts, Generate new private key). The project ID and key ID alone are not enough.
3. **Firebase web app settings**: apiKey, authDomain, appId (these are public and can go in the code).
4. **Cloud SQL connection string**: for your Postgres database on Google Cloud.
5. In Firebase, turn on the Email/Password and Google sign-in methods and add your domain as an authorised domain.

## Phases

**Phase 1: AI moves to Gemini and Gemma (low risk)**
- One shared AI helper calls Google's Gemini API directly with your key.
- Gemini 2.5 Flash for Sathi chat, accessible explanations, STAR feedback and crawler review. Gemma, served through the same API, for lighter tasks such as classifying, short summaries and simplifying text.
- Voice input uses Gemini audio understanding. Live voice calls use the Gemini Live API. Read-aloud stays on the device's own voice.
- Sathi keeps its rules: read-only, private chats, history loaded from saved data, and rate limits.

**Phase 2: Firebase sign-in**
- New sign-in, registration and Google buttons built on Firebase.
- The server checks the Firebase sign-in token on every protected request, page and Sathi call.
- Roles (student, employer, institution, admin) are stored in the database and keyed to the Firebase user.
- The duplicate-email dialog, rate limits and safe redirects all stay.

**Phase 3: Cloud SQL database**
- Re-create all tables on Cloud SQL from the existing schema files.
- Today, privacy is enforced by database rules tied to the current sign-in system. Each signed-in request will now set the user's ID, and the same rules will read it from there. That keeps the "only see your own data" protection in the database rather than relying on code alone.
- All browser-side data reads move to server functions, so the browser never talks to the database directly.
- File uploads (application documents) move to Firebase / Google Cloud Storage with signed links and the same file type and size limits.
- Scheduled crawler: Google Cloud Scheduler calls the existing protected crawl endpoint.

**Phase 4: Deployment and clean-up**
- Add a Dockerfile and Cloud Run deployment guide, with environment variables listed in `.env.example`.
- A single switch (`PLATFORM=gcp`) chooses the new setup. Until you flip it, the preview here keeps working.
- At switchover, remove Lovable packages, the badge, generated files, `.lovable/` and Lovable mentions in the README, comments and metadata, then check that the app builds and runs without them.
- Remove the agent connection (MCP) feature, or rebuild it on Firebase sign-in. You decide at switchover.

## Important limits
- I can't deploy to Google Cloud from here. You'll deploy from GitHub using the guide, and I'll make sure the build is ready for it.
- If the Lovable tooling is removed before switchover, the preview and editing here will stop working. That's why removal is the last step.
- Starting fresh means current users must register again.

## Technical details
- New modules: `src/lib/ai/gemini.server.ts` (REST `generativelanguage.googleapis.com`, streaming, model map such as `gemini-2.5-flash` and `gemma-3-27b-it`), `src/lib/auth/firebase.client.ts`, `src/lib/auth/firebase-admin.server.ts` (token verification works on any server; if `firebase-admin` doesn't support the runtime, verify against Google's public keys with `jose`), and `src/lib/db/pg.server.ts` (`postgres` driver, a per-request transaction that sets `request.jwt.claim.sub`, and an `auth.uid()` shim function so existing policies keep working).
- An adapter layer (`src/lib/platform/*`) puts auth, data, storage and AI behind interfaces, with a Lovable implementation and a GCP implementation chosen by env.
- Build target: Node server output for Cloud Run (Nitro `node-server` preset) instead of the Cloudflare worker.
- Record these decisions in `AGENTS.md`.
