import { memo, useMemo } from 'react';
import { FloatingSurface } from '../ui/FloatingSurface';
import { useUiShellStore } from './uiShellStore';
import { UI_LAYOUT } from './layoutConstants';

export function formatCompactInt(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  if (abs < 1000) return `${n}`;
  if (abs < 10_000) {
    // 1.0k .. 9.9k (one decimal)
    const v = Math.round((abs / 100) /* one decimal */) / 10;
    return `${sign}${v}k`;
  }
  if (abs < 1_000_000) {
    // 10k .. 999k (integer)
    const v = Math.round(abs / 1000);
    return `${sign}${v}k`;
  }
  // >= 1M
  const v = Math.round(abs / 100_000) / 10; // one decimal in M
  return `${sign}${v}M`;
}

export interface PerformanceWidgetProps {
  fps: number;
  samples: number;
}

/**
 * Step 6: Performance widget (FPS + Samples), fixed-width, read-only.
 * Step 7 will add lockstep animation with right panel; for now it is positioned
 * to avoid overlap when the right panel is open.
 */
export const PerformanceWidget = memo(function PerformanceWidget({
  fps,
  samples,
}: PerformanceWidgetProps) {
  const isRightPanelOpen = useUiShellStore((s) => s.isRightPanelOpen);
  const compactSamples = useMemo(() => formatCompactInt(samples), [samples]);

  // Keep fixed width so values don't cause layout jitter.
  // Lockstep motion: anchor to the right panel’s left edge by translating left by
  // (panelWidth + gap) when the panel is open. Panel and widget share timing.
  const shiftPx = UI_LAYOUT.rightPanelWidthPx + UI_LAYOUT.panelWidgetGapPx;

  return (
    <div
      className="fixed top-3 right-3 z-50 transition-transform duration-200 ease-out"
      style={{
        transform: isRightPanelOpen ? `translateX(${-shiftPx}px)` : 'translateX(0px)',
      }}
    >
      <FloatingSurface className="w-[180px] px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-text-muted whitespace-nowrap">FPS</span>
            <span className="font-mono tabular-nums text-text-primary whitespace-nowrap">
              {Math.round(fps)}
            </span>
            <span className="h-3 w-px bg-border-subtle" aria-hidden="true" />
            <span className="text-text-muted whitespace-nowrap">Samples</span>
          </div>

          <span className="font-mono tabular-nums text-text-primary whitespace-nowrap">
            {compactSamples}
          </span>
        </div>
      </FloatingSurface>
    </div>
  );
});


