# Step 04 — Implement torus quartic intersection (CPU + WGSL)

## Step title and goal

Implement torus ray intersection using a **quartic** method in both CPU picking and WGSL rendering, and ensure SceneBuffer/objectType dispatch supports torus end-to-end.

## Scope of changes

- **Files/modules likely to change (best-effort)**:
  - `src/core/math.ts` (torus quartic solver + intersection)
  - `src/core/Raycaster.ts` (ensure torus uses quartic intersection)
  - `src/renderer/shaders/raytracer.wgsl` (quartic solver + torus intersection)
  - `src/__tests__/Raycaster.test.ts` (torus hit/miss tests)
  - `src/__tests__/raytracer.test.ts` (assert torus WGSL functions exist)
- **What must not change**:
  - No UI changes
  - No new dependencies
  - No raymarch/SDF stepping loops for torus

## Implementation details

- Implement torus intersection in object space:
  - Torus centered at origin, ring around local Y axis.
  - Parameters from DM2: `majorRadius = obj.scale.x`, `minorRadius = obj.scale.y` (with `obj.scale.z` equal to `minorRadius` by encoding).
- Quartic method requirements:
  - Build the quartic polynomial coefficients for ray–torus intersection.
  - Solve for real roots and choose the smallest positive `t`.
  - Compute normal analytically from the implicit surface gradient at the hit point.
  - If parameters are invalid (`minorRadius <= 0` or `majorRadius <= 0`), return “no hit”.
- Numerical stability requirements:
  - Avoid NaNs via clamping where appropriate.
  - Tests should focus on clear hit/miss cases (avoid near-tangency in early coverage).

## Unit test plan

- CPU:
  - Add deterministic hit/miss rays for torus in `src/__tests__/Raycaster.test.ts`.
  - Add a regression test ensuring torus selection works in the presence of other primitives (closest hit wins).
- WGSL:
  - Update `src/__tests__/raytracer.test.ts` to assert:
    - quartic solver helper(s) exist by name
    - torus intersection function exists by name
    - `traceScene` dispatch contains a torus case

## Documentation plan

- No documentation changes in this step.

## Cleanup

- **Obsolete code introduced in this step**: none expected.
- **Removal in this step**: none.
- **Deferred cleanup**:
  - If any temporary helper functions are introduced for debugging, they must be removed before step completion.
- **Verification**: lint ensures no unused helpers remain.

## Verification

### Automated

- Run: `npm test -- --run`
  - Expected: all tests pass
- Run: `npm run lint`
  - Expected: no lint errors

### Manual (Owner)

- None for this step (no UI behavior changes).

## Acceptance criteria for this step (checklist)

- [ ] CPU torus picking uses quartic intersection and produces correct hit/miss behavior
- [ ] WGSL torus rendering uses quartic intersection (no raymarch stepping)
- [ ] Torus objectType is correctly encoded and dispatched
- [ ] Tests and lint are green

## Risks / edge cases for this step

- Quartic solving can be sensitive; implementers should expect iteration on numerical robustness.

## Rollback notes

- Revert quartic solver and torus intersection functions; revert tests and shader changes.

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


