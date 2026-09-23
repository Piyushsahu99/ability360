# ABILITY360 ACCESS

"Don't ask a student to adapt to the platform. Make the platform adapt to the student."

An add-on to what already exists. Student DNA, Opportunities, Applications, Roadmap, Ability Passport, the employer workspace, sign-in and access rules all keep working as they do now.

## Delivery in 4 phases (each one tested before the next starts)

**Phase 1: Accessibility DNA and Access Mode**
- A private "Accessibility DNA" section inside Student DNA (/access). Students pick how they communicate, learn, work, interview, and what they need from a venue. They never have to name a diagnosis or disability category. Every field is optional.
- Privacy setting for each section: Private (default), Share with institution, Share with employer, or Share only for a specific application.
- A live preview showing how each choice changes the student's experience.
- The existing accessibility menu becomes "Access Mode". It adds read page aloud (browser speech), simplified language (AI rewrite of the selected section), guided navigation (step-by-step page tour), captions/transcript preference, and voice commands where the browser supports them. Choices are saved on the device and, for signed-in students, to their account.

**Phase 2: AccessMatch and Remove a Barrier**
- Every opportunity shows **Career Match** (the current eligibility logic) and a separate **Accessibility Compatibility** score.
- Compatibility is calculated only from features the employer has confirmed and preferences the student has chosen. Missing information shows as "Accessibility information unavailable" and never counts as accessible. Disability data never lowers a ranking.
- A "Why this match?" panel lists matching preferences, missing information, possible barriers, and suggested questions for the employer.
- "Remove a Barrier": the student picks or types a barrier and gets suggested supports from a fixed rules library, with an optional AI rephrase. They can accept, edit or reject each one. The page states clearly that these are suggestions, not medical advice.

**Phase 3: Accommodations in applications and the employer side**
- When applying: "Need an accessibility accommodation?" The student picks supports, a draft request is written, and the student must review, edit and approve it before it is sent. Only that text reaches that employer.
- Employer Accessibility Profile, covering the 13 features requested plus an accessibility contact and accommodation process. Instead of a score, an "Improve your accessibility information" checklist shows what is confirmed, what is missing, what support is available, and who to contact.
- In the applicant panel: "Candidate Accessibility Request", a "Suggested Inclusive Interview Setup", and actions to Accept, Request clarification, Offer an alternative, or Mark as arranged. Every status change is recorded.

**Phase 4: Practice, simulator, dashboard, Passport and interactive visuals**
- Communication Practice: structured and STAR-format questions answered by text or voice (browser speech-to-text). AI feedback covers only structure, relevance, completeness, technical content and organisation. It never judges accent, speech differences, voice, personality, face or eye contact.
- "Experience ABILITY360": six modes that switch on real product adaptations. It is presented honestly and does not claim to simulate having a disability.
- "Your Accessibility Journey" on the student dashboard: preferences, matches, requests, interview support, placement, verified outcome, plus "What should I do next?"
- Ability Passport privacy controls for each category (skills, projects, internships, competitions, certifications, achievements, feedback, readiness, accommodation preferences). Everything stays hidden until the student chooses to share it.
- Interactive visuals: an "Explain visually" action on learning modules and roadmap concepts. Gemini (built-in AI, no key needed) generates a structured, keyboard-accessible diagram with a text alternative.
- A guided demo checklist that walks through all 17 steps for presentations.

## Technical details
- Reuse and extend the existing `accessibility_preferences` table with new preference columns and section-level visibility.
- New tables: `employer_accessibility_profiles` (1:1 with company), `application_accommodations` (request text, selected supports, status, employer response; the student owns it and only the opportunity poster can read it), `accessibility_support_requests` (saved barriers and accepted supports, private to the student), `passport_sharing` (visibility per category).
- Existing opportunity accessibility columns are reused for AccessMatch.
- Strict RLS on every new table, with explicit grants and nothing readable by signed-out visitors. Institutions and faculty see only the sections a student shared, through `is_faculty_of` and `user_institution`. Status history lives in the existing `application_events` pattern.
- AI calls run on the server through the built-in AI (Gemini models) with Zod validation.
- Verification: typecheck; Playwright as a student, an employer and a faculty member; privacy checks confirming another user cannot read the data; 360px layout; keyboard-only run; no console errors.

## Out of scope for now
The pending MCP and SEO work stays on the roadmap and resumes after this.
