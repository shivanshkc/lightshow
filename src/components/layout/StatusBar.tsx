import { useState, useEffect } from 'react';
import { Renderer } from '../../renderer/Renderer';
import { Hud } from './Hud';
import { PerformanceWidget } from './PerformanceWidget';
import { MobileHud } from './MobileHud';
import { applyResponsiveHomeDistance, getCanvasRect, UI_CAMERA_EVENTS } from './responsiveHome';
import { useCameraStore } from '@store';

interface StatusBarProps {
  rendererRef: React.RefObject<Renderer | null>;
}

export function StatusBar({ rendererRef }: StatusBarProps) {
  const [sampleCount, setSampleCount] = useState(0);
  const [fps, setFps] = useState(0);

  // Home button framing: reset camera + apply responsive distance + reset accumulation.
  useEffect(() => {
    const onHome = () => {
      const cam = useCameraStore.getState();
      cam.reset();
      const rect = getCanvasRect();
      if (!rect) return;
      applyResponsiveHomeDistance(rect.width, rect.height);
      rendererRef.current?.resetAccumulation();
    };
    window.addEventListener(UI_CAMERA_EVENTS.home, onHome);
    return () => window.removeEventListener(UI_CAMERA_EVENTS.home, onHome);
  }, [rendererRef]);

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

