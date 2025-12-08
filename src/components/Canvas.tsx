import { useRef, useEffect, useState, useCallback } from 'react';
import { initWebGPU } from '../renderer/webgpu';
import { Renderer } from '../renderer/Renderer';
import { DebugPanel } from './DebugPanel';
import { StatusBar } from './StatusBar';

interface CanvasProps {
  className?: string;
}

export type CanvasStatus = 'loading' | 'ready' | 'error';

export function Canvas({ className }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [status, setStatus] = useState<CanvasStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resize handler that updates both canvas and renderer
  const handleResize = useCallback((width: number, height: number) => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.max(1, Math.floor(width * dpr));
    const pixelHeight = Math.max(1, Math.floor(height * dpr));

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    // Notify renderer of resize
    if (renderer) {
      renderer.resize(pixelWidth, pixelHeight);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mounted = true;

    const init = async () => {
      try {
        const ctx = await initWebGPU(canvas);

        if (!mounted) {
          ctx.device.destroy();
          return;
        }

        const renderer = new Renderer(ctx);
        rendererRef.current = renderer;

        // Initial resize
        const rect = canvas.getBoundingClientRect();
        handleResize(rect.width, rect.height);

        renderer.start();
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;

        const error = err instanceof Error ? err : new Error(String(err));
        setStatus('error');
        setErrorMessage(error.message);
      }
    };

    init();

    return () => {
      mounted = false;
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, [handleResize]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      handleResize(width, height);
    });

    observer.observe(canvas);

    return () => observer.disconnect();
  }, [handleResize]);

  if (status === 'error') {
    return (
      <div className={`flex items-center justify-center bg-base ${className || ''}`}>
        <div className="text-center p-8 max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-text-primary">
            WebGPU Not Available
          </h2>
          <p className="text-text-secondary mb-4">{errorMessage}</p>
          <a
            href="https://caniuse.com/webgpu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Check browser compatibility →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className || ''}`}>
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          tabIndex={0}
        />
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-base">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-text-secondary">Initializing WebGPU...</p>
            </div>
          </div>
        )}
        {status === 'ready' && <DebugPanel />}
      </div>
      {status === 'ready' && <StatusBar rendererRef={rendererRef} />}
    </div>
  );
}

export default Canvas;
