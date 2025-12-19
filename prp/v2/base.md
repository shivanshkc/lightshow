# Lightshow — v2 PRP (Code Organization / Architecture)

This document defines **v2** requirements for Lightshow.

v2 is a **refactor/redesign of code organization only**: the goal is to make the codebase **independently understandable by humans**, **highly decoupled**, **mockable**, and **startup-time swappable** (UI/input/renderer), **without degrading performance** or changing behavior.

---

## 1) v2 goals (must)

- **Human understandability**:
  - A new developer can answer “where is X implemented?” quickly (see Section 11).
  - Each major component can be understood in isolation via **local docs + tests**.
- **Strong decoupling via well-defined contracts**:
  - Components communicate only through **explicit, stable contracts** (ports).
  - No “reach into internals” across components.
- **Mockability**:
  - Every major component can be replaced with a mock for tests.
- **Swappability at startup (not hot-swappable)**:
  - UI can be swapped (e.g., React UI replaced by a different UI driver).
  - Input controller can be swapped (e.g., mouse/touch vs AI prompt controller).
  - Renderer backend can be swapped (e.g., WebGPU renderer vs stub/null renderer).
  - Swapping occurs at **startup/initialization time** only (not during runtime).
- **No behavior/UX changes**:
  - v2 must preserve application behavior and UX *identically everywhere*.
  - **Bug fixes are allowed only if explicitly listed and approved**.
- **No performance regression**:
  - v2 must not degrade performance; it must include an explicit benchmark gate (Section 10).

---

## 2) v2 non-goals (must not)

- New features, new UI/UX flows, new rendering techniques, new primitives, new file formats, etc.
- Hot-swapping implementations at runtime.
- Introducing new frameworks/architectural dependencies that add runtime overhead without clear benefit.
- Adding complex infra (servers, backends).

---

## 3) Definitions (shared vocabulary)

- **Kernel (a.k.a. App Kernel / Application Core / “app brain”)**:
  - The component that owns **state transitions** and enforces **all invariants**.
  - It is UI-agnostic and renderer-agnostic.
  - It is the single authoritative place for “what happens when the user does X”.

- **Ports**:
  - TypeScript interfaces that define how components communicate.
  - Ports are the only permitted cross-component dependency.

- **Adapters**:
  - Concrete implementations of ports for a specific technology (React, DOM, WebGPU, etc.).

- **Commands (write contract)**:
  - The only allowed way to change kernel state.

- **Queries (read contract)**:
  - Read-only APIs exposed by the kernel for consumers to render UI, update renderer, etc.
  - Queries must be designed carefully to avoid performance pitfalls (Section 7).

- **Events (notification contract)**:
  - Kernel emits notifications for consumers that need to react to state changes (UI, renderer, telemetry).
  - Events should be **minimal and intentional** (Section 6).

---

## 4) Target architecture (hexagonal / ports & adapters)

### 4.1 Components that must exist (conceptually)

- **Kernel** (application core)
- **Renderer backend** (WebGPU implementation + at least one stub implementation for tests)
- **UI driver** (React implementation; contract supports replacement)
- **Input controllers** (DOM mouse/touch/keyboard implementation; contract supports AI controller)
- **Persistence/IO adapters** (if present in current behavior, keep; otherwise do not add in v2)

### 4.2 Dependency direction (must)

The dependency graph must be one-way:

- UI / Input / Renderer adapters **depend on** Kernel ports
- Kernel depends on **no UI framework**, **no WebGPU**, and **no Zustand**

Disallowed:
- Renderer importing UI modules
- UI importing renderer internals
- Any adapter importing another adapter’s internals
- Cyclic dependencies between modules

---

## 5) Contracts (requirements-level)

### 5.1 Write contract (exclusive)

- All state changes must occur through:
  - `dispatch(command)` (or an equivalent command entry point)
- No other component may mutate kernel state directly.

### 5.2 Read contract (explicit queries; read-only)

- Kernel exposes a **read-only query API** for consumers.
- Queries must be:
  - **Read-only** (cannot mutate kernel state)
  - **Allocation-light** (must not deep-clone; should return references where safe)
  - **Coarse-grained enough** to avoid “death-by-thousand-calls” (Section 7)

### 5.3 Events (minimal + intentional)

- Kernel must support subscriptions for change notification.
- Events should be minimal and purposeful. At minimum, support:
  - **State changed** notification (UI re-render trigger)
  - **Render invalidated** notification (renderer accumulation reset / GPU buffer update trigger)
  - (Optional) **Diagnostics/telemetry events** for debugging/benchmarking

This keeps the architecture decoupled without turning events into a parallel state system.

### 5.4 Startup-time swappability

At app startup, it must be possible (for developers/tests) to construct the app by choosing implementations for:

- UI driver (e.g. React UI adapter)
- Input controller (DOM vs AI controller)
- Renderer backend (WebGPU vs stub/null)

Swapping happens **only at startup** (no runtime plugin manager required).

**Important (to avoid scope creep):**
- This is **not** a user-facing feature for v2.
- v2 must **not** add a launch-time UI/menu asking users to choose components.
- The production site must boot with the standard/default implementations automatically.
- Alternate implementations are intended for:
  - tests (mocks/stubs),
  - developer builds,
  - future features (e.g., an AI controller/side panel) that still speak the same kernel contracts.

---

## 6) Renderer update rules (performance + correctness)

### 6.1 No deep-copy / no per-frame rebuild (confirmed requirement)

- Renderer integration must avoid:
  - Deep-copying the entire scene to “send it to the renderer”
  - Rebuilding full scene arrays/structures every frame
  - Per-frame allocations proportional to object count

Allowed patterns include:
- Snapshot-by-reference with structural sharing (recommended)
- Patch-based updates (allowed, not required)

### 6.2 Render invalidation trigger (confirmed requirement)

- Renderer must treat **only committed scene edits** as render-invalidating.
- **Selection changes alone must not** reset accumulation / invalidate render.

> Note: “Committed edit” semantics must remain identical to the current app behavior (v2 is behavior-preserving).

---

## 7) Query design requirements (nitty-gritty, performance-safe hybrid)

Hybrid architecture is chosen because it enables:
- **Strict command-only writes** (decoupling and correctness)
- **Practical, high-performance reads** for UI and renderer

However, poorly designed queries can cause real performance issues. v2 must explicitly avoid them.

### 7.1 Avoid “death-by-thousand-calls”

Queries must not encourage patterns like:
- UI calling 30 tiny queries per render, causing overhead and making state usage hard to audit.
- Renderer calling many granular queries per frame.

**Requirement**: prefer a small number of **coarse, stable** query methods that return the data needed for a view or subsystem in one go.

Examples (conceptual, not prescriptive):
- Good: `getSceneSnapshot()` / `getSelectionSnapshot()` / `getEditorSnapshot()`
- Risky: `getObjectCount()`, `getObjectByIndex(i)` in loops, dozens of tiny getters

### 7.2 Queries must be allocation-light

Queries should:
- Return references to stable structures where safe
- Avoid building new arrays/objects unless something actually changed

**Requirement**: query results must not require deep cloning and should preserve **structural sharing** where possible (i.e., unchanged parts remain the same reference).

### 7.3 Queries must be safe to mock

- Query API must be small, explicit, and well-documented.
- Consumers must depend only on the query contract, enabling mocks for tests and alternate implementations.

---

## 8) State ownership & adapters (requirements-level)

### 8.1 Single source of truth (must)

- Kernel is the single authoritative owner of “editor state” and state transitions.

### 8.2 UI state management is an adapter (must)

- UI state tooling (e.g. Zustand/React state) must not become the source of truth.
- If Zustand remains in v2, it must be used as:
  - a **read-only projection** of kernel state for UI convenience, and/or
  - a **subscription adapter** (bridge), not the authoritative brain.

This is required for:
- UI swappability
- Input/controller swappability
- Renderer swappability
- Team ownership boundaries

---

## 9) Module boundaries, exports, and enforcement (must)

### 9.1 Path aliases (must)

Introduce TS path aliases to remove deep relative imports and clarify boundaries (e.g. `@kernel/*`, `@ui/*`, `@renderer/*`, etc.).

### 9.2 Public API only (hard rule)

- Each module must expose an `index.ts` as its public API.
- Cross-module imports must only import from public APIs (no deep imports).

### 9.3 Lint enforcement (must)

Add lint rules to enforce:
- No forbidden deep imports
- No dependency cycles across modules
- Dependency direction rules (Section 4.2)

---

## 10) Performance gate (benchmark script + thresholds) (must)

v2 must add a repeatable benchmark script and use it to prevent regressions.

### 10.1 Scenarios (required)

- **Scenario 1: Idle Cornell Box (10 seconds)**  
  Measures steady-state rendering and overhead when the app is “doing nothing” besides rendering.

- **Scenario 2: Scripted camera orbit (10 seconds)**  
  Measures interaction smoothness and render-loop overhead during continuous input.

### 10.2 Metrics (required)

- **TTFF (Time To First Frame)** after load (lower is better)
- **Median FPS during orbit** (higher is better)

### 10.3 Pass criteria (required; relative to v1 baseline on same machine)

- TTFF must not regress by more than **+10%**
- Orbit median FPS must not regress by more than **-10%**

### 10.4 Benchmark design constraints (must)

- Benchmark must be runnable locally without manual steps beyond a single command.
- Benchmark must be deterministic enough to compare before/after (acknowledging minor GPU variance).
- Benchmark must not require network access.

---

## 11) Documentation deliverables (must)

v2 must add:

- `docs/architecture.md`:
  - Module map
  - Dependency rules
  - Public API rules
  - “Where to find X” guide (rendering, selection, gizmos, scene ops, history, etc.)

- `src/README.md`:
  - Quick developer orientation
  - “Start here” pointers

- Per-module `README.md` (for each major module):
  - Purpose
  - Public API surface
  - How to test in isolation
  - Common extension points

---

## 12) Testing strategy (must)

### 12.1 Co-located tests per module (required)

- Unit tests should live near the module they test to maximize local understandability.

### 12.2 Small integration suite (required)

- Keep a small set of integration tests that assert:
  - End-to-end behavior remains identical
  - Major flows still work (selection, transforms, materials, undo/redo, etc.)

### 12.3 Contract tests (required)

For each swappable component, add contract tests that:
- verify the port contract behavior
- allow mock implementations to be swapped in tests

---

## 13) Migration plan (stepwise, architecture-first)

v2 implementation must:

- First **define the target architecture and contracts** (ports) clearly.
- Then migrate stepwise by introducing adapters that bridge old code to new contracts.

Constraints:
- The app must remain working throughout the migration.
- Behavior must remain identical.
- Performance must remain within the gate thresholds.

---

## 14) Acceptance checklist (testable)

### Architecture / boundaries
- [ ] Kernel exists and has no dependency on React/WebGPU/Zustand.
- [ ] UI/Input/Renderer are adapters that depend on kernel ports only.
- [ ] Cross-module imports only via `index.ts` public APIs.
- [ ] Path aliases in place; deep relative imports removed where feasible.
- [ ] Lint rules enforce boundaries and prevent cycles.

### Swappability (startup-time)
- [ ] App can start with an alternate renderer implementation (stub/null) for tests/dev without kernel changes.
- [ ] App can start with an alternate input controller (e.g., mock controller) for tests/dev without kernel changes.
- [ ] App can start with an alternate UI driver (e.g., test UI) for tests/dev without kernel changes.
- [ ] The production build does **not** present any user-facing “choose components” menu; it boots with defaults automatically.

### Behavior preservation
- [ ] All existing tests pass.
- [ ] Integration tests confirm behavior is identical in main flows.
- [ ] Any bug fixes are explicitly listed and approved.

### Performance
- [ ] Benchmark script exists and is documented.
- [ ] TTFF and orbit FPS do not regress beyond thresholds.
- [ ] No new per-frame allocations proportional to object count are introduced by the new architecture.

---

## 15) Approved/optional bug fixes list (v2)

v2 may include bug fixes only if they are explicitly listed here and approved before implementation.

- (empty by default)


