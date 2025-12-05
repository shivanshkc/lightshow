import { useRef, useEffect, useState } from 'react';
import { initWebGPU, WebGPUContext } from '../renderer/webgpu';

interface CanvasProps {
  className?: string;
  onContextReady?: (ctx: WebGPUContext) => void;
  onError?: (error: Error) => void;
}

export type CanvasStatus = 'loading' | 'ready' | 'error';

export function Canvas({ className, onContextReady, onError }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<WebGPUContext | null>(null);
  const [status, setStatus] = useState<CanvasStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

        contextRef.current = ctx;
        setStatus('ready');
        onContextReady?.(ctx);
      } catch (err) {
        if (!mounted) return;
        
        const error = err instanceof Error ? err : new Error(String(err));
        setStatus('error');
        setErrorMessage(error.message);
        onError?.(error);
      }
    };

    init();

    return () => {
      mounted = false;
      if (contextRef.current) {
        contextRef.current.device.destroy();
        contextRef.current = null;
      }
    };
  }, [onContextReady, onError]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
    });

    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  if (status === 'error') {
    return (
      <div className={`flex items-center justify-center bg-base ${className}`}>
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

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center bg-base ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary">Initializing WebGPU...</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      tabIndex={0}
    />
  );
}

export default Canvas;

