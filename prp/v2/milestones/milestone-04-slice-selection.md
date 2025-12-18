# Milestone 04 — Slice Migration: Selection (v2)

This milestone migrates the **selection/picking** slice behind kernel contracts.

This is the first “vertical slice” migration: move one area fully behind ports while keeping behavior identical.

## Goal (definition of done)

- Selection behavior is identical to v1:
  - viewport click selects closest visible hit
  - clicking empty space deselects
  - `Esc` deselects
  - object list selection works
  - hidden objects not selectable
- Selection logic lives in the kernel slice (no UI/renderer coupling).
- UI and input controllers use commands/queries for selection, not store internals.

## Non-goals (explicit)

- No UX changes (no multi-select, no new selection affordances).
- No changes to raycasting math/precision beyond refactoring.

## Mechanical Steps

### Step 4.1 — Define selection commands/queries/events precisely

**Intent**
- Lock the contract for selection slice.

**Implementation expectations**
- Commands: select/deselect, select-by-hit-result, etc.
- Queries: selected id, selected object snapshot, selection state.
- Events: selection changed (if required) without triggering render invalidation.

**Unit tests**
- Contract tests for selection commands and query results.

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist (focus on selection).

---

### Step 4.2 — Move viewport picking decision behind kernel boundary

**Intent**
- UI/input should not decide “which object is hit” by reaching into scene internals across boundaries.

**Implementation expectations**
- Keep behavior identical.
- Maintain performance (no per-frame full-scene rebuild).

**Unit tests**
- Unit tests for selection decision logic using deterministic scene fixtures.

**Run tests**
- `npm test`

**Manual verification**
- Select various objects; confirm closest-hit behavior.

---

### Step 4.3 — Integrate object list selection via commands/queries

**Intent**
- Object list selection becomes a standard command path, not store direct mutation.

**Unit tests**
- Existing UI tests adjusted to use kernel mock/query.

**Run tests**
- `npm test`

**Manual verification**
- Select from list; confirm viewport selection updates.

---

## Milestone exit criteria

- [ ] Selection slice is fully behind kernel contracts.
- [ ] Tests pass and behavior unchanged.
- [ ] Perf gate within thresholds.


