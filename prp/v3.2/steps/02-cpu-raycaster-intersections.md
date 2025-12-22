# Step 02 — Add CPU raycaster intersections for new primitives

## Step title and goal

Extend CPU-side picking to support Cylinder, Cone, and Capsule intersections, respecting object transforms and the parameter encoding in `prp/v3.2/base.md`.

## Scope of changes

- **Files/modules likely to change (best-effort)**:
  - `src/core/math.ts` (add intersection helpers)
  - `src/core/Raycaster.ts` (dispatch to new intersection helpers)
  - `src/__tests__/Raycaster.test.ts` (new tests)
- **What must not change**:
  - No renderer/shader changes
  - No UI changes
  - No new dependencies

## Implementation details

- Add intersection functions in `src/core/math.ts` (names are suggestions; match existing conventions like `intersectRaySphere`, `intersectRayBox`):
  - `intersectRayCylinderCapped(ray, radius, halfHeight)` in object space, axis aligned to local Y
  - `intersectRayConeCapped(ray, baseRadius, halfHeight)` in object space, axis aligned to local Y, using EC4 cone convention
  - `intersectRayCapsule(ray, radius, halfHeightTotal)` in object space, axis aligned to local Y, using `segmentHalf = max(halfHeightTotal - radius, 0)`
- Torus CPU picking is implemented in **Step 04** (quartic), to keep this step small and avoid duplicating the torus work that also requires WGSL changes.
- Extend `Raycaster.pickWithRay` to:
  - Transform the world ray to object space (existing behavior)
  - Dispatch based on `obj.type` to the appropriate intersection
  - Return the closest hit among visible objects
- Degenerate/invalid parameters MUST return “no hit” per EC2.

## Unit test plan

- Add or extend `src/__tests__/Raycaster.test.ts` with deterministic rays that:
  - Hit/miss cylinder/cone/capsule with known parameters
  - Confirm closest-hit selection when two objects overlap in the ray direction
  - Confirm invalid parameters (radius <= 0, height <= 0) produce no hit

## Documentation plan

- No documentation changes in this step.

## Cleanup

- **Obsolete code introduced in this step**: none expected.
- **Removal in this step**: none.
- **Deferred cleanup**: none.
- **Verification**: lint + tests ensure no unused helpers remain; remove any helpers that end up unused.

## Verification

### Automated

- Run: `npm test -- --run`
  - Expected: all tests pass
- Run: `npm run lint`
  - Expected: no lint errors

### Manual (Owner)

- None for this step (no UI behavior changes).

## Acceptance criteria for this step (checklist)

- [ ] CPU `Raycaster` selects cylinder/cone/capsule correctly by ray intersection
- [ ] CPU picking respects position/rotation and the DM2 parameter encoding
- [ ] Invalid parameters produce “no hit”
- [ ] Tests and lint are green

## Risks / edge cases for this step

- Cone/cylinder edge hits near caps can be numerically sensitive; tests should avoid near-tangent rays initially.

## Rollback notes

- Revert added math helpers and `Raycaster` dispatch changes; restore tests.

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


