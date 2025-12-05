import { useState, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { DebugPanel } from './components/DebugPanel';
import { StatusBar } from './components/StatusBar';
import { Renderer } from './renderer/Renderer';

export default function App() {
  const [renderer, setRenderer] = useState<Renderer | null>(null);

  const handleRendererReady = useCallback((r: Renderer) => {
    setRenderer(r);
  }, []);

  return (
    <div className="w-full h-full bg-base flex flex-col">
      <div className="flex-1 relative">
        <Canvas className="w-full h-full" onRendererReady={handleRendererReady} />
        <DebugPanel />
      </div>
      <StatusBar renderer={renderer} />
    </div>
  );
}
