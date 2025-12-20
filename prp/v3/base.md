# Lightshow UI v3 Requirements — HUD + Floating Panels + Mobile Sheets

## Summary
Implement a cleaner, more mature UI that is **canvas-first**, minimal, and responsive. On desktop, both the left “Scene” and right “Properties” panels are **floating**, **high-opacity**, and **non-resizable**, controlled by a bottom-center **HUD** toolbar. On mobile, the HUD becomes a fixed bottom bar and the panels become **exclusive bottom sheets** (only one open at a time). Add a fixed-width top-right **performance widget** (FPS + Samples) that repositions in perfect lockstep with the right panel. All changes must be **UI-only** and must preserve existing behavior and shortcuts.

## Constraints (hard requirements)
- **UI-only scope**:
  - Allowed: `src/components/**` (React/Tailwind UI), and Tailwind styling. If a small global style is required, `src/index.css` may be edited.
  - Not allowed: any changes to kernel/renderer/adapters/stores/ports/camera/selection/commands beyond calling their existing APIs from UI.
- **No new app capabilities**: only re-layout and re-surface existing features.
- **Icons**: use `lucide-react` for all new UI iconography for consistency.
- **Breakpoints**:
  - Use Tailwind breakpoints (no custom pixel breakpoint).
  - Choose appropriate breakpoints for:
    - switching desktop floating panels → mobile sheets
    - hiding W/E/R on phones
  - Document the chosen breakpoints in the implementation PR/description (but do not add new docs here).

## Desktop UI requirements

### 1) Floating panels (left + right)
- **Always floating** over the canvas (not side-by-side resizable panes).
- **Both open by default** on initial load.
- **Not resizable**.
- **High-opacity** surface (minimal translucency); no special fallbacks for this release.
- Must be **toggleable** using the HUD left/right toggle buttons.
- Panels must not auto-close (no “temporary drawer” behavior).

#### Left panel contents (Scene)
- Keep existing sections (Environment, Add Object, Object List), but present them within the floating panel.
- **Scene Objects header**:
  - The heading text is left-aligned: `SCENE OBJECTS`
  - The object count is right-aligned inside parentheses: `(N)`
  - Example layout: `SCENE OBJECTS .................................. (10)`
  - No responsive conditional behavior for the count formatting in this release.

#### Right panel contents (Properties)
- When there is no selection, show a simple empty state (existing copy is fine).
- When there is a selection, show existing sections (Transform, Material, Actions).
- **Reset Transform affordance**:
  - Move “Reset Transform” out of the Actions body and into the **Transform header** as an icon button on the right side of the header row.
  - This may be less discoverable; that is acceptable for this release.

### 2) Desktop HUD (bottom-center)
- Add a new **bottom-center HUD toolbar** that controls panel visibility and key actions.
- The HUD is a single rounded, elevated surface that sits above the canvas and above other UI.
- HUD layout order (left → right), exactly:
  1. **Left panel toggle** (icon button)
  2. **Undo** (icon button)
  3. **Redo** (icon button)
  4. **W/E/R** gizmo mode buttons (grouped together)
  5. **Camera reset** (icon button)
  6. **Camera focus** (icon button)
  7. **Right panel toggle** (icon button)

#### HUD grouping / spacing
- Visually group:
  - Undo/Redo together
  - W/E/R together
  - Camera reset/focus together
- Provide “apt spacing” between groups:
  - Left panel toggle should have a noticeable gap after it.
  - Right panel toggle should have a noticeable gap before it.
  - Group separators can be spacing-only or subtle dividers; keep minimal and consistent.

#### HUD enable/disable rules
- **Undo/Redo**: disabled when not available (same logic as current status bar).
- **W/E/R**:
  - Always render the W/E/R group **identically**, regardless of whether an object is selected (no muted/disabled/inactive styling).
  - W/E/R are always **clickable** and update the highlighted gizmo mode.
  - No tooltips for this release.
  - There is no “None” mode in the HUD.
- **Camera Focus**:
  - Inactive/disabled style when there is no selection.
- **Camera Reset**: always available.

### 3) Top-right performance widget (FPS + Samples)
- A separate rounded rectangle widget in the **top-right** that displays:
  - **FPS** (numeric)
  - **Samples** (numeric)
- The widget is **read-only** (non-interactive).

#### Positioning and “lockstep” movement
- When the right panel is open, the widget must move left so it does not overlap the panel.
- The widget must be anchored to the **left edge of the right panel** with a fixed gap.
- The widget’s movement must be perfectly synchronized with the panel by deriving position from layout/state (not by trying to match animation timings independently).
- The widget and the right panel must animate with **exactly the same timing**.

#### Formatting and sizing
- The widget must have a **fixed width** so its width does not change as numbers update.
- Samples can reach 4–5 digits; format as compact:
  - `11000 → 11k`
  - Use sensible rounding (e.g., `11500 → 11.5k` or `12k`—choose one approach and keep consistent).
- Ensure the number never crowds the label (“Samples”), even when large:
  - Use consistent spacing / alignment.
  - Use tabular/monospace numerals if needed for stability.

### 4) Animation requirements (desktop)
- Panel open/close transitions must be animated (e.g., slide + fade).
- **Same timing** for all related animations:
  - left panel
  - right panel
  - performance widget reposition (when right panel toggles)
- Choose an “apt” duration and easing and use it consistently.

## Mobile UI requirements

### 1) Bottom bar HUD
- The HUD becomes a **fixed bottom bar** on mobile.
- Bottom bar contains the same button set/order as desktop HUD:
  - Left toggle, Undo, Redo, Camera reset, Camera focus, Right toggle
- **Hide W/E/R on phones**:
  - On phone-sized screens, remove the W/E/R controls entirely from the bottom bar.
  - Determine “phone-sized” using a Tailwind breakpoint (no custom px).

### 2) Bottom sheets for panels (exclusive)
- On mobile, the left and right panels are implemented as **bottom sheets**.
- Only **one** sheet can be open at a time.
- Opening a sheet causes it to open **above the bottom bar and cover it** (bottom bar becomes inaccessible while a sheet is open).
- Each sheet has a **close button** at the **top-right** that collapses the sheet.
- Because the bottom bar is hidden while a sheet is open, the other sheet can only be opened after closing the current sheet (via bottom bar).

### 3) Performance widget on mobile
- The FPS/Samples widget remains in the **top-right**.
- On mobile, it does **not** reposition due to the right panel being a bottom sheet (no right-side collision).
- Same fixed-width and compact formatting rules as desktop.

### 4) Animation requirements (mobile)
- Bottom sheet open/close transitions must be animated.
- Use consistent timing with other UI animations (same “system feel” as desktop).

## Visual design requirements (applies everywhere)
- Use the existing Tailwind token palette from `tailwind.config.js` (`base`, `panel`, `panel-secondary`, `elevated`, `hover`, `active`, borders, text colors, `accent`, etc.).
- Tighten micro-design consistency:
  - consistent padding/margins across headers and bodies
  - consistent icon sizes and icon button shapes
  - consistent radii and border opacities across panels/HUD/widget
  - consistent typography scale (uppercase section headers, tracking, line-height)
- Maintain a non-intimidating look: minimal chrome, clear grouping, no excessive labels.

## Functional mapping (must preserve existing behavior)
- **Undo/Redo**: same semantics as current, just moved into HUD/bottom bar.
- **Gizmo mode**:
  - HUD buttons must set gizmo mode using existing state (no new modes; no “none” button).
  - Keyboard shortcuts `W/E/R` must continue to work unchanged.
- **Camera**:
  - Reset camera = existing behavior (currently `Home`).
  - Focus selection = existing behavior (currently `F`).
- **Selection**: canvas picking and object list selection must remain unchanged.
- **Object operations**: duplicate, delete, visibility toggle, rename must remain available via existing UI, merely repositioned visually as specified.


