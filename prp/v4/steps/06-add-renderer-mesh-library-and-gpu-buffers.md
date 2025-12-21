# Step 06 — Add renderer mesh library + GPU buffers (no shader switch yet)

## Step title and goal (1–2 sentences)
Introduce GPU-side buffers for a mesh library (geometry + BLAS) and instance data, wired into the renderer pipeline in a way that is TLAS-ready, without yet changing the raytracer shader’s primary intersection logic.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/renderer/RaytracingPipeline.ts`
  - `src/renderer/shaders/raytracer.wgsl` (bindings/struct additions only; keep existing trace path)
  - `src/core/SceneBuffer.ts` (may be replaced or extended; alternatively add a new buffer manager)
  - `src/__tests__/RaytracingPipeline.test.ts`, `src/__tests__/raytracer.test.ts`
- **What must not change**:
  - Do not remove analytic intersection functions yet (`intersectSphere`, `intersectBox`) in this step
  - UI behavior remains unchanged

## Implementation details
- Create a “mesh library” concept in renderer/core boundary:
  - For this release, the library contains only the six built-in primitive meshes.
  - Each primitive type maps to a stable `meshId` (u32).
- Add GPU buffers:
  - `meshMeta` buffer: per-mesh offsets/counts (vertex offset, index offset, BLAS node offset, etc.)
  - `vertex` buffer: packed positions (and optionally normals) for all meshes
  - `index` buffer: packed triangle indices for all meshes
  - `blasNodes` buffer: packed BVH nodes for all meshes
  - `instances` buffer: per-instance transforms/material/meshId + instance AABB
- Update `RaytracingPipeline`:
  - Allocate and upload these buffers when the scene changes (tied to snapshot objects reference, consistent with existing update rules).
  - Keep accumulation reset semantics unchanged.
- Update WGSL bindings to include these buffers but do not yet use them for tracing (so the app remains working while plumbing lands).

## Unit test plan
- **Update** `src/__tests__/raytracer.test.ts`:
  - Add assertions that new buffer bindings/structs exist (without removing existing expectations yet).
- **Update** `src/__tests__/RaytracingPipeline.test.ts`:
  - Assert pipeline initializes with new buffers without throwing.

## Documentation plan
- Update `src/renderer/README.md` if it documents buffer bindings; add a short section describing the new mesh buffers at a high level.

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - Load the app and confirm the scene still renders (still using analytic intersections at this step).

## Acceptance criteria for this step (checklist)
- [ ] Mesh library buffers exist and are uploaded without runtime errors.
- [ ] Shader includes bindings for the new buffers (not yet used).
- [ ] Rendering remains correct (analytic path still active).
- [ ] Tests and lint pass.

## Risks / edge cases for this step (brief)
- WGSL binding layout mismatches can break pipeline creation; keep changes additive and covered by tests.

## Rollback notes (what to revert if needed)
- Revert buffer additions and revert WGSL binding additions.

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


