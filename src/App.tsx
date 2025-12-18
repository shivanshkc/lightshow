import { useRef, useCallback } from 'react';
import { LeftPanel, RightPanel, StatusBar, Canvas } from '@components';
import { Renderer } from '@renderer';
import { useKeyboardShortcuts, useBeforeUnloadWarning } from '@hooks';

export function App() {
  const rendererRef = useRef<Renderer | null>(null);

  useKeyboardShortcuts();
  useBeforeUnloadWarning(true);

  const handleRendererReady = useCallback((renderer: Renderer) => {
    rendererRef.current = renderer;
    // Optional benchmark hook (only active when loaded by src/main.tsx).
    window.__LIGHTSHOW_BENCH__?.registerRenderer(renderer);
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col bg-base text-text-primary overflow-hidden font-sans">
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
