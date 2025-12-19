# Milestone 07 — Renderer Decoupling, Cleanup, and Hardening (v2)

This milestone completes v2 by removing remaining legacy coupling, hardening boundaries, and finalizing documentation and performance gates.

## Goal (definition of done)

- Renderer is fully behind adapter contracts and does not import kernel-internal details or UI/state tooling.
- All legacy “shortcut paths” are removed:
  - no direct store imports from renderer/UI/input (outside approved adapters)
  - no deep cross-module imports
- Documentation is complete enough that each module is independently understandable.
- Benchmarks are stable and enforced.

## Non-goals (explicit)

- No behavior/UX changes.
- No new features.

## Mechanical Steps

### Step 7.1 — Finalize renderer adapter boundaries (no store singletons)

**Intent**
- Ensure renderer does not directly subscribe to global state singletons.

**Unit tests**
- Contract tests for renderer adapter integration remain passing.

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

### Step 7.2 — Remove legacy coupling and tighten lint rules (no exceptions)

**Intent**
- Remove any temporary boundary exceptions introduced during migration.

**Unit tests**
- None beyond suite.

**Run tests**
- `npm test`

**Manual verification**
- Constant smoke checklist.

---

### Step 7.3 — Complete documentation (“where to find X”)

**Intent**
- Make the project understandable for humans and teams.

**Implementation expectations**
- Fill out:
  - `docs/architecture.md`
  - `src/README.md`
  - per-module READMEs

**Unit tests**
- None.

**Run tests**
- `npm test`

---

### Step 7.4 — Enforce performance gate

**Intent**
- Ensure v2 meets the no-regression bar.

**Implementation expectations**
- Benchmark command exists and is documented.
- Baseline exists; thresholds enforced:
  - TTFF <= +10% regression
  - Orbit median FPS >= -10% regression

**Unit tests**
- Unit tests for benchmark aggregation/threshold logic (if any).

**Run tests**
- `npm test`

**Manual verification**
- Run benchmark and confirm PASS/FAIL behavior and readable output.

---

## Milestone exit criteria

- [ ] No remaining boundary exceptions.
- [ ] All tests passing; behavior identical everywhere.
- [ ] Docs complete and accurate.
- [ ] Benchmark gate enforced and passing.


