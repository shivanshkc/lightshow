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


