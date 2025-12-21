# Step 09 — Switch scene tracing to mesh intersections (instance loop + AABB + BLAS)

## Step title and goal (1–2 sentences)
Replace the shader’s scene tracing logic to use per-instance AABB culling and per-mesh BLAS traversal for all primitives, while preserving material behavior (plastic/metal/glass/light) and selection highlighting.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/renderer/shaders/raytracer.wgsl`
  - `src/renderer/RaytracingPipeline.ts` (ensure instance buffer/meshId mapping is correct)
  - `src/core/SceneBuffer.ts` (if still used; otherwise the new instance buffer manager)
  - `src/__tests__/raytracer.test.ts`
- **What must not change**:
  - Kernel/ports contracts and event semantics
  - UI behavior beyond having the new primitives available (already done in earlier steps)

## Implementation details
- Implement a new `traceScene(ray)` that:
  - iterates visible instances (current behavior: instance list derived from snapshot visible objects)
  - performs AABB test per instance; skip if miss
  - transforms ray into instance-local space:
    - inverse rotation (as today)
    - inverse translation
    - inverse scale (to support non-uniform scaling)
  - calls `intersectMeshBlas(localRay, meshId)`
  - converts hit to world-space hit point and computes world-space `t`:
    - `pWorld = transformLocalToWorld(pLocal)`
    - `tWorld = dot(pWorld - ray.origin, ray.direction)` (ray.direction must be normalized)
  - computes world-space normal with correct handling under non-uniform scale (inverse-transpose for rotation+scale)
- Ensure selection highlighting logic still uses:
  - a stable non-jittered highlight ray
  - `selectedObjectIndex` interpreted as visible-index
- Keep material shading behavior identical (light terminates; metal reflects; glass refracts; plastic diffuse).

### Performance follow-up (explicit)
This step focuses on correctness and switching the active tracing path. BLAS traversal optimizations (closest-hit pruning and near-first ordering) are explicitly handled in **Step 09-5 — Optimize WGSL BLAS traversal**.

## Unit test plan
- **Update** `src/__tests__/raytracer.test.ts`:
  - Stop asserting presence of `intersectSphere`/`intersectBox` only when the implementation actually removes them (that removal may be Step 11).
  - Add assertions that the shader’s `traceScene` uses mesh intersection path.
- **Update** `src/__tests__/integration.test.ts` (or add if missing):
  - Create a minimal scene with one object of each primitive type and ensure the renderer pipeline can compile/run in the test harness (smoke-level).

## Documentation plan
- Update `src/renderer/README.md` to describe at a high level:
  - instance loop + AABB cull + BLAS traversal
  - TLAS-ready design note (future)

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - Load the app.
  - Add one instance of each primitive.
  - Assign materials: plastic, metal, glass, light (at least one glass and one light).
  - Confirm:
    - objects render
    - glass shows refraction consistent with expectations
    - selection highlight appears on selected objects

## Acceptance criteria for this step (checklist)
- [ ] Scene tracing uses mesh intersections for all primitives.
- [ ] Material behavior remains consistent.
- [ ] Selection highlight works.
- [ ] Tests and lint pass.

## Risks / edge cases for this step (brief)
- Non-uniform scaling requires careful normal transform; incorrect normals will break glass behavior.
- Incorrect `tWorld` computation can cause wrong closest-hit ordering.

## Rollback notes (what to revert if needed)
- Revert `traceScene` mesh switch; keep mesh buffers in place for later iteration.

## Cleanup
- **Obsolete code introduced/identified in this step**:
  - Analytic intersection functions (`intersectSphere`, `intersectBox`) and any analytic-only per-object logic become obsolete once `traceScene` is switched, but may still exist temporarily for safe sequencing.
- **Removal plan**:
  - **This step**: Do not delete analytic code yet if tests or other paths still reference it; keep the removal strictly sequenced.
  - **Deferred**:
    - Remove analytic WGSL intersections and any analytic-only CPU helpers in **Step 11 — Remove analytic intersections and finalize uniform mesh tracing**.
- **Verification (no dead code)**:
  - `npm test -- --run` and `npm run lint` pass.
  - `raytracer.wgsl` no longer routes `traceScene` through analytic intersections.
  - Ensure there are no unused WGSL helpers introduced by the mesh switch (best-effort grep for unused functions, plus shader-content tests).

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


