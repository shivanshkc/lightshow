import { memo, useCallback, useMemo } from 'react';
import { Focus, Home, PanelLeft, PanelRight, RotateCcw, RotateCw } from 'lucide-react';
import { useKernel, useKernelSceneSnapshot } from '@adapters';
import { FloatingSurface } from '../ui/FloatingSurface';
import { IconButton } from '../ui/IconButton';
import { SegmentedControl } from '../ui/SegmentedControl';
import { useUiShellStore } from './uiShellStore';
import { useUiGizmoMode } from './useUiGizmoMode';
import { useMediaQuery } from './useMediaQuery';
import { triggerResponsiveHome } from './responsiveHome';

type HudMode = 'translate' | 'rotate' | 'scale';

function clampHudMode(mode: string): HudMode {
  return mode === 'rotate' || mode === 'scale' ? mode : 'translate';
}

function nextHudMode(mode: HudMode): HudMode {
  switch (mode) {
    case 'translate':
      return 'rotate';
    case 'rotate':
      return 'scale';
    case 'scale':
      return 'translate';
  }
}

function hudModeLabel(mode: HudMode): string {
  switch (mode) {
    case 'translate':
      return 'Translate';
    case 'rotate':
      return 'Rotate';
    case 'scale':
      return 'Scale';
  }
}

function hudModeKey(mode: HudMode): string {
  switch (mode) {
    case 'translate':
      return 'W';
    case 'rotate':
      return 'E';
    case 'scale':
      return 'R';
  }
}

/**
 * Mobile HUD (bottom bar).
 * - Visible below lg.
 * - Hidden while a sheet is open (sheet covers the bar).
 * - Hides W/E/R on phones; keeps on tablets.
 */
export const MobileHud = memo(function MobileHud() {
  const kernel = useKernel();
  const snap = useKernelSceneSnapshot();
  const hasSelection = snap.selectedObjectId !== null;

  const { isMobileSheetOpen, openMobileSheet } = useUiShellStore((s) => ({
    isMobileSheetOpen: s.isMobileSheetOpen,
    openMobileSheet: s.openMobileSheet,
  }));

  // Tailwind md breakpoint = 768px. Use segmented W/E/R on tablets; use a cycle button on phones.
  const showWerSegmented = useMediaQuery('(min-width: 768px)');

  const { mode, setMode } = useUiGizmoMode();
  const hudMode = clampHudMode(mode);

  const setHudMode = useCallback(
    (m: HudMode) => {
      setMode(m);
    },
    [setMode]
  );

  const cycleHudMode = useCallback(() => {
    setMode(nextHudMode(hudMode));
  }, [hudMode, setMode]);

  const dispatchKey = useCallback((key: string) => {
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

  // Sheet covers bar; bar is inaccessible while open.
  if (isMobileSheetOpen) return null;

  const next = nextHudMode(hudMode);

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 lg:hidden">
      <FloatingSurface className="px-2 py-2">
        <div className="flex items-center justify-between">
          <IconButton
            aria-label="Open Scene Sheet"
            title="Open Scene"
            icon={<PanelLeft className="w-4 h-4" />}
            onClick={() => openMobileSheet('left')}
          />

          <div className="flex items-center gap-1">
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

          {showWerSegmented ? (
            <div className="px-2">
              <SegmentedControl<HudMode>
                value={hudMode}
                onChange={setHudMode}
                options={segments}
                size="md"
              />
            </div>
          ) : (
            <div className="px-2">
              <IconButton
                aria-label="Cycle Gizmo Mode (W/E/R)"
                title={`Tap to cycle: ${hudModeLabel(hudMode)} → ${hudModeLabel(next)}`}
                icon={<span className="text-xs font-semibold">{hudModeKey(hudMode)}</span>}
                onClick={cycleHudMode}
                className="!rounded-full"
              />
            </div>
          )}

          <div className="flex items-center gap-1">
            <IconButton
              aria-label="Reset Camera"
              title="Reset Camera (Home)"
              icon={<Home className="w-4 h-4" />}
              onClick={triggerResponsiveHome}
            />
            <IconButton
              aria-label="Focus Selection"
              title="Focus Selection (F)"
              icon={<Focus className="w-4 h-4" />}
              disabled={!hasSelection}
              onClick={() => dispatchKey('f')}
            />
          </div>

          <IconButton
            aria-label="Open Properties Sheet"
            title="Open Properties"
            icon={<PanelRight className="w-4 h-4" />}
            onClick={() => openMobileSheet('right')}
          />
        </div>
      </FloatingSurface>
    </div>
  );
});


