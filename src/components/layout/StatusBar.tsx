import { useState, useEffect } from 'react';
import { Renderer } from '../../renderer/Renderer';
import { useKernelSceneSnapshot } from '@adapters';
import { Hud } from './Hud';
import { PerformanceWidget } from './PerformanceWidget';
import { MobileHud } from './MobileHud';

interface StatusBarProps {
  rendererRef: React.RefObject<Renderer | null>;
}

export function StatusBar({ rendererRef }: StatusBarProps) {
  const snap = useKernelSceneSnapshot();
  const [sampleCount, setSampleCount] = useState(0);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const renderer = rendererRef.current;
      if (renderer) {
        setSampleCount(renderer.getSampleCount());
        setFps(renderer.getStats().fps);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [rendererRef]);

  return (
    <>
      <Hud />
      <MobileHud />
      <PerformanceWidget fps={fps} samples={sampleCount} />
      <footer className="h-6 bg-panel-secondary border-t border-border-subtle flex items-center justify-end px-4 text-xs text-text-muted gap-4">
        <span>Objects: {snap.objects.length}</span>
        <span>Samples: {sampleCount}</span>
        <span>FPS: {fps}</span>
      </footer>
    </>
  );
}

