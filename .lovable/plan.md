# Student workspace and login upgrade

## What will change

- Restyle the sign-in page using the selected accessible journey direction: a brighter charcoal-and-green visual system, Outfit/Figtree typography, stronger input states, clearer text, less empty space, and a compact journey preview that remains usable on small screens.
- Improve the student dashboard hierarchy so the current career goal, next action, progress, deadlines, and recent journey updates are visible before secondary content.
- Add personal goals that students can create, edit, complete, reorder by priority, and optionally give a target date. Goals will appear consistently on the dashboard, roadmap, and journey.
- Simplify the roadmap into an easy timeline: current focus first, larger touch-friendly completion controls, clearer progress, and personal goals alongside the existing role-based tasks.
- Improve the journey page with a cleaner chronological feed, goal milestones, compact filters, and more readable dates and status labels.
- Improve the student profile/Ability Passport overview without changing its existing evidence, skills, projects, achievements, or privacy rules.

## Data and behaviour

- Add a private `student_goals` table owned by the signed-in student, with title, optional notes, category, status, priority, optional target date, and timestamps.
- Keep existing roadmap completion records and journey events intact.
- Goal completion will be reflected in the journey feed; deleting a goal will remove only that goal.
- Use the existing signed-in student permissions, with no public access to goals.

## Visual and accessibility rules

- Apply the chosen charcoal, green, warm-white, and amber palette through shared design tokens.
- Use Outfit for headings and Figtree for body text.
- Preserve the existing accessibility menu, keyboard support, reduced-motion handling, visible labels, and minimum 44px touch targets.
- Use a journey-timeline composition, restrained translucent surfaces, clear focus rings, and no decorative effects that reduce legibility.
- Increase small supporting text where needed and ensure layouts work at 360px mobile width as well as desktop.

## Verification

- Test sign-in rendering, student dashboard, Ability Passport/profile, roadmap, journey, goal creation/edit/completion/deletion, and persistence after reload.
- Confirm mobile layouts have no horizontal overflow, text remains readable with larger-text settings, and existing student routes still load.
- Check the final preview for browser errors and a clean build.
