import { useGizmoStore } from '@store';
import type { GizmoMode } from '@store';

/**
 * UI-level hook for reading/writing the gizmo mode.
 *
 * This is intentionally a thin proxy over the existing gizmo store so the UI
 * can stay decoupled from non-UI systems while still using the app’s current
 * gizmo behavior.
 */
export function useUiGizmoMode(): {
  mode: GizmoMode;
  setMode: (mode: GizmoMode) => void;
} {
  const mode = useGizmoStore((s) => s.mode);
  const setMode = useGizmoStore((s) => s.setMode);
  return { mode, setMode };
}


