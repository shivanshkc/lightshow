import { useState, useEffect } from 'react';
import { Renderer } from '../../renderer/Renderer';
import { Hud } from './Hud';
import { PerformanceWidget } from './PerformanceWidget';
import { MobileHud } from './MobileHud';

interface StatusBarProps {
  rendererRef: React.RefObject<Renderer | null>;
}

export function StatusBar({ rendererRef }: StatusBarProps) {
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
    </>
  );
}

