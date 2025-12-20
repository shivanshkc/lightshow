import type { ReactNode } from 'react';

export interface FloatingSurfaceProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared “floating” surface styling for HUD/panels/widgets.
 * Keeps border/shadow/radius consistent across the UI v3 overlays.
 */
export function FloatingSurface({ children, className = '' }: FloatingSurfaceProps) {
  return (
    <div
      className={`
        rounded-xl
        bg-panel/95
        border border-border-subtle
        shadow-[0_10px_30px_rgba(0,0,0,0.45)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}


