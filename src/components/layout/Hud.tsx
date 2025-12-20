import { memo, useCallback, useMemo } from 'react';
import {
  Focus,
  Home,
  PanelLeft,
  PanelRight,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { useKernel, useKernelSceneSnapshot } from '@adapters';
import { FloatingSurface } from '../ui/FloatingSurface';
import { IconButton } from '../ui/IconButton';
import { SegmentedControl } from '../ui/SegmentedControl';
import { useUiShellStore } from './uiShellStore';
import { useUiGizmoMode } from './useUiGizmoMode';

type HudMode = 'translate' | 'rotate' | 'scale';

function clampHudMode(mode: string): HudMode {
  return mode === 'rotate' || mode === 'scale' ? mode : 'translate';
}

/**
 * Desktop HUD (bottom-center).
 * Step 3: render on desktop breakpoint only; mobile HUD comes later (Step 9).
 */
export const Hud = memo(function Hud() {
  const kernel = useKernel();
  const snap = useKernelSceneSnapshot();
  const { toggleLeftPanel, toggleRightPanel } = useUiShellStore((s) => ({
    toggleLeftPanel: s.toggleLeftPanel,
    toggleRightPanel: s.toggleRightPanel,
  }));

  const { mode, setMode } = useUiGizmoMode();
  const hudMode = clampHudMode(mode);

  const setHudMode = useCallback(
    (m: HudMode) => {
      setMode(m);
    },
    [setMode]
  );

  const hasSelection = snap.selectedObjectId !== null;

  const dispatchKey = useCallback((key: string) => {
    // Route through the existing CameraController keyboard handler so it can:
    // - perform focus/reset using its deps
    // - call onCameraChange to reset accumulation
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      })
    );
  }, []);

  const segments = useMemo(
    () =>
      [
        { value: 'translate', label: 'W', ariaLabel: 'Translate (W)' },
        { value: 'rotate', label: 'E', ariaLabel: 'Rotate (E)' },
        { value: 'scale', label: 'R', ariaLabel: 'Scale (R)' },
      ] as const,
    []
  );

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-3 z-50 hidden lg:block">
      <FloatingSurface className="px-2 py-2">
        <div className="flex items-center">
          {/* Left panel toggle */}
          <div className="flex items-center pr-2">
            <IconButton
              aria-label="Toggle Scene Panel"
              title="Toggle Scene Panel"
              icon={<PanelLeft className="w-4 h-4" />}
              onClick={toggleLeftPanel}
            />
          </div>

          <span className="mx-2 h-6 w-px bg-border-subtle" aria-hidden="true" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 px-2">
            <IconButton
              aria-label="Undo"
              title="Undo (Ctrl/Cmd+Z)"
              icon={<RotateCcw className="w-4 h-4" />}
              disabled={!snap.history.canUndo}
              onClick={() => kernel.dispatch({ v: 1, type: 'history.undo' })}
            />
            <IconButton
              aria-label="Redo"
              title="Redo (Ctrl/Cmd+Y)"
              icon={<RotateCw className="w-4 h-4" />}
              disabled={!snap.history.canRedo}
              onClick={() => kernel.dispatch({ v: 1, type: 'history.redo' })}
            />
          </div>

          <span className="mx-2 h-6 w-px bg-border-subtle" aria-hidden="true" />

          {/* W / E / R */}
          <div className="flex items-center px-2">
            <SegmentedControl<HudMode>
              value={hudMode}
              onChange={setHudMode}
              options={segments}
              size="md"
            />
          </div>

          <span className="mx-2 h-6 w-px bg-border-subtle" aria-hidden="true" />

          {/* Camera */}
          <div className="flex items-center gap-1 px-2">
            <IconButton
              aria-label="Reset Camera"
              title="Reset Camera (Home)"
              icon={<Home className="w-4 h-4" />}
              onClick={() => dispatchKey('Home')}
            />
            <IconButton
              aria-label="Focus Selection"
              title="Focus Selection (F)"
              icon={<Focus className="w-4 h-4" />}
              disabled={!hasSelection}
              onClick={() => dispatchKey('f')}
            />
          </div>

          <span className="mx-2 h-6 w-px bg-border-subtle" aria-hidden="true" />

          {/* Right panel toggle */}
          <div className="flex items-center pl-2">
            <IconButton
              aria-label="Toggle Properties Panel"
              title="Toggle Properties Panel"
              icon={<PanelRight className="w-4 h-4" />}
              onClick={toggleRightPanel}
            />
          </div>
        </div>
      </FloatingSurface>
    </div>
  );
});


