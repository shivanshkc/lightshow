# Milestone 02 — Ports, Contracts, and Boundary Enforcement (v2)

This milestone defines and locks the **public contracts** (ports) for v2 and strengthens boundary enforcement so later refactors are safe and reviewable.

This milestone must not change user-facing behavior.

## Goal (definition of done)

- The repo contains the initial **port contracts** for:
  - Kernel write API (**Commands**)
  - Kernel read API (**Queries**)
  - Kernel events (**minimal notifications**)
  - Renderer adapter contract
  - Input controller contract
  - UI driver contract (where applicable)
- Contracts are:
  - small, explicit, and documented
  - testable via **contract tests**
  - enforced via public API-only imports (`index.ts`) and lint rules
- Boundary lint rules are enabled and the codebase begins conforming to them (with temporary allowances only if documented).

## Non-goals (explicit)

- No behavior/UX changes.
- No refactor of rendering correctness or interaction behavior.
- No large-scale file moves into the final folder structure yet (that comes after contracts exist).

## Mechanical Steps

### Step 2.1 — Create v2 module skeletons + public APIs (`index.ts`)

**Intent**
- Establish “places” for future code to live, with public API entry points from day one.

**Implementation expectations**
- Add top-level module folders (names may evolve; must align with `prp/v2/base.md`):
  - kernel (application core)
  - ports (shared contracts/types)
  - adapters (ui/input/renderer implementations)
  - docs placeholders (if not already created)
- Add `index.ts` public API for each module.

**Unit tests**
- None required.

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

### Step 2.2 — Define Command types (write contract)

**Intent**
- Define the canonical “write language” of the app: commands that represent user intents.

**Implementation expectations**
- Commands must cover all existing v1 behaviors (at least conceptually):
  - selection, add/delete/duplicate/rename, transform edits, material edits, environment edits, undo/redo, etc.
- Commands must be **stable** and **versionable** (avoid leaking UI details like “mouse down”).

**Unit tests**
- Contract tests asserting:
  - command schema is stable and serializable (if desired for logging)
  - unknown commands are rejected safely (behavior preserved)

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

### Step 2.3 — Define Query API (explicit reads; performance-safe)

**Intent**
- Define the canonical “read language” of the app.

**Implementation expectations**
- Queries must be:
  - read-only
  - coarse-grained enough to avoid “death-by-thousand-calls”
  - allocation-light (no deep clones)
- Document query design rules (link to `prp/v2/base.md` Section 7).

**Unit tests**
- Contract tests that ensure query methods:
  - exist
  - return stable shapes (snapshot contracts)

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

### Step 2.4 — Define minimal eventing contract

**Intent**
- Provide the smallest useful notification set:
  - “state changed”
  - “render invalidated”
  - optional diagnostics events

**Implementation expectations**
- Must not become a parallel state system.
- Must not encourage excessive fine-grained events.

**Unit tests**
- Contract tests that:
  - subscription works
  - events are delivered in order
  - unsubscribe works

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

### Step 2.5 — Tighten boundary enforcement: public API only + no cycles

**Intent**
- Enforce module boundaries so future refactors can’t “cheat”.

**Implementation expectations**
- Strengthen lint rules added in Milestone 01:
  - disallow deep imports across modules
  - enforce dependency directions (kernel has no React/WebGPU/Zustand deps)
  - disallow cycles

**Unit tests**
- None required.

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

## Milestone exit criteria

- [ ] Ports exist and are documented.
- [ ] Contract tests exist for commands/queries/events.
- [ ] Boundary rules are enforced (with any temporary exceptions documented).
- [ ] All tests pass; behavior unchanged (smoke checklist).


