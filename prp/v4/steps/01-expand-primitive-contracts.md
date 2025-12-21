# Step 01 — Expand primitive contracts (ports + core)

## Step title and goal (1–2 sentences)
Extend the primitive type contracts to include `cylinder`, `cone`, `capsule`, and `torus` across `@ports` and `@core` so commands, snapshots, and UI can reference them without type gaps.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/ports/commands.ts`
  - `src/core/types.ts`
  - `src/ports/index.ts`, `src/core/index.ts` (exports if needed)
  - Any tests that assert allowed primitive strings (best-effort search)
- **What must not change**:
  - No renderer/shader changes in this step
  - No UI changes in this step
  - No behavior changes besides accepting the new primitive strings in type-level contracts and command parsing

## Implementation details
- Add the new variants to `PrimitiveType` in both:
  - `src/ports/commands.ts`
  - `src/core/types.ts`
- Update `parseCommand` handling for `type === 'object.add'` in `src/ports/commands.ts` to accept all primitives defined by `PrimitiveType`.
- Ensure cross-module imports remain via public APIs (`@ports`, `@core`), per `docs/architecture.md`.

## Unit test plan
- **Update**: `src/__tests__/portsCommands.contract.test.ts` (or equivalent) to assert `parseCommand` accepts the four new values for `object.add`.
- **Add** (if missing): a focused unit test that round-trips each new primitive string through `parseCommand`.

## Documentation plan
- None (PRP is the source of truth; implementation docs can be updated later if needed).

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - None (no UI behavior change yet).

## Acceptance criteria for this step (checklist)
- [ ] `PrimitiveType` includes `cylinder`, `cone`, `capsule`, `torus` in both `@ports` and `@core`.
- [ ] `parseCommand` accepts `object.add` for all primitives in `PrimitiveType`.
- [ ] Tests and lint pass.

## Risks / edge cases for this step (brief)
- Missing a second `PrimitiveType` definition (there are multiple: ports vs core) causing type drift.

## Rollback notes (what to revert if needed)
- Revert changes to `PrimitiveType` unions and the `parseCommand` validation.

## Cleanup
- **Obsolete code introduced/identified in this step**: None.
- **Removal plan**:
  - **This step**: No removals.
  - **Deferred**: None.
- **Verification (no dead code)**:
  - `npm test -- --run` and `npm run lint` pass.
  - Ensure no duplicate/unused `PrimitiveType` definitions exist beyond the known `@ports` and `@core` contracts (best-effort grep during implementation).

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


