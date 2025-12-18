# Lightshow v2 — Milestones

This folder contains **Milestone PRPs** for v2 development.

v2 is a **behavior-preserving refactor** focused on **code organization**, **decoupling**, **contracts**, **mockability**, and **startup-time swappability** (no user-facing component picker), as defined in `prp/v2/base.md`.

## Workflow contract (how the AI must execute each milestone)

For each milestone document, the AI must follow this loop:

1. **Read & understand** the milestone (ask questions if needed).
2. **Update docs if needed**, then stop for **your review/approval** before coding.
3. For each **Mechanical Step** in order:
   - Implement the step
   - Add/adjust unit tests
   - Run the full test suite
   - Update docs if needed
   - Provide **manual test actions** for you
   - Propose a commit message; commit only after approval

## Constant manual smoke checklist (run after every Mechanical Step)

These manual checks are intentionally small and repeated frequently to ensure **no behavior/UX drift** during refactors:

- **Load / render**
  - App loads successfully and the viewport renders.
  - No console errors on load.
- **Selection**
  - Click an object in the viewport selects it.
  - Click empty space deselects.
  - `Esc` deselects.
- **Object operations**
  - Add a Sphere; it becomes selected.
  - Duplicate selection (`Ctrl/Cmd+D`) creates a copy.
  - Delete selection (`Delete`/`Backspace`) removes it; undo brings it back.
- **Transforms**
  - Change a numeric transform field (position or rotation) and see the scene update.
  - Undo/redo (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` / `Ctrl/Cmd+Y`) works.
- **Materials**
  - Change material type and a parameter (IOR or Intensity) and see a visible change.
- **Camera**
  - Orbit / pan / zoom works.
- **Performance sanity**
  - Interaction feels responsive (no obvious new hitches vs before the step).

> Milestones may add a small “addendum checklist” for milestone-specific changes.

## Milestone order (planned)

1. `milestone-01-baseline-and-guardrails.md` — Baseline + guardrails (bench + boundaries + docs skeleton)
2. `milestone-02-ports-and-boundaries.md` — Ports/contracts + module boundary enforcement (no behavior change)
3. `milestone-03-kernel-shell-and-wiring.md` — Kernel shell wired; adapters bridging existing code
4. `milestone-04-slice-selection.md` — Migrate selection/picking slice behind kernel contracts
5. `milestone-05-slice-transforms-and-gizmos.md` — Migrate transforms + gizmo interactions slice
6. `milestone-06-slice-history-and-commands.md` — Migrate undo/redo/history slice fully into kernel
7. `milestone-07-renderer-decoupling-and-cleanup.md` — Remove legacy coupling, finalize docs/enforcement, perf gate enforced

Notes:
- The AI may propose reordering/splitting/merging milestones, but must update docs and get approval before coding.


