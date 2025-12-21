# Step 02 — Add scene/backing-store support for new primitives

## Step title and goal (1–2 sentences)
Enable creating `cylinder`, `cone`, `capsule`, and `torus` scene objects via the existing command flow (`object.add`) while preserving the decoupled kernel → backing store architecture.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/core/types.ts` (default factory functions for new primitives)
  - `src/store/sceneStore.ts` (add methods to create new objects)
  - `src/adapters/zustand/ZustandSceneBackingStore.ts` (map `object.add` to new store methods)
- **What must not change**:
  - No renderer/shader changes
  - No UI changes
  - Do not change command/event/query contracts beyond what was updated in Step 01

## Implementation details
- Add factory functions in `src/core/types.ts` analogous to `createDefaultSphere` / `createDefaultCuboid`:
  - `createDefaultCylinder()`, `createDefaultCone()`, `createDefaultCapsule()`, `createDefaultTorus()`
  - Each returns `Omit<SceneObject, 'id'>` with sensible defaults and `visible: true`.
- Update `src/store/sceneStore.ts`:
  - Add methods: `addCylinder`, `addCone`, `addCapsule`, `addTorus`.
  - Follow existing patterns:
    - enforce `LIMITS.maxObjects`
    - generate name like `Cylinder N`, `Cone N`, etc.
- Update `src/adapters/zustand/ZustandSceneBackingStore.ts`:
  - Extend the `object.add` switch case to route to the correct store method for each primitive.
- Ensure changes remain adapter-only: kernel stays unaware of Zustand.

## Unit test plan
- **Update**: `src/adapters/__tests__/ZustandSceneBackingStore.test.ts`
  - Add coverage that `object.add` for each new primitive returns `stateChanged=true` and `renderInvalidated=true` when under limit.
- **Update** (if present): any store tests that assume only sphere/cuboid exist.

## Documentation plan
- None.

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - None (UI not wired yet).

## Acceptance criteria for this step (checklist)
- [ ] Scene store can add Cylinder/Cone/Capsule/Torus via dedicated methods.
- [ ] `object.add` is correctly routed by `ZustandSceneBackingStore`.
- [ ] Tests and lint pass.

## Risks / edge cases for this step (brief)
- Naming counts should be per-primitive type (consistent with existing `Sphere N` / `Cuboid N` behavior).
- Ensure default transforms/scales do not create degenerate geometry (e.g., zero scale).

## Rollback notes (what to revert if needed)
- Revert new factory functions, store methods, and adapter routing changes.

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


