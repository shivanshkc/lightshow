import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { initWebGPU } from '../renderer/webgpu';
import { Renderer } from '../renderer/Renderer';
import { CameraController } from '../core/CameraController';
import { GizmoRaycaster } from '../gizmos/GizmoRaycaster';
import { LIMITS } from '../utils/limits';
import { computeGizmoDragCommand, createRendererDepsFromStores, createCanvasDepsFromStores, useKernel } from '@adapters';
import {
  mat4Inverse,
  mat4Perspective,
  screenToWorldRay,
  normalize,
  sub,
  cross,
  Vec3,
  Ray,
} from '../core/math';

interface CanvasProps {
  className?: string;
  onRendererReady?: (renderer: Renderer) => void;
}

export type CanvasStatus = 'loading' | 'ready' | 'error';

export function Canvas({ className, onRendererReady }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const controllerRef = useRef<CameraController | null>(null);
  const kernel = useKernel();
  const deps = useMemo(() => createCanvasDepsFromStores(), []);
  const [status, setStatus] = useState<CanvasStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resize handler that updates both canvas and renderer
  const handleResize = useCallback((width: number, height: number) => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, LIMITS.maxDpr);
    const pixelWidth = Math.max(
      1,
      Math.min(LIMITS.maxRenderSize, Math.floor(width * dpr))
    );
    const pixelHeight = Math.max(
      1,
      Math.min(LIMITS.maxRenderSize, Math.floor(height * dpr))
    );

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

        // Handle GPU device lost (common on driver resets / tab backgrounding)
        ctx.device.lost.then((info) => {
          if (!mounted) return;
          rendererRef.current?.destroy();
          rendererRef.current = null;
          setStatus('error');
          setErrorMessage(
            `WebGPU device lost${info?.message ? `: ${info.message}` : ''}. Reload the page to continue.`
          );
        });

        const renderer = new Renderer(ctx, createRendererDepsFromStores(kernel));
        rendererRef.current = renderer;

        // Initialize camera controller
        const controller = new CameraController(
          canvas,
          {
            getCamera: () => deps.getCameraState(),
            getGizmo: () => deps.getGizmoState(),
            getSceneSnapshot: () => kernel.queries.getSceneSnapshot() as any,
          },
          {}
        );
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
  }, [deps, handleResize, kernel, onRendererReady]);

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

  // Click-to-select and gizmo interaction handling
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const touchStartPos = useRef<{ x: number; y: number; t: number } | null>(
    null
  );
  const dragStartRay = useRef<Ray | null>(null);
  const dragStartRotation = useRef<[number, number, number] | null>(null);
  const dragStartScale = useRef<Vec3 | null>(null);
  const DRAG_THRESHOLD = 5;
  const TAP_MAX_MS = 250;

  // Helper to get camera vectors
  const getCameraVectors = useCallback(() => {
    const cameraState = deps.getCameraState();
    const target = cameraState.target;
    const position = cameraState.position;
    
    // Forward direction (from camera to target)
    const forward = normalize(sub(target, position));
    
    // Right vector: cross(forward, worldUp)
    const worldUp: Vec3 = [0, 1, 0];
    const right = normalize(cross(forward, worldUp));
    
    // Camera up vector: cross(right, forward)
    const up = cross(right, forward);
    
    return { right, up, forward };
  }, [deps]);

  // Handle mouse move for gizmo hover and drag
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const gizmoState = deps.getGizmoState();
      const sceneState = kernel.queries.getSceneSnapshot();

      // If dragging gizmo, update object transform
      if (gizmoState.isDragging && gizmoState.activeAxis && gizmoState.dragStartMousePosition) {
        const selectedObject = sceneState.objects.find(
          (obj) => obj.id === sceneState.selectedObjectId
        );

        if (selectedObject) {
          const cameraState = deps.getCameraState();
          const { forward } = getCameraVectors();
          const cmd = computeGizmoDragCommand({
            mode: gizmoState.mode,
            axis: gizmoState.activeAxis,
            objectId: sceneState.selectedObjectId!,
            objectType: selectedObject.type,
            objectPosition: selectedObject.transform.position,
            startPosition: gizmoState.dragStartPosition ?? selectedObject.transform.position,
            startRotation: dragStartRotation.current,
            startScale: dragStartScale.current,
            dragStartRay: dragStartRay.current,
            dragStartMouse: gizmoState.dragStartMousePosition,
            currentMouse: { x: e.clientX, y: e.clientY },
            rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
            camera: {
              position: cameraState.position,
              fovY: cameraState.fovY,
              getViewMatrix: cameraState.getViewMatrix,
            },
            modifiers: { ctrlOrMeta: e.ctrlKey || e.metaKey, shift: e.shiftKey },
            cameraForward: forward,
          });

          if (cmd) kernel.dispatch(cmd);
        }
        return;
      }

      // Check gizmo hover if object is selected (for all modes)
      if (sceneState.selectedObjectId && gizmoState.mode !== 'none') {
        const selectedObject = sceneState.objects.find(
          (obj) => obj.id === sceneState.selectedObjectId
        );

        if (selectedObject) {
          const cameraState = deps.getCameraState();
          const viewMatrix = cameraState.getViewMatrix();
          const aspect = rect.width / rect.height;
          const projMatrix = mat4Perspective(cameraState.fovY, aspect, 0.1, 1000);
          const inverseView = mat4Inverse(viewMatrix);
          const inverseProjection = mat4Inverse(projMatrix);

          // Create ray for gizmo picking
          const ray = screenToWorldRay(
            x,
            y,
            rect.width,
            rect.height,
            inverseProjection,
            inverseView,
            cameraState.position
          );

          // Calculate gizmo scale
          const gizmoScale = cameraState.distance * 0.12;

          // Check if ray hits gizmo (mode-aware picking)
          const hitAxis = GizmoRaycaster.pick(ray, selectedObject.transform.position, gizmoScale, gizmoState.mode);
          gizmoState.setHoveredAxis(hitAxis);
        }
      }
    },
    [getCameraVectors, kernel]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      mouseDownPos.current = { x: e.clientX, y: e.clientY };

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const gizmoState = deps.getGizmoState();
      const sceneState = kernel.queries.getSceneSnapshot();

      // Check if clicking on gizmo (for all modes)
      if (sceneState.selectedObjectId && gizmoState.mode !== 'none') {
        const selectedObject = sceneState.objects.find(
          (obj) => obj.id === sceneState.selectedObjectId
        );

        if (selectedObject) {
          const cameraState = deps.getCameraState();
          const viewMatrix = cameraState.getViewMatrix();
          const aspect = rect.width / rect.height;
          const projMatrix = mat4Perspective(cameraState.fovY, aspect, 0.1, 1000);
          const inverseView = mat4Inverse(viewMatrix);
          const inverseProjection = mat4Inverse(projMatrix);

          // Create ray for gizmo picking
          const ray = screenToWorldRay(
            x,
            y,
            rect.width,
            rect.height,
            inverseProjection,
            inverseView,
            cameraState.position
          );

          // Calculate gizmo scale
          const gizmoScale = cameraState.distance * 0.12;

          // Check if ray hits gizmo (mode-aware picking)
          const hitAxis = GizmoRaycaster.pick(ray, selectedObject.transform.position, gizmoScale, gizmoState.mode);

          if (hitAxis) {
            // Store start values based on mode
            if (gizmoState.mode === 'translate') {
              dragStartRay.current = ray;
            } else if (gizmoState.mode === 'rotate') {
              dragStartRotation.current = [...selectedObject.transform.rotation] as [number, number, number];
            } else if (gizmoState.mode === 'scale') {
              dragStartScale.current = [...selectedObject.transform.scale] as Vec3;
            }
            
            // Start gizmo drag
            gizmoState.startDrag(hitAxis, selectedObject.transform.position, [e.clientX, e.clientY]);
            // Group continuous transform edits into a single undo step.
            kernel.dispatch({ v: 1, type: 'history.group.begin', label: 'transform' });
            
            // Disable camera controller during gizmo drag
            if (controllerRef.current) {
              controllerRef.current.setEnabled(false);
            }
            return;
          }
        }
      }
    },
    [kernel]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const gizmoState = deps.getGizmoState();

      // End gizmo drag
      if (gizmoState.isDragging) {
        gizmoState.endDrag();
        dragStartRay.current = null;
        dragStartRotation.current = null;
        dragStartScale.current = null;
        // Commit grouped transform history.
        kernel.dispatch({ v: 1, type: 'history.group.end' });
        
        // Re-enable camera controller
        if (controllerRef.current) {
          controllerRef.current.setEnabled(true);
        }
        
        mouseDownPos.current = null;
        return;
      }

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
        const cameraState = deps.getCameraState();
        const viewMatrix = cameraState.getViewMatrix();
        const aspect = canvas.width / canvas.height;
        const projMatrix = mat4Perspective(cameraState.fovY, aspect, 0.1, 1000);
        const inverseView = mat4Inverse(viewMatrix);
        const inverseProjection = mat4Inverse(projMatrix);

        const ray = screenToWorldRay(
          x,
          y,
          rect.width,
          rect.height,
          inverseProjection,
          inverseView,
          cameraState.position
        );

        // Ask kernel to choose closest visible hit for this ray.
        kernel.dispatch({ v: 1, type: 'selection.pick', ray: ray as any });
      }

      mouseDownPos.current = null;
    },
    [kernel]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) {
      touchStartPos.current = null;
      return;
    }
    const t = e.touches[0]!;
    touchStartPos.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const start = touchStartPos.current;
    touchStartPos.current = null;
    if (!start) return;

    // Only treat as tap if it was short and didn't move much.
    const dt = Date.now() - start.t;
    if (dt > TAP_MAX_MS) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Use the last known end position from the changed touch
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) return;

    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    const cameraState = deps.getCameraState();
    const viewMatrix = cameraState.getViewMatrix();
    const aspect = rect.width / rect.height;
    const projMatrix = mat4Perspective(cameraState.fovY, aspect, 0.1, 1000);
    const inverseView = mat4Inverse(viewMatrix);
    const inverseProjection = mat4Inverse(projMatrix);

    const ray = screenToWorldRay(
      x,
      y,
      rect.width,
      rect.height,
      inverseProjection,
      inverseView,
      cameraState.position
    );

    kernel.dispatch({ v: 1, type: 'selection.pick', ray: ray as any });
  }, [deps, kernel]);

  // Handle mouse leave to clear hover
  const handleMouseLeave = useCallback(() => {
    deps.getGizmoState().setHoveredAxis(null);
  }, [deps]);

  if (status === 'error') {
    const isDeviceLost = (errorMessage || '').toLowerCase().includes('device lost');
    const title = isDeviceLost ? 'WebGPU Device Lost' : 'WebGPU Not Available';

    return (
      <div
        className={`flex items-center justify-center bg-base ${className || ''}`}
      >
        <div className="text-center p-8 max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-text-primary">
            {title}
          </h2>
          <p className="text-text-secondary mb-4">{errorMessage}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent rounded hover:bg-accent-hover text-white"
            >
              Reload
            </button>
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
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
