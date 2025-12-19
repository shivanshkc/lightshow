# Milestone 01 — Baseline and Guardrails (v2)

This milestone creates **safety rails** so subsequent refactors can be aggressive without risking:
- behavior/UX drift, or
- performance regressions, or
- architecture boundary erosion.

This milestone should not change user-facing behavior.

## Goal (definition of done)

By the end of this milestone:

- We have a **repeatable benchmark command** that measures:
  - **TTFF** (time to first frame after load)
  - **Median FPS during scripted camera orbit**
- We have captured a **baseline** measurement on the same machine/conditions.
- We have initial **boundary guardrails** in place (path aliases + import boundary lint rules) so future refactors cannot quietly reintroduce coupling.
- We have a docs skeleton for:
  - `docs/architecture.md`
  - `src/README.md`
  - per-module `README.md` placeholders (as needed)

## Non-goals (explicit)

- No new product features.
- No user-visible “choose components” menu.
- No behavior/UX changes (unless explicitly approved as a bug fix — none are planned for this milestone).
- No large code moves yet (keep this milestone focused on guardrails).

## Mechanical Steps

### Step 1.1 — Add benchmark harness (TTFF + orbit median FPS)

**Intent**
- Add a benchmark script that can be run with a single command and produces comparable output.
- This is required by `prp/v2/base.md` Section 10.

**Implementation expectations**
- Must be runnable locally without network access.
- Must automate:
  - page load
  - measurement collection for TTFF and orbit FPS
  - output a small machine-readable result (e.g., JSON) and human summary
- Must not require manual interaction.

**Unit tests**
- Minimal: unit tests for any small helper utilities introduced (parsing/aggregation).

**Run tests**
- `npm test`

**Manual verification (addendum)**
- Run the benchmark command and confirm it produces:
  - TTFF number
  - median FPS number (during a scripted orbit)
  - a clear “PASS/FAIL” placeholder (even if thresholds are applied later in the milestone)

**Commit policy**
- Commit message should mention benchmark harness creation.

---

### Step 1.2 — Record baseline numbers (v1 baseline on this machine)

**Intent**
- Establish the “before refactor” baseline required to detect regressions.

**Implementation expectations**
- Document the baseline results in a committed file (e.g., `benchmarks/baseline.json` or `benchmarks/README.md`).
- Include minimal context:
  - date/time
  - OS/browser version
  - GPU (if readily available from the environment)

**Unit tests**
- None required.

**Run tests**
- `npm test`

**Manual verification (addendum)**
- Re-run benchmark and confirm results are stable enough to be used as a baseline.

**Commit policy**
- Commit message should mention baseline capture.

---

### Step 1.3 — Add path aliases (clarity) without changing behavior

**Intent**
- Introduce TypeScript path aliases (e.g., `@kernel/*`, `@ui/*`, `@renderer/*`, etc.) as a prerequisite to enforce boundaries and readability.

**Implementation expectations**
- Keep behavior identical.
- Avoid large sweeping rewrites; update imports in a controlled way.

**Unit tests**
- None required beyond existing suite.

**Run tests**
- `npm test`

**Manual verification (addendum)**
- Run the app and confirm it behaves identically (use constant smoke checklist).

**Commit policy**
- Commit message should mention path aliases.

---

### Step 1.4 — Add boundary lint rules (public API only + no cycles)

**Intent**
- Add lint rules that enforce:
  - public API only imports (via `index.ts`)
  - dependency direction and no cycles (as specified in `prp/v2/base.md`)

**Implementation expectations**
- Must not require runtime changes.
- If new lint tooling is required, keep it minimal and well-documented.

**Unit tests**
- None required.

**Run tests**
- `npm test`

**Manual verification (addendum)**
- Confirm lint rules run and catch at least one known-bad pattern in a controlled test (can be done via a temporary local change, not committed).

**Commit policy**
- Commit message should mention boundary enforcement.

---

### Step 1.5 — Docs skeleton for architecture navigation

**Intent**
- Create placeholder docs so the team can start documenting as modules are introduced.

**Implementation expectations**
- Create:
  - `docs/architecture.md` (skeleton: module map, dependency rules, “where to find X”)
  - `src/README.md` (skeleton: dev orientation)
  - per-module README placeholders if the module folder structure is introduced in later milestones (can be added later if premature here)

**Unit tests**
- None.

**Run tests**
- `npm test`

**Manual verification (addendum)**
- None beyond ensuring docs render in markdown preview.

**Commit policy**
- Commit message should mention docs skeleton.

---

## Milestone exit criteria

- [ ] All mechanical steps complete.
- [ ] Full test suite passes at each step.
- [ ] Benchmark harness exists and can be run by a single command.
- [ ] Baseline numbers are recorded in the repo.
- [ ] Initial path aliases + boundary lint rules are in place (even if boundaries are broadened later).
- [ ] No behavior/UX changes observed using the constant smoke checklist.


