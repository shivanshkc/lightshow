import { useRef, useEffect, useState, useCallback } from 'react';
import { initWebGPU } from '../renderer/webgpu';
import { Renderer } from '../renderer/Renderer';
import { CameraController } from '../core/CameraController';
import { raycaster } from '../core/Raycaster';
import { GizmoRaycaster } from '../gizmos/GizmoRaycaster';
import { TranslateGizmo } from '../gizmos/TranslateGizmo';
import { RotateGizmo } from '../gizmos/RotateGizmo';
import { ScaleGizmo } from '../gizmos/ScaleGizmo';
import { useSceneStore } from '../store/sceneStore';
import { useCameraStore } from '../store/cameraStore';
import { useGizmoStore } from '../store/gizmoStore';
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

  // Click-to-select and gizmo interaction handling
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const dragStartRay = useRef<Ray | null>(null);
  const dragStartRotation = useRef<[number, number, number] | null>(null);
  const dragStartScale = useRef<Vec3 | null>(null);
  const DRAG_THRESHOLD = 5;

  // Helper to get camera vectors
  const getCameraVectors = useCallback(() => {
    const cameraState = useCameraStore.getState();
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
  }, []);

  // Handle mouse move for gizmo hover and drag
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const gizmoState = useGizmoStore.getState();
      const sceneState = useSceneStore.getState();

      // If dragging gizmo, update object transform
      if (gizmoState.isDragging && gizmoState.activeAxis && gizmoState.dragStartMousePosition) {
        const selectedObject = sceneState.objects.find(
          (obj) => obj.id === sceneState.selectedObjectId
        );

        if (selectedObject) {
          const cameraState = useCameraStore.getState();

          if (gizmoState.mode === 'translate' && gizmoState.dragStartPosition && dragStartRay.current) {
            // Translation using ray-plane intersection
            const { forward } = getCameraVectors();
            
            // Create current ray from mouse position
            const viewMatrix = cameraState.getViewMatrix();
            const aspect = rect.width / rect.height;
            const projMatrix = mat4Perspective(cameraState.fovY, aspect, 0.1, 1000);
            const inverseView = mat4Inverse(viewMatrix);
            const inverseProjection = mat4Inverse(projMatrix);
            
            const currentRay = screenToWorldRay(
              x,
              y,
              rect.width,
              rect.height,
              inverseProjection,
              inverseView,
              cameraState.position
            );

            let newPosition = TranslateGizmo.calculateDragPositionRayPlane(
              gizmoState.activeAxis,
              gizmoState.dragStartPosition,
              dragStartRay.current,
              currentRay,
              forward
            );

            // Apply grid snapping if Ctrl is held
            if (e.ctrlKey || e.metaKey) {
              newPosition = TranslateGizmo.snapToGrid(newPosition, 0.5);
            }

            // Apply precision mode if Shift is held
            if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
              const movement = sub(newPosition, gizmoState.dragStartPosition);
              const preciseMovement = TranslateGizmo.applyPrecision(movement, true, 0.1);
              newPosition = [
                gizmoState.dragStartPosition[0] + preciseMovement[0],
                gizmoState.dragStartPosition[1] + preciseMovement[1],
                gizmoState.dragStartPosition[2] + preciseMovement[2],
              ];
            }

            sceneState.updateTransform(sceneState.selectedObjectId!, {
              position: newPosition,
            });
          } else if (gizmoState.mode === 'rotate' && dragStartRotation.current) {
            // Rotation
            const axis = gizmoState.activeAxis;
            if (axis === 'x' || axis === 'y' || axis === 'z' || axis === 'trackball') {
              let rotationDelta = RotateGizmo.calculateRotation(
                axis,
                selectedObject.transform.position,
                gizmoState.dragStartMousePosition,
                [e.clientX, e.clientY],
                cameraState.position
              );

              // Apply snapping if Ctrl is held (15 degree increments)
              if (e.ctrlKey || e.metaKey) {
                rotationDelta = [
                  RotateGizmo.snapAngle(rotationDelta[0]),
                  RotateGizmo.snapAngle(rotationDelta[1]),
                  RotateGizmo.snapAngle(rotationDelta[2]),
                ];
              }

              const newRotation = RotateGizmo.addRotation(dragStartRotation.current, rotationDelta);

              sceneState.updateTransform(sceneState.selectedObjectId!, {
                rotation: newRotation,
              });
            }
          } else if (gizmoState.mode === 'scale' && dragStartScale.current) {
            // Scale
            const axis = gizmoState.activeAxis;
            const scaleAxis =
              axis === 'uniform' || axis === 'xy' || axis === 'xz' || axis === 'yz' || axis === 'xyz'
                ? 'uniform'
                : axis === 'trackball'
                  ? 'uniform'
                  : axis;
            
            let newScale = ScaleGizmo.calculateScale(
              scaleAxis,
              dragStartScale.current,
              gizmoState.dragStartMousePosition,
              [e.clientX, e.clientY],
              selectedObject.type
            );

            // Apply snapping if Ctrl is held
            if (e.ctrlKey || e.metaKey) {
              newScale = ScaleGizmo.snapScale(newScale);
            }

            sceneState.updateTransform(sceneState.selectedObjectId!, {
              scale: newScale,
            });
          }
        }
        return;
      }

      // Check gizmo hover if object is selected (for all modes)
      if (sceneState.selectedObjectId && gizmoState.mode !== 'none') {
        const selectedObject = sceneState.objects.find(
          (obj) => obj.id === sceneState.selectedObjectId
        );

        if (selectedObject) {
          const cameraState = useCameraStore.getState();
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
    [getCameraVectors]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      mouseDownPos.current = { x: e.clientX, y: e.clientY };

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const gizmoState = useGizmoStore.getState();
      const sceneState = useSceneStore.getState();

      // Check if clicking on gizmo (for all modes)
      if (sceneState.selectedObjectId && gizmoState.mode !== 'none') {
        const selectedObject = sceneState.objects.find(
          (obj) => obj.id === sceneState.selectedObjectId
        );

        if (selectedObject) {
          const cameraState = useCameraStore.getState();
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
            
            // Disable camera controller during gizmo drag
            if (controllerRef.current) {
              controllerRef.current.setEnabled(false);
            }
            return;
          }
        }
      }
    },
    []
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const gizmoState = useGizmoStore.getState();

      // End gizmo drag
      if (gizmoState.isDragging) {
        gizmoState.endDrag();
        dragStartRay.current = null;
        dragStartRotation.current = null;
        dragStartScale.current = null;
        
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

  // Handle mouse leave to clear hover
  const handleMouseLeave = useCallback(() => {
    useGizmoStore.getState().setHoveredAxis(null);
  }, []);

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
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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
