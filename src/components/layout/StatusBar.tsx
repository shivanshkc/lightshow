import { useState, useEffect } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { Renderer } from '../../renderer/Renderer';
import { RotateCcw, RotateCw } from 'lucide-react';

interface StatusBarProps {
  rendererRef: React.RefObject<Renderer | null>;
}

export function StatusBar({ rendererRef }: StatusBarProps) {
  const objectCount = useSceneStore((state) => state.objects.length);
  const undo = useSceneStore((s: any) => s.undo);
  const redo = useSceneStore((s: any) => s.redo);
  const canUndo = useSceneStore((s: any) => s.canUndo);
  const canRedo = useSceneStore((s: any) => s.canRedo);
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

      <span className="h-3 w-px bg-border-subtle" aria-hidden="true" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          title="Undo (Ctrl/Cmd+Z)"
          aria-label="Undo"
          disabled={!canUndo()}
          onClick={() => undo()}
          className="
            p-1 rounded
            hover:bg-hover transition-colors
            disabled:opacity-40 disabled:hover:bg-transparent
          "
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Redo (Ctrl/Cmd+Y)"
          aria-label="Redo"
          disabled={!canRedo()}
          onClick={() => redo()}
          className="
            p-1 rounded
            hover:bg-hover transition-colors
            disabled:opacity-40 disabled:hover:bg-transparent
          "
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
}

