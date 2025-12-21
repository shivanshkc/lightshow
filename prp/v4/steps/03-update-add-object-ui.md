# Step 03 — Update “Add Object” UI for new primitives

## Step title and goal (1–2 sentences)
Expose the new primitives (Cylinder/Cone/Capsule/Torus) in the UI’s “Add Object” section by dispatching `object.add` commands, without introducing any primitive-specific settings.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/components/panels/AddObjectSection.tsx`
  - Potentially shared UI components (buttons/layout) if needed
- **What must not change**:
  - No renderer/shader changes
  - No changes to kernel contracts beyond earlier steps
  - No new primitive settings controls (no sliders/toggles for caps/segments)

## Implementation details
- Add four new buttons: `Cylinder`, `Cone`, `Capsule`, `Torus`.
- Each button must dispatch `kernel.dispatch({ v: 1, type: 'object.add', primitive: '<type>' })`.
- Maintain `LIMITS.maxObjects` disabling logic consistently across all buttons.
- Iconography:
  - Use existing `lucide-react` icons.
  - If no perfect icon exists, pick simple geometric icons and document the choice in PR description (no new docs required).

## Unit test plan
- **Update**: relevant UI tests under `src/__tests__/*` if any assert only 2 buttons.
  - Add/adjust tests to assert the presence of new buttons and that they dispatch correct commands (likely via mocked kernel in React tests).

## Documentation plan
- None.

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - Open the app.
  - In “Add Object”, click `Cylinder`, `Cone`, `Capsule`, `Torus`.
  - Confirm an object is added each time and appears in the object list.
  - Confirm buttons disable when reaching the max object limit.

## Acceptance criteria for this step (checklist)
- [ ] UI shows buttons for Cylinder/Cone/Capsule/Torus.
- [ ] Each button dispatches the correct `object.add` command.
- [ ] Buttons respect max object limit.
- [ ] Tests and lint pass.

## Risks / edge cases for this step (brief)
- UI layout may overflow; keep the UI compact (e.g., wrapping layout) while preserving readability.

## Rollback notes (what to revert if needed)
- Revert changes to `AddObjectSection` and any associated tests.

## Required agent workflow (must be repeated verbatim in EVERY step doc)
1. Read this atomic step document fully and build a thorough understanding. If any detail is unclear, ask the Owner targeted questions before coding.
2. If documentation updates are needed to reflect newly confirmed understanding, draft the doc changes and ask the Owner for approval **before proceeding**.
3. Execute the step in this order:
   - Implement the step (code changes)
   - Add/adjust unit tests
   - Run the full test suite: `npm test -- --run`
   - Run lint: `npm run lint`
   - Update docs if needed
   - Provide **manual test actions** for the Owner
   - The Owner will test/verify and may request modifications (expect iteration)
   - After the Owner approves the step, run benchmarks: `npm run bench` (must not regress materially)
   - If benchmarks pass, propose a commit message in **Angular/conventional commits** format (e.g. `feat: ...`, `fix: ...`, `refactor: ...`)
   - After the Owner approves the commit message, create the git commit


