# Lightshow UI v3 — Atomic Execution Prompt (UI-only)

This document defines the **sequential atomic steps** to implement the requirements in `prp/v3/base.md`.

## Non-negotiable scope constraint (read first)
- The project is divided into decoupled components.
- You must **only modify UI components**:
  - Allowed: `src/components/**` and (if needed) `src/index.css`
  - Disallowed: `src/App.tsx`, `src/components/Canvas.tsx`, and anything under `src/core/**`, `src/kernel/**`, `src/renderer/**`, `src/adapters/**`, `src/store/**`, `src/ports/**`
- If at any time you believe a non-UI change is required, you must **stop and ask the user for explicit informed consent** before touching anything outside the allowed scope.

## Required workflow (must follow exactly)
For each atomic step below:
1. Read the atomic step and develop thorough understanding. Ask the user questions if needed.
2. Update any documentation if necessary with new understanding. **Prompt the user for approval on documentation** before proceeding.
3. For the current atomic step, in order:
   - Implement the step (UI-only; ask consent otherwise)
   - Add/adjust unit tests
   - Run the full test suite using `npm test -- --run`
   - Run `npm run lint`
   - Run `npm run bench` to verify performance has not degraded
   - Update docs if needed
   - Provide **manual test actions** for the user
   - Wait for user verification/approval; iterate if requested
   - Propose a commit message; **commit only after user approval**

## Atomic steps (sequential, testable, each must pass test+lint+bench)

### Step 1 — Establish UI-only plumbing for “floating overlay layout”
**Goal**: Create the minimal new UI scaffolding needed to render overlays without changing non-UI code.
- Add a small UI state mechanism (React context/provider or local Zustand inside `src/components/**`) that tracks:
  - left panel open/closed
  - right panel open/closed
  - active gizmo mode (W/E/R selection for highlighting) sourced from existing gizmo state (UI reads/writes existing store via existing hooks)
  - mobile sheet open/closed and which sheet is open (left vs right) per requirements
- Ensure the state is accessible from HUD, panels, and performance widget.
- Do **not** change actual layout yet; only add the state + minimal no-op wiring to keep UI unchanged.

**Acceptance**:
- UI looks the same as before.
- Tests/lint/bench pass.

**Manual test**:
- Load app; ensure current panels and status bar render as before; no visual regression.

---

### Step 2 — Introduce shared UI primitives for consistent micro-design
**Goal**: Create/standardize primitives to avoid clunky/inconsistent spacing and icon-button shapes.
- Add UI primitives under `src/components/ui/` (or refine existing ones) for:
  - `IconButton` (consistent size, radius, focus ring, disabled styles)
  - `SegmentedControl` suitable for W/E/R group (desktop)
  - Optional: `Surface`/`FloatingSurface` wrapper for HUD/widget/panels (shared border/radius/shadow)
- Ensure new primitives follow existing Tailwind tokens (`tailwind.config.js`) and match the v3 design language.
- Replace nothing yet, or replace only in places that are strictly visual and low-risk (keep changes scoped).

**Acceptance**:
- No behavioral change; only reusable primitives added (and optionally adopted in one small place).
- Tests/lint/bench pass.

**Manual test**:
- Verify focus rings and hover styles on any adopted primitives.

---

### Step 3 — Implement Desktop HUD (bottom-center) without removing existing StatusBar yet
**Goal**: Add the new desktop HUD in the correct order and grouping while keeping existing UI functional.
- Implement HUD as a floating bottom-center surface with icon buttons and W/E/R group.
- Wire actions to existing behavior:
  - left/right panel toggles update UI-only open state
  - undo/redo dispatch existing commands
  - W/E/R update gizmo mode via existing state APIs
  - camera reset and focus trigger existing behaviors (must remain UI-only; do not change camera controller)
- Apply grouping/spacing rules from `base.md`.
- Ensure W/E/R always appear the same regardless of selection (no muted/disabled styling). Camera focus can be disabled when no selection.

**Acceptance**:
- HUD appears on desktop widths (chosen Tailwind breakpoint).
- HUD buttons work and do not break existing layout.
- Tests/lint/bench pass.

**Manual test**:
- Click Undo/Redo; confirm history updates.
- Click W/E/R; confirm gizmo mode changes when selecting an object (and selection still works).
- Click Focus with selection; confirm camera focuses; without selection focus is disabled.
- Toggle left/right via HUD; no crash.

---

### Step 4 — Convert Left & Right panels into Desktop floating overlays (open by default)
**Goal**: Make `LeftPanel` and `RightPanel` floating, high-opacity overlays controlled by HUD state.
- Change `LeftPanel` and `RightPanel` UI to:
  - render as `position: fixed` (or equivalent Tailwind) overlays above canvas
  - be **open by default** on desktop
  - animate open/close with consistent timing/easing
  - be non-resizable
- Ensure underlying `App.tsx` layout is not modified; make panels opt out of flex sizing by using fixed positioning.
- Ensure clicking inside panels works and does not interfere with canvas interactions.

**Acceptance**:
- Both panels open by default on desktop.
- Toggling via HUD shows/hides with animation.
- No auto-close behavior.
- Tests/lint/bench pass.

**Manual test**:
- Confirm canvas remains interactive.
- Confirm both panels start open; toggles animate.
- Confirm object list selection and property edits still work.

---

### Step 5 — Update left panel header: “SCENE OBJECTS (N)”
**Goal**: Move object count into the left panel Scene Objects header with the exact formatting required.
- Update `ObjectList` heading row to show:
  - left: `SCENE OBJECTS`
  - right: `(N)` where `N = snap.objects.length`
- Ensure it aligns cleanly and does not wrap awkwardly under normal widths.

**Acceptance**:
- Header matches spec.
- Tests/lint/bench pass.

**Manual test**:
- Add/delete objects; confirm count updates.

---

### Step 6 — Add desktop top-right performance widget (FPS + Samples), fixed width
**Goal**: Create a top-right widget showing FPS and Samples, read-only, with fixed width and compact sample formatting.
- Implement a widget that reads renderer stats (FPS + sample count) similarly to current `StatusBar`.
- Format samples using compact notation (k) per requirements; keep consistent rounding.
- Ensure widget width is fixed and values do not crowd labels.
- Ensure widget is non-interactive.

**Acceptance**:
- Widget shows FPS + Samples.
- Samples compact formatting works (e.g., 11000 → 11k).
- Width stays stable as numbers change.
- Tests/lint/bench pass.

**Manual test**:
- Observe FPS changes; observe samples increase; confirm no jitter in width.

---

### Step 7 — Anchor the performance widget to the right panel’s left edge with lockstep motion
**Goal**: When right panel is open, widget repositions left in perfect sync (layout-derived).
- Make widget positioning depend on the right panel open state and the known panel width + gap.
- Ensure the widget’s transition uses the same timing as panel open/close.
- Ensure no overlap between widget and right panel.

**Acceptance**:
- Widget moves exactly with right panel toggle.
- Constant gap maintained.
- Tests/lint/bench pass.

**Manual test**:
- Toggle right panel repeatedly; verify widget motion is perfectly synced and never overlaps.

---

### Step 8 — Move Reset Transform into Transform header (icon button)
**Goal**: Remove Reset Transform from Actions body and add icon button in Transform header.
- Add an icon button next to `TRANSFORM` title in the header row that triggers existing reset transform behavior.
- Remove the old Reset Transform button from Actions section.

**Acceptance**:
- Reset Transform appears only in Transform header.
- Works correctly; can be undone.
- Tests/lint/bench pass.

**Manual test**:
- Modify transform; click reset icon; verify reset; verify undo restores.

---

### Step 9 — Mobile: bottom bar HUD + hide W/E/R on phones + exclusive bottom sheets
**Goal**: Implement mobile behavior using Tailwind breakpoints.
- Choose Tailwind breakpoints:
  - one for desktop overlays → mobile sheets
  - one for “phones” where W/E/R are hidden entirely
- Implement:
  - bottom bar HUD on mobile (same buttons/order, except W/E/R hidden on phones)
  - left/right panels as exclusive bottom sheets
  - opening a sheet hides the bottom bar (sheet covers it); closing sheet reveals bar
  - close button top-right on sheet
  - only one sheet can be open at a time, and switching requires closing first (because bar is inaccessible)
- Ensure the top-right performance widget does not need to reposition on mobile.

**Acceptance**:
- Mobile breakpoints behave as specified.
- W/E/R hidden on phones only.
- Only one sheet open; bar hidden while sheet open.
- Tests/lint/bench pass.

**Manual test**:
- Resize to mobile widths; open left sheet; confirm bar is covered; close; open right sheet; confirm behavior.
- On phone-sized width, confirm W/E/R are not present.

---

### Step 10 — Remove/repurpose old StatusBar into the new system
**Goal**: Eliminate the old bottom `StatusBar` visuals and ensure all its functions are covered by HUD/widget.
- Ensure undo/redo are only in HUD (desktop and mobile).
- Ensure FPS/Samples are only in the top-right widget (per spec).
- Ensure no duplicate or conflicting status UI remains.

**Acceptance**:
- Old status bar no longer clutters UI.
- All previously exposed actions/metrics still available per new design.
- Tests/lint/bench pass.

**Manual test**:
- Confirm no bottom status strip remains.
- Confirm undo/redo and FPS/Samples still visible/functional.


