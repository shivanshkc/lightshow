import { useCameraStore } from '@store';

// Cornell Box extents (half extents) from the default scene construction.
// See `src/store/sceneStore.ts`:
// - interior halfX = 5.1, wallT = 0.05, walls extend to ±(halfX + 2*wallT) = 5.2
// - interior halfY = 2.6, wallT = 0.05, slabs extend to ±(halfY + 2*wallT) = 2.7
const CORNELL_HALF_WIDTH = 5.2;
const CORNELL_HALF_HEIGHT = 2.7;

// Desired horizontal padding as a fraction of the viewport width.
// Example: 0.06 => 6% padding on each side, box occupies ~88% width.
const H_MARGIN_FRAC = 0.06;
const V_MARGIN_FRAC = 0.04;

function clamp(min: number, v: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function fovXFromFovY(fovY: number, aspect: number): number {
  // fovX = 2*atan(tan(fovY/2) * aspect)
  const t = Math.tan(fovY * 0.5) * aspect;
  return 2 * Math.atan(t);
}

function computeDistanceToFitHalfExtent(
  halfExtent: number,
  fov: number,
  marginFrac: number
): number {
  // Ensure max NDC coordinate is <= (1 - marginFrac)
  const usable = clamp(0.5, 1 - marginFrac, 0.98);
  const denom = Math.tan(fov * 0.5) * usable;
  // Prevent division by zero if fov is absurdly small.
  return halfExtent / Math.max(1e-4, denom);
}

/**
 * UI-only: set a Cornell-Box "home" distance that guarantees horizontal/vertical padding.
 * This computes the distance from the actual canvas rect + camera fov, so it looks the
 * same on refresh and on Home (no mismatches).
 */
export function applyResponsiveHomeDistance(width: number, height: number): void {
  const s = useCameraStore.getState();
  const aspect = Math.max(0.2, width / Math.max(1, height));
  const fovY = s.fovY;
  const fovX = fovXFromFovY(fovY, aspect);

  const distX = computeDistanceToFitHalfExtent(CORNELL_HALF_WIDTH, fovX, H_MARGIN_FRAC);
  const distY = computeDistanceToFitHalfExtent(CORNELL_HALF_HEIGHT, fovY, V_MARGIN_FRAC);
  const targetDistance = Math.max(distX, distY);

  // Only zoom out; never zoom in relative to current distance.
  if (targetDistance <= s.distance) return;
  s.focusOn(s.target, targetDistance);
}

export const UI_CAMERA_EVENTS = {
  home: 'lightshow:camera.home',
} as const;

export function triggerResponsiveHome(): void {
  window.dispatchEvent(new Event(UI_CAMERA_EVENTS.home));
}

export function getCanvasRect(): DOMRect | null {
  const canvas = document.querySelector('canvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height)) return null;
  if (rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}


