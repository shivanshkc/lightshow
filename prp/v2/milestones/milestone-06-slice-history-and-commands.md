# Milestone 06 — Slice Migration: History / Undo-Redo and Command Semantics (v2)

This milestone migrates the **history (undo/redo)** slice behind kernel contracts and ensures command semantics align with history grouping.

## Goal (definition of done)

- Undo/redo behavior remains identical to v1:
  - same grouping rules for continuous interactions
  - same depth/limits
  - same keyboard shortcuts behavior
- History lives inside the kernel (or kernel-owned subsystem), not in UI/store middleware.
- Commands become the canonical unit of history.

## Non-goals (explicit)

- No changes to history UX.
- No changes to shortcut mappings.

## Mechanical Steps

### Step 6.1 — Define history commands and query surface

**Intent**
- Define `Undo`, `Redo`, and history snapshot queries.

**Unit tests**
- Contract tests for:
  - undo/redo availability flags
  - correct state rollback/rollforward for core operations

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist (focus on undo/redo).

---

### Step 6.2 — Migrate history ownership into kernel

**Intent**
- Kernel owns history stacks and grouping, rather than UI/store middleware.

**Unit tests**
- Unit tests that validate:
  - grouping for continuous transforms (one history step per commit)
  - discrete actions create immediate steps

**Run tests**
- `npm test`

**Manual verification**
- Perform sequences of edits; undo/redo matches current behavior exactly.

---

### Step 6.3 — Remove/retire legacy history middleware usage (or adapt it behind kernel)

**Intent**
- Ensure no external module depends directly on legacy history mechanisms.

**Unit tests**
- Existing history tests updated accordingly.

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

## Milestone exit criteria

- [ ] History slice is behind kernel contracts.
- [ ] Undo/redo behavior is identical.
- [ ] Tests pass; perf gate within thresholds.


