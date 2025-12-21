# Step 09-5 — Optimize WGSL BLAS traversal (closest-hit pruning + near-first ordering)

## Step title and goal (1–2 sentences)
Improve mesh-raytracing performance by adding distance-based BVH pruning and near-first traversal ordering in WGSL BLAS traversal, without changing scene semantics or material behavior.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/renderer/shaders/raytracer.wgsl`
  - `src/__tests__/raytracer.test.ts`
- **What must not change**:
  - No changes to kernel/ports/UI behavior
  - No changes to primitive meshes, BVH build algorithm, or GPU buffer layouts
  - Must preserve visual correctness of Step 09 (same hits/material behavior, only faster)

## Implementation details

### A) Make AABB intersection usable for pruning
- Ensure WGSL `intersectAabb(...)` returns `(hit, tMin, tMax)` where:
  - `tMin` is the near intersection distance along the ray
  - `tMax` is the far intersection distance along the ray
- Update BLAS traversal to use `tMin/tMax` for **distance-based pruning**:
  - Skip a node if `!hit`
  - Skip a node if `tMin > closestT` (current best hit distance in local ray parameterization)

### B) Traverse near-first (so closest hits are found early)
- For interior nodes:
  - Evaluate AABB hits for both children (or compute an ordering key) and push them onto the explicit stack in an order that causes the **nearer child** to be processed first (LIFO stack: push farther first, then nearer).
  - If one child misses, push only the other.
  - If both miss, push none.

### C) Reduce leaf work using closest-hit distance
- When iterating triangles in a leaf:
  - Skip triangle tests whose AABB/leaf `tMin` already exceeds `closestT` (coarse pruning).
  - If triangle intersection returns `t >= closestT`, ignore it immediately.

### D) Determinism and safety
- Preserve an explicit, bounded stack.
- Define overflow behavior explicitly:
  - If stack would overflow, stop traversal and return best-so-far hit (do not crash).

## Unit test plan
- **Update** `src/__tests__/raytracer.test.ts` to assert the shader includes:
  - pruning logic that references `tMin` and a “closest” distance inside `intersectMeshBlas`
  - near-first ordering logic (best-effort: assert presence of code patterns like comparing child `tMin` values before pushing)

> Note: these are shader-content tests (string asserts). Correctness/perf will be verified manually + via benchmark gate.

## Documentation plan
- None.

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - Load the default Cornell box scene.
  - Compare FPS in two camera positions:
    - zoomed out (box smaller)
    - zoomed in / inside the box (previously very slow)
  - Confirm:
    - the image is visually consistent with Step 09 (no new artifacts)
    - FPS regression is improved, especially in the “inside box” scenario

## Acceptance criteria for this step (checklist)
- [ ] BLAS traversal uses `tMin > closestT` pruning.
- [ ] BLAS traversal processes near child before far child (near-first ordering).
- [ ] Tests and lint pass.
- [ ] No new visual correctness regressions in Cornell box at typical viewpoints.

## Risks / edge cases for this step (brief)
- Incorrect pruning can cause “missing triangles” artifacts (holes/light leaks). This must be caught via manual Cornell box verification and not merged if visible.
- Care must be taken to keep pruning consistent with the ray parameterization in local space.

## Rollback notes (what to revert if needed)
- Revert only the BLAS traversal ordering/pruning changes in WGSL; keep the mesh tracing path intact.

## Cleanup
- **Obsolete code introduced/identified in this step**: None.
- **Removal plan**:
  - **This step**: No removals.
  - **Deferred**: None.
- **Verification (no dead code)**:
  - `npm test -- --run` and `npm run lint` pass.
  - Ensure any new helper structs/functions introduced are referenced by `intersectMeshBlas` (no unused WGSL).

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


