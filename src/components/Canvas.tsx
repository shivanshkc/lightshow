import { useRef, useEffect, useState, useCallback } from 'react';
import { initWebGPU } from '../renderer/webgpu';
import { Renderer } from '../renderer/Renderer';
import { CameraController } from '../core/CameraController';
import { raycaster } from '../core/Raycaster';
import { useSceneStore } from '../store/sceneStore';
import { useCameraStore } from '../store/cameraStore';
import { mat4Inverse, mat4Perspective } from '../core/math';

interface CanvasProps {
  className?: string;
  onRendererReady?: (renderer: Renderer) => void;
}

export type CanvasStatus = 'loading' | 'ready' | 'error';

export function Canvas({ className, onRendererReady }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const controllerRef = useRef<CameraController | null>(null);
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

        // Initialize camera controller
        const controller = new CameraController(canvas);
        controllerRef.current = controller;

        // Reset accumulation when camera changes
        controller.onCameraChange = () => {
          renderer.resetAccumulation();
        };

        // Initial resize
        const rect = canvas.getBoundingClientRect();
        handleResize(rect.width, rect.height);

        renderer.start();
        setStatus('ready');

        // Notify parent that renderer is ready
        onRendererReady?.(renderer);
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
      controllerRef.current?.destroy();
      controllerRef.current = null;
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, [handleResize, onRendererReady]);

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

  // Click-to-select handling
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD = 5;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!mouseDownPos.current) return;

      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only select if this was a click, not a drag
      if (distance < DRAG_THRESHOLD) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Get camera state
        const cameraState = useCameraStore.getState();
        const viewMatrix = cameraState.getViewMatrix();
        const aspect = canvas.width / canvas.height;
        const projMatrix = mat4Perspective(cameraState.fovY, aspect, 0.1, 1000);
        const inverseView = mat4Inverse(viewMatrix);
        const inverseProjection = mat4Inverse(projMatrix);

        // Get scene objects
        const objects = useSceneStore.getState().objects;

        // Perform picking
        const result = raycaster.pick(
          x,
          y,
          rect.width,
          rect.height,
          cameraState.position,
          inverseProjection,
          inverseView,
          objects
        );

        // Update selection
        useSceneStore.getState().selectObject(result.objectId);

        // Reset accumulation when selection changes
        rendererRef.current?.resetAccumulation();
      }

      mouseDownPos.current = null;
    },
    []
  );

  if (status === 'error') {
    return (
      <div
        className={`flex items-center justify-center bg-base ${className || ''}`}
      >
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
    <div className={`relative w-full h-full ${className || ''}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-base z-10">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-text-secondary">Initializing WebGPU...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Canvas;
