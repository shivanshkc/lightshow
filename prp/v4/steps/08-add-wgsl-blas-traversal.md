# Step 08 — Add WGSL BLAS traversal for mesh intersection

## Step title and goal (1–2 sentences)
Implement BVH (BLAS) traversal in WGSL against the new mesh buffers, producing correct triangle hits for a given mesh+instance, while still leaving the main scene tracing path switch for a later step.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/renderer/shaders/raytracer.wgsl`
  - `src/__tests__/raytracer.test.ts`
- **What must not change**:
  - Do not remove analytic intersections yet
  - Do not change UI behavior

## Implementation details
- Add WGSL struct definitions matching the BVH node layout created in Step 05 and uploaded in Step 06.
- Implement:
  - `intersectAabb(ray, aabbMin, aabbMax) -> (hit: bool, tMin: f32, tMax: f32)`
  - `intersectMeshBlas(rayLocal, meshId) -> HitRecord` that:
    - traverses BLAS nodes iteratively (explicit stack) to avoid recursion
    - tests AABBs and intersects triangles at leaves
    - returns closest hit with barycentrics for normal interpolation (if normals are used)
- Keep it deterministic and robust:
  - cap stack size and define behavior if exceeded (e.g., stop traversal and return “no hit” with a debug flag off by default)

## Unit test plan
- **Update** `src/__tests__/raytracer.test.ts`:
  - Assert presence of BLAS traversal functions and AABB intersection helper.

## Documentation plan
- None.

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - None (not yet used in main trace loop).

## Acceptance criteria for this step (checklist)
- [ ] WGSL includes BLAS traversal and AABB intersection helpers.
- [ ] Implementation is iterative (no recursion).
- [ ] Tests and lint pass.

## Risks / edge cases for this step (brief)
- Mismatched node layout between CPU and WGSL is a common failure mode; keep layouts explicitly documented and tested.

## Rollback notes (what to revert if needed)
- Revert WGSL BLAS traversal additions and related test updates.

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


