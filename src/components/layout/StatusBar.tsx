import { useState, useEffect } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { Renderer } from '../../renderer/Renderer';

interface StatusBarProps {
  rendererRef: React.RefObject<Renderer | null>;
}

export function StatusBar({ rendererRef }: StatusBarProps) {
  const objectCount = useSceneStore((state) => state.objects.length);
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
    <footer className="h-6 bg-panel-secondary border-t border-border-subtle flex items-center justify-end px-4 text-xs text-text-muted gap-4">
      <span>Objects: {objectCount}</span>
      <span>Samples: {sampleCount}</span>
      <span>FPS: {fps}</span>
    </footer>
  );
}

