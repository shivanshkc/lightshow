# Step 05 — UI: 2×3 Add Object grid + shape-parameter transform inputs

## Step title and goal

Expose the new primitives in the UI with a 2×3 Add Object button grid and implement friendly Transform panel parameter controls for cylinder/cone/capsule/torus, mapping cleanly to existing `transform.update` commands.

## Scope of changes

- **Files/modules likely to change (best-effort)**:
  - `src/components/panels/AddObjectSection.tsx` (2×3 grid + 4 new buttons)
  - `src/components/panels/TransformSection.tsx` (shape-parameter inputs + invariant enforcement)
  - `src/store/sceneStore.ts` and/or backing store adapter (ensure `object.add` creates the correct default objects)
  - `src/__tests__/panels/*` and/or add new panel tests:
    - `src/__tests__/panels/TransformSection.test.tsx`
    - add `src/__tests__/panels/AddObjectSection.test.tsx` (if not present)
- **What must not change**:
  - No new dependencies
  - No new command types (must use `object.add` and `transform.update` only)
  - No renderer architecture changes

## Implementation details

### Add Object panel (FR4)

- Replace the current `flex` row with a `grid` layout:
  - 2 columns, 3 rows, with gap consistent with existing UI (`gap-2`)
- Render buttons in the required order:
  - Row 1: Sphere | Cuboid
  - Row 2: Cylinder | Cone
  - Row 3: Torus | Capsule
- Each button dispatches `object.add` with the corresponding primitive.
- Preserve max object limit behavior (disable all buttons when at limit).
- Buttons MUST include an icon + text label (per `prp/v3.2/base.md` UI5):
  - Use `lucide-react` icons.
  - If no dedicated icon is used for a new primitive, use `Circle` as the fallback icon.

### Transform panel (FR5)

- Extend the existing sphere special-case pattern to add new special-cases:
  - Cylinder: `Radius`, `Height`
  - Cone: `Radius`, `Height`
  - Capsule: `Radius`, `Height` (total)
  - Torus: `Inner radius`, `Outer radius`
- Mapping and invariants MUST follow `prp/v3.2/base.md` (DM2, UI3, EC1/EC2/EC3):
  - Cylinder/Cone/Capsule store `scale = [radius, height/2, radius]`
  - Torus stores `scale = [R, r, r]` with:
    - `R = (outer + inner) / 2`
    - `r = (outer - inner) / 2`
  - Enforce:
    - radius > 0
    - height > 0
    - torus outer > inner > 0
  - Reject/clamp non-finite values before dispatching commands.
- Ensure the `Reset Transform` action continues to reset scale to `[1,1,1]`. (Note: for non-sphere shapes, this may not represent the default; this is acceptable unless Owner specifies otherwise.)

## Unit test plan

- Add/extend UI tests to assert:
  - Add Object panel renders 6 buttons in DOM order and dispatches correct `object.add` commands on click
  - Transform panel shows:
    - Radius+Height for cylinder/cone/capsule
    - Inner+Outer for torus
  - Changing inputs dispatches `transform.update` with correctly mapped `scale`
  - Invalid input values (NaN/Infinity, negative numbers, torus outer<=inner) do not dispatch invalid scales (must clamp/reject deterministically)

## Documentation plan

- No docs changes expected in this step.

## Cleanup

- **Obsolete code introduced in this step**:
  - The old Add Object `flex` layout becomes obsolete.
  - Any temporary UI helper code added during earlier steps (if any) must be removed.
- **Removal in this step**:
  - Replace old layout code; remove dead branches not used after introducing special-case controls.
- **Deferred cleanup**:
  - None.
- **Verification**:
  - Lint (`npm run lint`) must be clean (no unused imports/exports).

## Verification

### Automated

- Run: `npm test -- --run`
  - Expected: all tests pass
- Run: `npm run lint`
  - Expected: no lint errors

### Manual (Owner)

1. Open the app.
2. In the Add Object panel:
   - Confirm the 2×3 grid layout and button order.
   - Click Cylinder, Cone, Torus, Capsule and confirm objects appear in the object list.
3. Select each new object and open Transform panel:
   - Cylinder/Cone/Capsule show Radius+Height and changes update the rendered shape.
   - Torus shows Inner+Outer and changes update the rendered shape.
4. Enter invalid values (negative, 0, NaN if possible):
   - Confirm the UI clamps/rejects and the app does not crash.

## Acceptance criteria for this step (checklist)

- [ ] Add Object panel shows 6 buttons in 2×3 grid in the required order
- [ ] Clicking each new button adds the correct primitive via `object.add`
- [ ] Transform panel uses friendly inputs per primitive and dispatches correctly-mapped `transform.update`
- [ ] Invalid inputs are handled deterministically and safely
- [ ] Tests and lint are green

## Risks / edge cases for this step

- UI input clamping must not create surprising “jumps”; implementers should prefer minimal clamping required by invariants.

## Rollback notes

- Revert UI layout and transform panel changes; keep underlying primitive support in place.

## Required agent workflow (MANDATORY)

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


