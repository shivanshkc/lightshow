# Step 07 — Add WGSL triangle intersection (Möller–Trumbore)

## Step title and goal (1–2 sentences)
Add a robust, numerically safe triangle intersection routine to the raytracer shader and validate it with shader-content tests, without switching the main tracing loop yet.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/renderer/shaders/raytracer.wgsl`
  - `src/__tests__/raytracer.test.ts`
- **What must not change**:
  - Do not remove analytic intersections yet
  - Do not change pipeline bindings beyond what was added in Step 06

## Implementation details
- Add `intersectTriangle(ray, v0, v1, v2) -> HitRecord` (or equivalent) using Möller–Trumbore.
- Ensure it:
  - rejects near-parallel rays by checking determinant epsilon
  - returns `t` in ray space (caller will convert to world `t` when required)
  - supports backface handling appropriate for closed surfaces (define whether triangles are treated as single-sided or two-sided; for watertight primitives prefer consistent winding and single-sided, but imported meshes later may require optional two-sided)
- Add helper functions for barycentric interpolation if normals are used later (`u`, `v`, `w`).

## Unit test plan
- **Update** `src/__tests__/raytracer.test.ts`:
  - Assert that the shader contains the new triangle intersection function signature.

## Documentation plan
- None.

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - None (tracing loop not switched yet).

## Acceptance criteria for this step (checklist)
- [ ] WGSL contains a triangle intersection function with explicit determinant epsilon handling.
- [ ] Tests and lint pass.

## Risks / edge cases for this step (brief)
- Precision issues can cause self-intersection; ensure the main tracer continues to use consistent `EPSILON` offsets as before.

## Rollback notes (what to revert if needed)
- Revert WGSL changes and the associated shader-content test updates.

## Cleanup
- **Obsolete code introduced/identified in this step**: None (additive; no behavior switched yet).
- **Removal plan**:
  - **This step**: No removals.
  - **Deferred**:
    - Any obsolete analytic-only WGSL helpers will be removed in **Step 11** once the mesh path is fully in use.
- **Verification (no dead code)**:
  - `npm test -- --run` and `npm run lint` pass.
  - Ensure new WGSL helpers are referenced (or will be referenced immediately in Step 08/09) to avoid accumulating unused shader code.

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


