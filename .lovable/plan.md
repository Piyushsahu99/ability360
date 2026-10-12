# ABILITY360 home and shared-theme redesign

## Goal
Make the first screen clearly explain ABILITY360 as an inclusive career platform, foreground useful PWD/Divyangjan support, and give signed-in users a real Sathi conversation without weakening chat privacy.

## Home page
- Recompose the home page around one clear promise: career direction, accessible support, verified opportunities, and progress from college to employment.
- Keep the existing inclusive campus photography, but improve image framing, contrast, typography, section rhythm, calls to action, and mobile readability.
- Replace the current long generic journey presentation with a more focused flow: discover a direction, build skills and evidence, find inclusive opportunities, request support, and track progress.
- Add a concise ABILITY360 ACCESS section that communicates privacy, adaptation, accommodations, and Ability Passport sharing without charity-style language.
- Keep actions auth-aware: signed-in people return to their workspace; visitors can create an account or explore public content.

## PWD deadlines and opportunities
- Add a prominent “Important for PWD students” section using live published data rather than invented cards.
- Combine active inclusive jobs/internships from the opportunities data with active Divyangjan scholarships, schemes, training, and official programmes from the resources data.
- Show the organisation, opportunity type, work/location context, verified accessibility information when available, exact deadline or “rolling,” and a clear action.
- Sort dated items by the nearest future deadline, visibly mark “closing soon,” exclude past deadlines from the home highlights, and provide honest loading, empty, and error states.
- Do not claim an employer is accessible unless its stored accessibility details support that claim. The current data has no unexpired inclusive hiring listing, so the section will fall back to valid official PWD programmes until new verified hiring listings are published.
- Add a small deterministic test for the active/expired and nearest-deadline selection rules.

## Government platform directory
- Add a scannable home-page directory of verified central-government PWD platforms and organisations, each opening its official website in a new tab.
- Cover the principal national services already relevant to the product: DEPwD, UDID, National Scholarship Portal, NHFDC, ADIP/ALIMCO, National Career Service, Skill Council for Persons with Disability, ISLRTC, the Chief Commissioner for Persons with Disabilities, and key national disability institutes where an official stable website is available.
- Group links by identity and rights, education and scholarships, employment and skilling, assistive support, and sign-language/learning so users can find the right platform quickly.
- Label this honestly as the national government directory; do not imply it includes every state department or every organisation in India.

## Sathi on the home page
- For signed-in users, embed the existing saved Sathi chat experience directly on the home page, reusing its authenticated thread, database history, streaming, tool results, microphone input, and read-aloud controls.
- Open the most recently updated chat or create the first thread through the existing safe path; provide “New chat” and “Open full Sathi” actions without duplicating chat storage or server logic.
- For signed-out visitors, show what Sathi can answer and require sign-in before starting a conversation; no public or anonymous AI endpoint will be introduced.
- Keep voice-call mode on the full Sathi page, linked from the embedded panel, while retaining voice input and read-aloud on the home page.
- Adapt the chat component with a compact home-page layout while preserving the full-height dedicated Sathi view.

## Shared theme rollout
- Refine the existing semantic design tokens into one accessible civic-career visual direction: warm light surfaces, grounded charcoal, confident green, and restrained amber accents with strong contrast.
- Apply the same typography, section headers, controls, cards, spacing, borders, and focus treatment to the shared header/footer and signed-in workspace shell.
- Bring the public Opportunities and Resources pages plus Login and Registration into the same visual system without changing their workflows, permissions, or data behavior.
- Keep the accessibility toolbar and all display modes working with the revised tokens; maintain zero letter-spacing for headings, reduced-motion support, visible focus, touch targets, and large-text resilience.
- Use cards only for repeated listings and framed tools; page sections remain unframed full-width bands.

## Technical details
- Keep the home presentation in the index route and factor only focused reusable sections/components where needed.
- Use the existing TanStack Query sources for opportunities, resources, auth, and Sathi threads; do not add a duplicate table or a second chatbot endpoint.
- Keep all external directory URLs in a typed, curated data module so official links can be reviewed centrally.
- Preserve all existing authentication, RLS, application, roadmap, Ability Passport, ACCESS, employer, institution, and admin behavior.
- Update page-specific metadata only where the revised public-page descriptions materially change.

## Verification
- Check the home page signed out and signed in, including existing-thread restoration, first-thread creation, sending a Sathi message, microphone control availability, and navigation to the full chat/voice-call view.
- Verify deadline ordering, expired-item exclusion, official external links, and honest empty/error states.
- Test Home, Opportunities, Resources, Login, Registration, and representative student/employer workspace pages at phone and desktop widths, including larger text, keyboard navigation, high contrast, reduced motion, and no horizontal overflow.
- Run focused tests plus the project’s type, lint, and build checks; review preview console/runtime/network errors before completion.

## Out of scope
- No anonymous Sathi access, new AI model, new chatbot backend, or change to Sathi security limits.
- No automatic ingestion of unverified employer claims or fabricated PWD opportunities.
- No redesign of every specialist workflow in this pass; their shared shell/theme will update, while deeper page-by-page redesign remains separate.
