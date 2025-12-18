# Milestone 03 — Kernel Shell and Wiring (v2)

This milestone introduces a working **Kernel shell** (the app brain) and rewires the app so UI/Input/Renderer interact via ports.

The kernel may initially delegate to existing implementation via adapters, but the dependency direction must be correct.

This milestone must not change user-facing behavior.

## Goal (definition of done)

- The app runs end-to-end with:
  - UI calling `dispatch(Command)` for writes
  - UI reading from Kernel query API for reads
  - Renderer updates triggered via Kernel notifications (not direct Zustand coupling)
  - Input controllers translating DOM input into Commands
- Kernel exists as the single “authority” for state transitions (even if it bridges to existing stores initially).
- Startup-time swapping is possible for dev/tests (no user-facing menu):
  - alternate renderer stub
  - alternate input controller mock
  - alternate UI driver mock (where applicable)

## Non-goals (explicit)

- No behavior/UX changes.
- No functional feature additions.
- No performance regression.

## Mechanical Steps

### Step 3.1 — Implement Kernel shell that satisfies ports

**Intent**
- Create a Kernel implementation that compiles and can be used by adapters.

**Implementation expectations**
- Kernel must expose:
  - dispatch(Command)
  - queries
  - minimal event subscription
- Kernel must not depend on React/WebGPU/Zustand.

**Unit tests**
- Kernel contract tests (dispatch/query/event) using a mock backing store.

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

### Step 3.2 — Create adapters bridging current state (temporary scaffolding)

**Intent**
- Preserve behavior while moving call sites to the new contracts.

**Implementation expectations**
- Provide a bridge that maps:
  - existing store operations → kernel state transitions
  - kernel queries → existing state snapshot (allocation-light)

**Unit tests**
- Adapter tests verifying mapping correctness.

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

### Step 3.3 — Rewire UI to use kernel queries and commands

**Intent**
- UI becomes a “dumb driver” that renders from queries and writes via commands.

**Implementation expectations**
- Remove direct cross-module imports that violate boundaries.
- Ensure no user-visible changes.

**Unit tests**
- Update existing component tests as needed to use kernel mocks.

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

### Step 3.4 — Rewire input handling into InputController(s)

**Intent**
- Separate DOM event handling from UI components (supports AI controller later).

**Implementation expectations**
- Input controllers translate:
  - mouse/touch/keyboard → Commands
- Keep behavior identical.

**Unit tests**
- Unit tests for key bindings and input-to-command translation.

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist (pay special attention to selection and camera).

---

### Step 3.5 — Rewire renderer integration to kernel notifications (no direct store subscription)

**Intent**
- Renderer should not import Zustand stores directly.

**Implementation expectations**
- Respect base requirements:
  - no deep-copy scene updates
  - no per-frame rebuilds
  - only committed edits invalidate render; selection alone must not reset

**Unit tests**
- Contract tests for renderer adapter integration:
  - render invalidation only on committed edits

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

## Milestone exit criteria

- [ ] App works end-to-end with kernel ports.
- [ ] Renderer is decoupled from direct store imports.
- [ ] Input is mediated through InputController(s).
- [ ] Tests pass; behavior unchanged; perf baseline within thresholds.


