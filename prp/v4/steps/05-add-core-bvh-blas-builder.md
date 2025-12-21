# Step 05 — Add core BVH (BLAS) builder for triangle meshes

## Step title and goal (1–2 sentences)
Implement a deterministic BVH builder in `@core` that builds a BLAS over mesh triangles, producing a GPU-friendly node buffer and triangle references for ray traversal.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/core/` (new BVH/AABB utilities, exported via `src/core/index.ts`)
  - `src/__tests__/` (new BVH unit tests)
- **What must not change**:
  - No renderer/shader changes
  - No UI changes

## Implementation details
- Define an AABB type and helpers in `@core`:
  - merge/union
  - ray-AABB intersection (CPU-side for tests/picking if needed later)
  - compute triangle AABB
- Implement a BVH builder:
  - Inputs: mesh positions + indices
  - Output:
    - `nodes`: a flat array suitable for GPU (e.g., each node stores `aabbMin`, `aabbMax`, and either child indices or triangle range)
    - `triIndices` or `triRefs`: a triangle index list ordered for leaf ranges
  - Splitting strategy must be deterministic (e.g., midpoint split by largest axis, or median split by centroid along largest axis).
  - Leaf criteria must be explicit (e.g., `maxTrisPerLeaf` = 4 or 8) and documented.
- Export these utilities from `src/core/index.ts`.

## Unit test plan
- **Add** unit tests that verify:
  - Node buffer structure invariants (root index is 0; child indices are within bounds; leaf ranges are within triangle count).
  - BVH is deterministic for the same input.
  - Every triangle is included exactly once in the BVH leaf ranges.
  - AABB correctness: each node AABB contains all triangles in its subtree (validated by recomputing subtree bounds in test code).

## Documentation plan
- If a `src/core/README.md` exists and documents geometry utilities, add a short section describing:
  - what BVH builder is
  - what is exported and intended for renderer consumption

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - None.

## Acceptance criteria for this step (checklist)
- [ ] `@core` exports a BVH builder that produces deterministic BLAS data for triangle meshes.
- [ ] Unit tests validate BVH correctness and determinism.
- [ ] Tests and lint pass.

## Risks / edge cases for this step (brief)
- BVH builder bugs can be subtle; tests must validate containment and triangle coverage.
- Large recursion depth: implement iteratively or ensure recursion is safe for expected mesh sizes.

## Rollback notes (what to revert if needed)
- Revert BVH/AABB utilities and their unit tests.

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


