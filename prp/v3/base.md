# Lightshow UI Cleanup Plan (Desktop-First, Mobile-Usable)

This prompt is for a fresh AI session. Follow it exactly. The goal is to clean up the existing UI for desktop while making it usable (not necessarily full-featured) on small screens. Do **not** add new features—only improve layout, ergonomics, and affordances.

## Context & Constraints
- Desktop-first product. Phones/tablets must be usable for core actions but not feature-parity.
- Only modify **UI components** (React/Tailwind in `src/components/**`, styling in `index.css`/Tailwind). If anything outside UI (kernel, renderer, adapters, stores) needs a change, **stop and ask for explicit informed consent**.
- The codebase is decoupled; keep boundaries intact.
- Maintain existing behaviors; no new capabilities. Surface existing ones more clearly.

## Desired UX Outcomes
- Panels: fluid widths on desktop; responsive collapse on small screens to preserve viewport.
- Small screens: minimal drawer/tab for Objects/Properties; hide/stack nonessential sections by default.
- Gizmo mode should be discoverable without keyboard; W/E/R shortcuts remain.
- Key actions (Duplicate/Delete/Reset/Focus) accessible near the top of Properties.
- Inputs: clearer affordance and touchable sizes; drag-to-change can stay desktop-only.
- Status bar: full text on desktop; compressed/compact on small screens.
- Lightweight, dismissible touch onboarding hint; no heavy new flows.

## Atomic Steps (individually testable)
1) **Orient & questions**: Read this file and relevant UI components. List open questions/assumptions for user approval.
2) **Responsive shell**: Make panel widths fluid on desktop; add breakpoint behavior (≤md) to collapse left/right panels into a drawer or tabs (Objects/Properties) with a hide toggle. Ensure canvas fills space.
3) **Action placement**: Reorder Properties panel so Duplicate/Delete/Reset/Focus sit near the top when an object is selected; reduce scroll on small screens.
4) **Gizmo affordance**: Add a minimal on-canvas/near-status toggle for gizmo mode (translate/rotate/scale/none) using existing state; keep keyboard shortcuts intact.
5) **Inputs ergonomics**: Increase tap targets and add visible affordance (e.g., steppers/hit area) for NumberInput/Vec3Input on small screens; retain desktop drag behavior.
6) **Panel trimming (mobile)**: Default-collapse nonessential sections (Rotation, Material, Environment) on small screens; keep full detail on desktop.
7) **Status bar compression**: On small screens, compress metrics to short labels or icons; avoid wrapping. Desktop remains full text.
8) **Onboarding hint**: Add a small, dismissible first-run hint for touch (tap select, pinch/drag orbit/pan/zoom, gizmo toggle). No new features—just UI text/visibility state.
9) **Performance toggle surface (UI-only)**: If an existing setting is exposed in UI, present a single “Performance” toggle in status/drawer for small screens. If it requires non-UI changes, stop and ask for consent.

## Workflow (must follow for each atomic step)
1. Read the atomic step; ensure full understanding. Ask the user questions if unclear.
2. Update any documentation if needed; get user approval before proceeding with code.
3. For the current atomic step, in order:
   - Implement the step (UI components only; ask consent otherwise)
   - Add/adjust unit tests
   - Run `npm test -- --run`
   - Run `npm run lint`
   - Run `npm run bench`
   - Update docs if needed
   - Provide manual test actions for the user
   - Propose a commit message; commit only after user approval

## Safeguards
- If touching non-UI areas seems necessary, pause and request explicit informed consent.
- Keep changes scoped to the current atomic step; avoid batching multiple steps.
- Preserve existing behaviors and keyboard shortcuts.

## Deliverables per step
- Summary of changes
- Test results (commands above)
- Manual test checklist
- Proposed commit message

