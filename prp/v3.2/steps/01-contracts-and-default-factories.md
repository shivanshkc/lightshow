# Step 01 — Extend contracts and default factories for new primitives

## Step title and goal

Add the 4 new primitive types (Cylinder, Cone, Torus, Capsule) to the contracts and core model, and add default object factories, without changing rendering or UI yet.

## Scope of changes

- **Files/modules likely to change (best-effort)**:
  - `src/ports/commands.ts` (extend `PrimitiveType`; update `parseCommand` validation)
  - `src/core/types.ts` (extend `PrimitiveType`; add default factories for new primitives)
  - `src/store/sceneStore.ts` and/or `src/adapters/zustand/ZustandSceneBackingStore.ts` (support creation paths for new types if required by tests)
  - `src/__tests__/types.test.ts`
  - `src/__tests__/portsCommands.contract.test.ts` (if it asserts allowed primitives)
- **What must not change**:
  - No new dependencies
  - No changes to command versioning (`v: 1`)
  - No renderer/shader changes
  - No UI changes

## Implementation details

- Extend `PrimitiveType` unions to include: `cylinder`, `cone`, `torus`, `capsule`.
- Update `parseCommand` (`case 'object.add'`) to accept the new values and continue rejecting unknown primitives.
- Add factory functions in `src/core/types.ts` (names are suggestions; keep consistent with existing style):
  - `createDefaultCylinder()`
  - `createDefaultCone()`
  - `createDefaultTorus()`
  - `createDefaultCapsule()`
- Default dimensions MUST match `prp/v3.2/base.md` (FR2.2), encoded via the authoritative mapping (DM2).
  - Cylinder/Cone: store `scale = [1, 0.5, 1]`
  - Capsule: store `scale = [1, 1.5, 1]`
  - Torus: inner 0.5 outer 1 → `R=0.75`, `r=0.25` → store `scale=[0.75,0.25,0.25]`

## Unit test plan

- Update `src/__tests__/types.test.ts` to assert `PrimitiveType` includes the new values (compile-time or runtime checks as existing tests do).
- Update/add tests around `parseCommand` in `src/ports/commands.ts` to assert:
  - `object.add` accepts each new primitive
  - `object.add` rejects unknown primitive strings

## Documentation plan

- No documentation changes in this step.

## Cleanup

- **Obsolete code introduced in this step**: none expected.
- **Removal in this step**: none.
- **Deferred cleanup**: none.
- **Verification**: TypeScript build via test run + lint ensures no unused exports/imports introduced.

## Verification

### Automated

- Run: `npm test -- --run`
  - Expected: all tests pass
- Run: `npm run lint`
  - Expected: no lint errors

### Manual (Owner)

- None for this step (no UI behavior changes).

## Acceptance criteria for this step (checklist)

- [ ] `PrimitiveType` includes `cylinder`, `cone`, `torus`, `capsule` in both `@ports` and `@core`
- [ ] `parseCommand` accepts new primitives for `object.add` and rejects unknown values
- [ ] Default factory functions exist and match default dimensions/encoding in `prp/v3.2/base.md`
- [ ] Tests and lint are green

## Risks / edge cases for this step

- Any tests that assume the set of primitives is only sphere/cuboid may need updates.

## Rollback notes

- Revert the added union members and factories; restore `parseCommand` primitive validation to the previous set.

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


