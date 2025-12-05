import { useState, useEffect } from 'react';
import { Renderer } from '../renderer/Renderer';

interface StatusBarProps {
  renderer: Renderer | null;
}

/**
 * Status bar showing render statistics
 */
export function StatusBar({ renderer }: StatusBarProps) {
  const [samples, setSamples] = useState(0);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!renderer) return;

    const interval = setInterval(() => {
      const stats = renderer.getStats();
      setSamples(stats.sampleCount);
      setFps(stats.fps);
    }, 100);

    return () => clearInterval(interval);
  }, [renderer]);

  return (
    <footer className="h-6 bg-panel-secondary border-t border-border-subtle flex items-center justify-end px-4 text-xs text-text-muted gap-4">
      <span>FPS: {fps}</span>
      <span>Samples: {samples}</span>
    </footer>
  );
}

