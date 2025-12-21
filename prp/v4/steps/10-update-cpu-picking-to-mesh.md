# Step 10 — Update CPU picking to mesh-based intersections

## Step title and goal (1–2 sentences)
Replace CPU-side picking (`Raycaster`) to select objects using mesh-based intersection logic consistent with the renderer, without relying on analytic sphere/box intersections.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/core/Raycaster.ts`
  - `src/core/` (shared intersection helpers for CPU triangle/AABB/BVH if needed)
  - `src/__tests__/Raycaster.test.ts`
  - `src/adapters/zustand/ZustandSceneBackingStore.ts` (only if picking integration requires changes; goal is to avoid)
- **What must not change**:
  - Kernel command/query/event contracts
  - Renderer behavior

## Implementation details
- Update `Raycaster.pickWithRay` to:
  - map each scene object primitive type to a meshId/mesh reference in a shared mesh library (built-in primitives only for this release)
  - compute per-object AABB in world space and reject quickly
  - transform ray into local space (translation/rotation/scale inverse, matching renderer)
  - intersect against the mesh (either brute-force triangles for now, or reuse BVH from `@core` if available and cheap)
  - return the closest hit and objectId, consistent with current semantics
- Ensure non-uniform scaling is handled consistently with renderer hit computation.

## Unit test plan
- **Update/Add**: `src/__tests__/Raycaster.test.ts`
  - Add cases for each primitive type:
    - a ray that should hit
    - a ray that should miss
  - Add a regression test that selection ignores invisible objects.

## Documentation plan
- None.

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - In the app, click on each primitive in the scene:
    - confirm selection changes to the clicked object
    - confirm selection highlight follows selection

## Acceptance criteria for this step (checklist)
- [ ] CPU picking works for all primitives.
- [ ] Picking does not rely on analytic intersections.
- [ ] Tests and lint pass.

## Risks / edge cases for this step (brief)
- CPU picking performance: if brute-force triangles are used, keep primitive triangle counts modest and/or use BVH.

## Rollback notes (what to revert if needed)
- Revert `Raycaster` changes and restore analytic picking until mesh picking is fixed.

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


