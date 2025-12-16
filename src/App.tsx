import { useRef, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { LeftPanel } from './components/layout/LeftPanel';
import { RightPanel } from './components/layout/RightPanel';
import { StatusBar } from './components/layout/StatusBar';
import { Canvas } from './components/Canvas';
import { Renderer } from './renderer/Renderer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export function App() {
  const rendererRef = useRef<Renderer | null>(null);

  useKeyboardShortcuts();

  const handleRendererReady = useCallback((renderer: Renderer) => {
    rendererRef.current = renderer;
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col bg-base text-text-primary overflow-hidden font-sans">
      <Header />

      <div className="flex-1 flex min-h-0">
        <LeftPanel />

        <main className="flex-1 relative">
          <Canvas className="absolute inset-0" onRendererReady={handleRendererReady} />
        </main>

        <RightPanel />
      </div>

      <StatusBar rendererRef={rendererRef} />
    </div>
  );
}

export default App;
