# Step 03 — GPU scene buffer + WGSL intersections for cylinder/cone/capsule

## Step title and goal

Extend GPU scene encoding and the WGSL raytracer to correctly render Cylinder, Cone, and Capsule with analytic intersections (capped solids), while keeping buffer layout stable.

## Scope of changes

- **Files/modules likely to change (best-effort)**:
  - `src/core/SceneBuffer.ts` (encode objectType discriminator for new primitives)
  - `src/renderer/shaders/raytracer.wgsl` (add intersection functions + dispatch)
  - `src/__tests__/SceneBuffer.test.ts` (update expected mappings if asserted)
  - `src/__tests__/raytracer.test.ts` (assert new WGSL functions exist)
- **What must not change**:
  - No UI changes
  - No new bindings or buffer layout changes (struct size/alignment must remain compatible)
  - No new dependencies

## Implementation details

- Update the object type encoding in `SceneBuffer.writeObject`:
  - Replace the current binary mapping (sphere vs “everything else”) with explicit mapping for:
    - sphere
    - cuboid
    - cylinder
    - cone
    - capsule
    - torus (may be encoded now but intersection will be added in a later step)
- Update WGSL:
  - Add `intersectCylinderCapped`, `intersectConeCapped`, `intersectCapsule`
  - Update `traceScene` dispatch based on `obj.objectType`
  - For capsule, use `segmentHalf = max(obj.scale.y - obj.scale.x, 0.0)` per base doc EC3
- Ensure that for object types not yet supported in this step (torus), the shader deterministically returns “no hit” (or falls back safely) rather than misclassifying.

## Unit test plan

- Update `src/__tests__/raytracer.test.ts` to assert shader contains the new function names and objectType dispatch cases.
- Update/add `src/__tests__/SceneBuffer.test.ts` to assert the objectType mapping matches the WGSL expectations.

## Documentation plan

- No documentation changes in this step.

## Cleanup

- **Obsolete code introduced in this step**: the old `obj.type === 'sphere' ? 0 : 1` mapping becomes obsolete.
- **Removal in this step**:
  - Remove the old binary mapping and replace with explicit mapping.
- **Deferred cleanup**:
  - None; torus mapping may be introduced here but torus intersection is implemented in a later step.
- **Verification**:
  - Tests + lint pass; shader compiles as part of app runtime (manual checks later).

## Verification

### Automated

- Run: `npm test -- --run`
  - Expected: all tests pass
- Run: `npm run lint`
  - Expected: no lint errors

### Manual (Owner)

- Optional sanity check (if running app):
  - No visible changes expected unless new primitives are already creatable (they should not be exposed until later steps).

## Acceptance criteria for this step (checklist)

- [ ] `SceneBuffer` encodes distinct objectType values for at least: sphere, cuboid, cylinder, cone, capsule (torus may be reserved)
- [ ] WGSL shader has correct cylinder/cone/capsule intersection functions
- [ ] Shader dispatch selects the right intersection based on objectType
- [ ] Tests and lint are green

## Risks / edge cases for this step

- WGSL intersection math must avoid NaNs; ensure clamping for invalid params yields “no hit”.

## Rollback notes

- Revert the objectType mapping changes and WGSL function additions; restore tests.

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


