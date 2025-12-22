# Step 06 — Final cleanup, regression sweep, and benchmarks

## Step title and goal

Remove any dead/obsolete code introduced during the rollout, ensure all tests/lint pass, and (after Owner approval) run benchmarks to confirm no material regressions.

## Scope of changes

- **Files/modules likely to change (best-effort)**:
  - Any files touched in Steps 01–05, only to remove unused code/exports and tighten invariants
  - `src/__tests__/*` (remove obsolete tests; update to final behavior)
  - Potentially `src/core/index.ts`, `src/components/index.ts` (barrel exports) if new exports were added and need consolidation
- **What must not change**:
  - No new functionality beyond what is specified in `prp/v3.2/base.md`
  - No new dependencies
  - No architecture violations

## Implementation details

- Perform a dead-code sweep:
  - Remove any temporary helpers, debug flags, or unused functions introduced during rollout.
  - Remove unused exports/re-exports from module entrypoints.
  - Ensure no alternate/legacy objectType mapping paths remain.
- Ensure tests reflect final expected behavior:
  - Update any tests that were temporarily loosened during rollout.
  - Ensure coverage exists for:
    - command parsing acceptance of new primitives
    - CPU picking for new primitives
    - WGSL intersection function presence and dispatch
    - UI transform mappings for new primitives

## Unit test plan

- Run full suite and ensure all tests pass:
  - `npm test -- --run`

## Documentation plan

- If any assumptions in `prp/v3.2/base.md` were resolved (e.g., cone convention), update `base.md` accordingly **only with Owner approval**.

## Cleanup

- **Obsolete code introduced in this step**: none.
- **Removal in this step**:
  - Anything unused/obsolete discovered by lint, TypeScript, or test expectations.
- **Deferred cleanup**: none; this is the final cleanup step.
- **Verification**:
  - `npm test -- --run` passes
  - `npm run lint` passes
  - (after Owner approval) `npm run bench` passes

## Verification

### Automated

- Run: `npm test -- --run`
  - Expected: all tests pass
- Run: `npm run lint`
  - Expected: no lint errors

### Manual (Owner)

- Quick smoke:
  - Add each new primitive and confirm it renders and can be selected.
  - Adjust parameters in Transform panel and confirm rendering updates.

### Benchmarks (Owner approval required)

- After Owner approval of this step, run: `npm run bench`
  - Expected: no material regression gates violated.

## Acceptance criteria for this step (checklist)

- [ ] No dead code remains (unused exports, unused helpers, obsolete paths removed)
- [ ] Tests are green (`npm test -- --run`)
- [ ] Lint is green (`npm run lint`)
- [ ] After Owner approval: benchmarks are green (`npm run bench`)

## Risks / edge cases for this step

- Cleanup may remove code that a later step implicitly relied on; validate via tests and lint.

## Rollback notes

- Revert cleanup commit if it removes required behavior; re-apply cleanup in smaller chunks.

## Required agent workflow (MANDATORY)

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


