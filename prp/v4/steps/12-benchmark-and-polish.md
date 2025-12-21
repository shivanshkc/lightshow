# Step 12 — Benchmark gate, polish, and finalize docs

## Step title and goal (1–2 sentences)
Run the benchmark gate after Owner approval, address any material regressions, and finalize any documentation updates needed to reflect the mesh-based ray tracing architecture.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - Performance-oriented tweaks in `src/renderer/` and `src/core/` (only if benchmarks reveal regressions)
  - `src/renderer/README.md` (final update)
  - `docs/architecture.md` / `docs/components.md` only if new modules/exports meaningfully change “where to find X”
- **What must not change**:
  - No scope expansion: do not add TLAS, imports, or new primitives
  - No UX redesign beyond what’s already required

## Implementation details
- After Owner approval for this step:
  - Run `npm run bench` and compare results vs baseline (stored under `benchmarks/`).
  - If regressions are material, make targeted optimizations:
    - reduce per-ray work (early exits, tighten AABB tests)
    - ensure no per-frame allocations were introduced
    - confirm BLAS node traversal is efficient and stack bounded
- Ensure documentation is accurate:
  - renderer uses instance AABB + BLAS traversal
  - TLAS-ready note remains accurate and does not promise TLAS in this release

## Unit test plan
- No new tests required unless optimizations change behavior; if behavior changes, add tests that lock correctness.

## Documentation plan
- Update `src/renderer/README.md` to reflect the final architecture.
- If any new module entrypoints were added, update `docs/architecture.md` “where to find X” section accordingly.

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
  - After Owner approval: `npm run bench` (expected: no material regression relative to baseline)
- **Manual (Owner)**:
  - Repeat a short smoke pass:
    - load app
    - verify Cornell box scene renders
    - add each primitive at least once
    - apply glass to at least one object and verify refraction
    - verify selection/picking works

## Acceptance criteria for this step (checklist)
- [ ] Tests and lint pass.
- [ ] Benchmarks run after Owner approval and show no material regression.
- [ ] Documentation reflects the final mesh-based architecture.

## Risks / edge cases for this step (brief)
- Benchmark variance on different machines; interpret results relative to local baseline and repeat if noisy.

## Rollback notes (what to revert if needed)
- Revert any performance tweaks that caused correctness regressions; keep correctness as the primary goal.

## Cleanup
- **Obsolete code introduced/identified in this step**:
  - Any leftover unused exports/re-exports from intermediate rollout steps (especially `index.ts` barrels).
  - Any debug-only helpers or temporary code paths added for rollout safety that are no longer needed after Step 11.
  - Any stale documentation references that mention analytic intersections or pre-mesh scene buffers.
- **Removal plan**:
  - **This step**: Final repo hygiene pass:
    - delete any remaining unused code/assets/docs identified during the rollout
    - ensure there is exactly one active intersection path (mesh-based)
  - **Deferred**: None (this is the final cleanup gate).
- **Verification (no dead code)**:
  - `npm test -- --run` and `npm run lint` pass.
  - After Owner approval: `npm run bench` passes without material regression.
  - Best-effort repo-wide search confirms removed/obsolete symbols do not exist:
    - analytic intersection identifiers (sphere/box)
    - any temporary rollout-only identifiers documented in earlier steps

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


