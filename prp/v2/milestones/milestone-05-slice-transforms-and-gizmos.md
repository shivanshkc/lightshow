# Milestone 05 — Slice Migration: Transforms and Gizmos (v2)

This milestone migrates the **transform editing** slice (numeric inputs + gizmo interactions) behind kernel contracts.

## Goal (definition of done)

- Transform editing behavior remains identical to v1:
  - numeric input commit behavior remains the same
  - gizmo behavior remains the same (hover/drag/modes)
  - camera disables/enables during gizmo drag as before
  - undo grouping remains identical
- All transform updates occur via commands and are reflected via queries.
- Gizmo interaction logic is separated from UI components into input/controllers where applicable.

## Non-goals (explicit)

- No changes to transform semantics (units, conventions, snapping behavior, etc.).
- No changes to visuals/UX of gizmos.

## Mechanical Steps

### Step 5.1 — Define transform commands and query snapshots

**Intent**
- Lock transform mutation and read APIs behind the kernel.

**Unit tests**
- Contract tests for:
  - set position/rotation/scale commands
  - expected query snapshot updates

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist (focus transforms).

---

### Step 5.2 — Migrate numeric transform editing behind kernel

**Intent**
- UI inputs send commands; UI renders values from queries.

**Unit tests**
- Update existing NumberInput/component tests to use kernel mocks.

**Run tests**
- `npm test`

**Manual verification**
- Edit numeric values; confirm identical commit behavior.

---

### Step 5.3 — Migrate gizmo drag updates behind kernel (write path)

**Intent**
- Gizmo drag produces command(s) that update transforms through the kernel.

**Unit tests**
- Unit tests for gizmo drag translation logic and command emission.

**Run tests**
- `npm test`

**Manual verification**
- Drag translate/rotate/scale; confirm identical behavior.

---

### Step 5.4 — Ensure render invalidation rules remain correct

**Intent**
- Only committed edits invalidate render; selection does not.

**Unit tests**
- Contract tests for render invalidation events triggered by transform commits.

**Run tests**
- `npm test`

**Manual verification**
- Confirm selection does not reset accumulation; transform commits do (matching current behavior).

---

## Milestone exit criteria

- [ ] Transform editing slice is behind kernel contracts.
- [ ] Gizmo interactions are mediated through controllers/commands (no direct store coupling).
- [ ] Tests pass; behavior unchanged; perf gate within thresholds.


