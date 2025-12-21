
# Lightshow — v3.1 PRP: Touchscreen Gizmo Manipulation (“Hit-test wins”)

This PRP defines a stepwise, testable plan to make **transform gizmos usable on touchscreens** while preserving existing desktop behavior and without regressing performance.

---

## 0) Context / problem statement

Today, on touch devices, **all touch-drag gestures go to camera control**, making it effectively impossible to translate/rotate/scale via gizmos. The root cause is:

- Gizmo interaction (hover, start drag, update drag, end drag) is implemented only for **mouse events** in `src/components/Canvas.tsx`.
- Touch input is used only for **tap-to-select** in `Canvas`, while continuous touch gestures are handled by `src/core/CameraController.ts` (orbit/pan/zoom).

Additionally, on narrow screens the **Mobile HUD hides W/E/R**, leaving touch-first devices with **no way to switch gizmo modes** (and thus no way to access rotate/scale on phones). This must be fixed in this release.

---

## 1) Target behavior (final UX spec)

### 1.0 Gizmo mode switching is available on all screen sizes

- Users must be able to switch gizmo modes (**translate/rotate/scale**) on **all screen widths**, including phone-sized screens.
- On small screens, the control may be more compact (e.g. smaller segmented control), but it must remain **discoverable** and **one-tap reachable**.

### 1.1 Core rule: “hit-test wins”

For **single-finger** touch:
- On touch down, if the touch point **hits a gizmo axis/handle**, begin a gizmo drag session (translate/rotate/scale) immediately.
- Otherwise, touch remains camera-first (existing orbit behavior), and tap-to-select remains supported.

For **two+ fingers** touch:
- Never starts gizmo drag.
- Always camera (existing pinch/pan behavior).

### 1.2 Multi-touch during a gizmo drag (simplicity rule)

If a second finger is placed **during** an active gizmo drag:
- Ignore extra touches and continue gizmo drag based on the primary touch.
- End the gizmo drag when the primary touch ends/cancels.

### 1.3 Touch hit slop

Touch gizmo axis picking uses a **fixed 24 CSS px hit slop**, meaning “close enough” to a handle should count as a hit on touch.

Implementation may use a world-space tolerance derived from 24 CSS px at the gizmo’s approximate depth. The subjective requirement is: **axis acquisition feels ~24px forgiving** on touch.

### 1.4 Non-goals

- No new UI modes (no “Edit vs Navigate” toggle).
- No redesign of camera gestures.
- No changes to renderer behavior, scene semantics, or kernel history semantics beyond reusing existing APIs (`history.group.begin/end`, existing transform commands).
- No new dependencies.

---

## 2) Hard constraints (architecture / module boundaries)

Lightshow is built from decoupled modules. The implementation must only modify the relevant components and must respect module boundaries and public APIs.

### 2.1 Allowed to modify (expected)

- `src/components/Canvas.tsx` (viewport input wiring for gizmos/selection)
- `src/components/layout/MobileHud.tsx` and `src/components/layout/Hud.tsx` (gizmo mode switcher availability across breakpoints)
- `src/core/CameraController.ts` (only if required to support correct suppression/resumption of camera touch state)
- `src/gizmos/GizmoRaycaster.ts` (to support touch tolerance in picking)
- `src/core/*` (only small, pure helpers if necessary and well-justified)
- `src/__tests__/*` (unit tests covering the new behavior)
- `docs/*` (only if needed; must request user approval before changing docs)

### 2.2 Must not modify

- `src/kernel/**`, `src/ports/**` contracts (unless explicitly required and approved)
- `src/renderer/**` or shaders (should be irrelevant)
- unrelated UI/panels/layout

### 2.3 Import rules

- Obey “public API only” aliased imports (e.g. import from `@core`, `@gizmos`, etc. entrypoints when applicable).
- Avoid new import cycles (ESLint enforces `import/no-cycle`).

---

## 3) Required agent workflow (MANDATORY)

The AI agent implementing this PRP must follow this workflow:

1) Read the current atomic step, build a thorough understanding, and ask the user questions if needed.
2) If documentation needs updates based on new understanding, **propose doc changes and ask the user for approval** before proceeding.
3) For each atomic step, in order:
   - Implement the step (only in relevant components)
   - Add/adjust unit tests
   - Run the full test suite: `npm test -- --run`
   - Run lint: `npm run lint`
   - Update docs if needed (ask for approval first)
   - Provide **manual test actions** for the user
   - Wait for user verification/approval; iterate if requested
   - After approval: run benchmarks: `npm run bench`
   - If benchmarks pass: propose a commit message; **commit only after user approval**

---

## 4) Acceptance criteria (final state)

### 4.1 Automated

- `npm test -- --run` passes.
- `npm run lint` passes.
- `npm run bench` passes with no regression gates violated.

### 4.2 Manual (touch device)

- On a phone-sized screen, there is a visible way to switch gizmo mode (W/E/R), and switching updates the active gizmo.
- With an object selected and gizmo mode set (W/E/R), a **single finger** can:
  - grab a gizmo handle and **translate** the object
  - grab a gizmo ring/handle and **rotate** the object
  - grab a scale handle and **scale** the object
- Touching **not** on the gizmo still orbits the camera (existing behavior).
- Two-finger gestures (pinch zoom + pan) still work as before.
- During gizmo drag: camera motion is suppressed; on drag end: camera resumes.
- Undo/redo grouping during a continuous touch drag remains “one undo step” (history group begin/end).

---

## 5) Atomic implementation plan (sequential, testable steps)

Each step below must be **atomic**, **testable**, and should not require additional refactors.

### Step 1 — Ensure W/E/R gizmo mode switching exists on all screen sizes

**Goal**: On narrow screens (including phones), users must be able to switch between translate/rotate/scale from the HUD (no keyboard required).

**Implementation (expected scope)**:
- Update `src/components/layout/MobileHud.tsx` so gizmo mode switching is always available (even on phones).
- Use a **cycle button on phones** (narrow screens):
  - A single icon button (or compact text button) that cycles: `translate → rotate → scale → translate`.
  - The control must be one-tap reachable.
  - Accessibility:
    - `aria-label` must describe the action, e.g. `Cycle Gizmo Mode (W/E/R)`.
    - `title` should indicate both current mode and the next mode, e.g. `Mode: Translate → Rotate`.
  - Visual:
    - The button should display the current mode in a compact way (e.g. `W`, `E`, `R` or an icon), but the accessible label must be explicit.
- Use the existing `SegmentedControl` on larger “mobile-but-not-phone” widths (e.g. tablets):
  - Prefer `size="md"` (or `sm` if needed for spacing).
- Do not move mode switching into an overflow menu for this release.
- Keep the rest of the HUD control order/behavior unchanged.

**Tests**:
- Add a new test file (e.g. `src/__tests__/MobileHud.test.tsx`) that asserts:
  - On “phone-sized” conditions, the cycle button renders and clicking it cycles the gizmo mode.
  - On wider mobile conditions, the segmented W/E/R control renders and clicking a segment changes gizmo mode.
- Update any existing HUD tests if necessary to reflect the new invariant (“W/E/R always reachable somewhere”).

**Manual test actions**:
- Resize the browser/devtools to phone width (or use a phone):
  - Confirm the Mobile HUD shows a **mode cycle** control.
  - Tap it repeatedly and confirm the mode cycles translate → rotate → scale.
- Resize to tablet width:
  - Confirm the Mobile HUD shows the segmented W/E/R control.
  - Tap W/E/R and confirm the gizmo mode changes accordingly.

**Exit criteria**:
- Tests/lint pass; bench passes after user approval.

---

### Step 2 — Add a pure helper to convert 24 CSS px into a world-space tolerance

**Goal**: Provide a deterministic way to derive a world-space tolerance at a given depth and viewport height, without changing runtime behavior yet.

**Implementation (expected scope)**:
- Add a small pure function such as:
  - `pixelsToWorldUnitsAtDepth(pixelsCss: number, depth: number, fovY: number, viewportHeightCss: number): number`
- Place it in a relevant module that doesn’t violate boundaries (prefer `@core` if it’s camera-math adjacent).

**Tests**:
- Add unit tests validating:
  - monotonicity: increasing pixels increases world tolerance
  - increasing depth increases world tolerance
  - increasing viewport height decreases world tolerance
  - basic sanity against the formula \(2 * depth * tan(fovY/2) / viewportHeight\)

**Manual test actions**:
- None required (pure helper + tests only).

**Exit criteria**:
- Tests/lint pass; bench passes after user approval.

---

### Step 3 — Extend gizmo picking to support a configurable “extra tolerance”

**Goal**: Make `GizmoRaycaster.pick(...)` optionally accept an extra pick tolerance (world units), defaulting to 0, so existing callers remain unchanged.

**Implementation (expected scope)**:
- Update `GizmoRaycaster.pick` signature to accept an optional `pickTolerance?: number` (default `0`).
- Apply that tolerance consistently across modes:
  - translate: inflate arrow radius and plane bounds
  - rotate: inflate tube radius / acceptance distance
  - scale: inflate line radius and cube AABB size
- Ensure default behavior is unchanged when tolerance is omitted.

**Tests**:
- Add new focused tests (e.g. `src/__tests__/GizmoRaycaster.test.ts`) that construct rays that:
  - miss by a small margin with tolerance = 0
  - hit when tolerance > margin
- Cover at least one representative case for:
  - translate axis pick (`'x'|'y'|'z'`)
  - rotate ring pick (`'x'|'y'|'z'` or `'xyz'` trackball)
  - scale pick (`'xyz'` or axis)

**Manual test actions**:
- None required (math-only change + tests).

**Exit criteria**:
- Tests/lint pass; bench passes after user approval.

---

### Step 4 — Add touch-driven gizmo drag to `Canvas` (hit-test wins)

**Goal**: Implement single-finger touch gizmo manipulation in `src/components/Canvas.tsx` using the final UX spec, without breaking camera gestures or selection.

**Implementation (expected scope)**:
- Add touch gesture handling for gizmos:
  - `touchstart`: if 1 touch and gizmo-hit → start drag, begin history group, disable camera
  - `touchmove`: if dragging → update transform (reuse existing drag compute path)
  - `touchend` / `touchcancel`: if dragging → end drag, end history group, re-enable camera
- Use touch hit slop:
  - compute depth estimate (camera-space z) for the selected object’s gizmo origin
  - compute `worldTolerance` from 24 CSS px using Step 1 helper
  - pass it into `GizmoRaycaster.pick(..., pickTolerance)`
- Maintain existing tap-to-select behavior when the touch does **not** start gizmo drag.
- Ensure camera is suppressed only during a gizmo drag (by disabling `CameraController`).

**Tests**:
- Add unit/integration tests that simulate touch events and assert:
  - touch start on gizmo begins drag (gizmo store state changes to dragging; history group begin is dispatched)
  - touch move updates transform via commands (at least verify dispatch called with a transform command)
  - touch end ends drag and re-enables camera (history group end dispatched)
  - touch start not on gizmo does not start drag and still allows tap-to-select semantics
- If Canvas wiring is difficult to test end-to-end, extract the “touch gizmo gesture reducer” into a small pure helper and unit test it; keep UI wiring thin.

**Manual test actions** (for the user):
- On a touch device:
  - Select an object (tap).
  - Set gizmo mode to translate/rotate/scale.
  - Touch down on a handle and drag: object transforms; camera does not orbit.
  - Touch down off gizmo and drag: camera orbits.
  - Use two fingers: pinch zoom and pan behave as before.
  - Undo/redo after a drag: one undo step should revert the whole drag.

**Exit criteria**:
- Tests/lint pass; bench passes after user approval.

---

### Step 5 — Tighten camera controller touch state interaction (only if needed)

**Goal**: Ensure no sticky camera-touch state exists after toggling `setEnabled(false/true)` during a touch-driven gizmo drag.

**Implementation (expected scope)**:
- If observed issues exist (e.g., camera continues orbiting after gizmo drag ends, or touch state sticks):
  - update `CameraController.setEnabled(false)` to also clear touch gesture state (e.g., `isTouching = false`, reset cached touch distances).
- Keep changes minimal and localized.

**Tests**:
- Add a focused unit test for `CameraController` only if the change is non-trivial (optional; prefer coverage via Canvas tests).

**Manual test actions**:
- Repeat Step 3 manual checks, focusing on transitions into/out of gizmo drag.

**Exit criteria**:
- Tests/lint pass; bench passes after user approval.

---

## 6) Notes / performance guardrails

- Avoid per-frame allocations; touch handlers should allocate minimally and reuse existing refs (similar to mouse path).
- Do not introduce new continuous polling; all updates must be event-driven.
- Any additional math helpers must be pure and cheap.


