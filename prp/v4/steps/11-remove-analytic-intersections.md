# Step 11 — Remove analytic intersections and finalize uniform mesh tracing

## Step title and goal (1–2 sentences)
Remove analytic primitive intersection code paths (sphere/box) from WGSL and CPU picking, ensuring all primitives—including sphere and cuboid—are intersected via meshes.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/renderer/shaders/raytracer.wgsl`
  - `src/__tests__/raytracer.test.ts`
  - `src/core/math.ts` (remove `intersectRaySphere`/`intersectRayBox` if no longer used)
  - `src/core/Raycaster.ts`
  - Any tests referencing analytic intersection function names
- **What must not change**:
  - Material model semantics
  - Kernel contracts and renderer dependency injection patterns

## Implementation details
- Remove `intersectSphere` and `intersectBox` (and any analytic-only helper code) from `raytracer.wgsl`.
- Update `traceScene` to rely exclusively on the mesh-based intersection path.
- Remove CPU analytic intersection helpers only if they are no longer used anywhere.
- Ensure shader compilation and pipeline creation remain stable after removal.

## Unit test plan
- **Update** `src/__tests__/raytracer.test.ts`:
  - Remove assertions expecting `fn intersectSphere` and `fn intersectBox`.
  - Add assertions ensuring mesh path is present (triangle intersection + BLAS traversal).
- **Update** any CPU tests expecting analytic functions.

## Documentation plan
- Update `src/renderer/README.md` to remove references to analytic primitive intersections if present.

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - Confirm the default Cornell box scene renders.
  - Confirm glass sphere and cuboids still look correct (refraction/reflection).
  - Add new primitives and confirm they render.

## Acceptance criteria for this step (checklist)
- [ ] No analytic primitive intersection functions remain in WGSL.
- [ ] CPU picking does not use analytic intersections.
- [ ] Tests and lint pass.

## Risks / edge cases for this step (brief)
- Removing code can uncover hidden dependencies (tests, helper functions). Use grep to ensure no dead references remain.

## Rollback notes (what to revert if needed)
- Revert shader and CPU intersection removals to restore analytic path temporarily.

## Cleanup
- **Obsolete code introduced/identified in this step**:
  - Analytic WGSL intersection functions: `intersectSphere`, `intersectBox` and any related analytic-only helpers.
  - CPU analytic helpers in `@core` (`intersectRaySphere`, `intersectRayBox`) if no longer referenced.
  - Tests asserting analytic intersection function presence.
  - Any unused buffer managers or data paths that existed solely for analytic tracing (if applicable).
- **Removal plan**:
  - **This step**: Perform the actual deletions for analytic intersection paths and update tests/docs accordingly.
  - **Deferred**:
    - If any analytic helper is still referenced for non-raytracing features, do not delete it; instead document the remaining dependency explicitly and schedule removal in **Step 12** after resolving that dependency.
- **Verification (no dead code)**:
  - `npm test -- --run` and `npm run lint` pass.
  - Repo-wide search confirms no references remain:
    - `intersectSphere`, `intersectBox`
    - `intersectRaySphere`, `intersectRayBox`
  - `src/renderer/README.md` no longer references analytic primitive intersections (if it did).

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


