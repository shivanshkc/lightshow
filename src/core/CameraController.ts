import { useCameraStore } from '../store/cameraStore';
import { useSceneStore } from '../store/sceneStore';
import { useGizmoStore } from '../store/gizmoStore';
import { raycaster } from './Raycaster';
import { mat4Inverse, mat4Perspective, screenToWorldRay } from './math';

interface ControllerOptions {
  orbitSensitivity?: number;
  panSensitivity?: number;
  zoomSensitivity?: number;
}

/**
 * Camera controller handling mouse and keyboard input
 *
 * Controls:
 * - Left mouse drag: Orbit around target
 * - Middle mouse drag / Shift + Left drag: Pan camera
 * - Scroll wheel: Zoom in/out
 * - Home key: Reset camera
 * - F key: Focus on selected object
 * - Double-click: Focus on clicked object (falls back to origin)
 */
export class CameraController {
  private canvas: HTMLCanvasElement;
  private options: Required<ControllerOptions>;

  private isDragging = false;
  private dragButton = -1;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private isShiftDown = false;
  private enabled = true;

  // Touch gesture state
  private isTouching = false;
  private lastTouchDistance = 0;
  private lastTouchMidX = 0;
  private lastTouchMidY = 0;

  private boundHandlers: {
    mousedown: (e: MouseEvent) => void;
    mousemove: (e: MouseEvent) => void;
    mouseup: (e: MouseEvent) => void;
    wheel: (e: WheelEvent) => void;
    keydown: (e: KeyboardEvent) => void;
    keyup: (e: KeyboardEvent) => void;
    dblclick: (e: MouseEvent) => void;
    contextmenu: (e: Event) => void;
    touchstart: (e: TouchEvent) => void;
    touchmove: (e: TouchEvent) => void;
    touchend: (e: TouchEvent) => void;
    touchcancel: (e: TouchEvent) => void;
  };

  // Callback for when camera changes (to reset accumulation)
  public onCameraChange: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, options: ControllerOptions = {}) {
    this.canvas = canvas;
    this.options = {
      orbitSensitivity: options.orbitSensitivity ?? 0.005,
      panSensitivity: options.panSensitivity ?? 1,
      zoomSensitivity: options.zoomSensitivity ?? 1,
    };

    // Bind handlers
    this.boundHandlers = {
      mousedown: this.onMouseDown.bind(this),
      mousemove: this.onMouseMove.bind(this),
      mouseup: this.onMouseUp.bind(this),
      wheel: this.onWheel.bind(this),
      keydown: this.onKeyDown.bind(this),
      keyup: this.onKeyUp.bind(this),
      dblclick: this.onDoubleClick.bind(this),
      contextmenu: (e) => e.preventDefault(),
      touchstart: this.onTouchStart.bind(this),
      touchmove: this.onTouchMove.bind(this),
      touchend: this.onTouchEnd.bind(this),
      touchcancel: this.onTouchEnd.bind(this),
    };

    this.attach();
  }

  attach(): void {
    this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown);
    this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
    this.canvas.addEventListener('mouseup', this.boundHandlers.mouseup);
    this.canvas.addEventListener('mouseleave', this.boundHandlers.mouseup);
    this.canvas.addEventListener('wheel', this.boundHandlers.wheel, {
      passive: false,
    });
    // Touch events: use non-passive to prevent browser scroll/zoom while interacting
    this.canvas.addEventListener('touchstart', this.boundHandlers.touchstart, {
      passive: false,
    });
    this.canvas.addEventListener('touchmove', this.boundHandlers.touchmove, {
      passive: false,
    });
    this.canvas.addEventListener('touchend', this.boundHandlers.touchend);
    this.canvas.addEventListener('touchcancel', this.boundHandlers.touchcancel);
    this.canvas.addEventListener('dblclick', this.boundHandlers.dblclick);
    this.canvas.addEventListener('contextmenu', this.boundHandlers.contextmenu);
    window.addEventListener('keydown', this.boundHandlers.keydown);
    window.addEventListener('keyup', this.boundHandlers.keyup);
  }

  detach(): void {
    this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown);
    this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
    this.canvas.removeEventListener('mouseup', this.boundHandlers.mouseup);
    this.canvas.removeEventListener('mouseleave', this.boundHandlers.mouseup);
    this.canvas.removeEventListener('wheel', this.boundHandlers.wheel);
    this.canvas.removeEventListener('touchstart', this.boundHandlers.touchstart);
    this.canvas.removeEventListener('touchmove', this.boundHandlers.touchmove);
    this.canvas.removeEventListener('touchend', this.boundHandlers.touchend);
    this.canvas.removeEventListener('touchcancel', this.boundHandlers.touchcancel);
    this.canvas.removeEventListener('dblclick', this.boundHandlers.dblclick);
    this.canvas.removeEventListener(
      'contextmenu',
      this.boundHandlers.contextmenu
    );
    window.removeEventListener('keydown', this.boundHandlers.keydown);
    window.removeEventListener('keyup', this.boundHandlers.keyup);
  }

  private notifyCameraChange(): void {
    if (this.onCameraChange) {
      this.onCameraChange();
    }
  }

  /**
   * Enable or disable camera controls
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.isDragging = false;
      this.dragButton = -1;
      this.canvas.style.cursor = 'default';
    }
  }

  private onMouseDown(e: MouseEvent): void {
    // Don't capture if disabled or clicking on UI elements
    if (!this.enabled || e.target !== this.canvas) return;

    this.isDragging = true;
    this.dragButton = e.button;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    // Update cursor based on action
    if (e.button === 1 || this.isShiftDown) {
      this.canvas.style.cursor = 'move';
    } else if (e.button === 0) {
      this.canvas.style.cursor = 'grabbing';
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.enabled || !this.isDragging) return;

    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    const camera = useCameraStore.getState();

    if (this.dragButton === 1 || (this.dragButton === 0 && this.isShiftDown)) {
      // Middle button or Shift+Left = Pan
      camera.pan(
        deltaX * this.options.panSensitivity,
        deltaY * this.options.panSensitivity
      );
      this.notifyCameraChange();
    } else if (this.dragButton === 0) {
      // Left button = Orbit
      camera.orbit(
        -deltaX * this.options.orbitSensitivity,
        -deltaY * this.options.orbitSensitivity
      );
      this.notifyCameraChange();
    }
  }

  private onMouseUp(_e: MouseEvent): void {
    this.isDragging = false;
    this.dragButton = -1;
    this.canvas.style.cursor = 'default';
  }

  private onTouchStart(e: TouchEvent): void {
    if (!this.enabled || e.target !== this.canvas) return;
    if (e.touches.length === 0) return;

    // Prevent page scroll/zoom while using the viewport
    e.preventDefault();

    this.isTouching = true;

    if (e.touches.length === 1) {
      const t = e.touches[0]!;
      this.lastMouseX = t.clientX;
      this.lastMouseY = t.clientY;
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    if (e.touches.length >= 2) {
      const t0 = e.touches[0]!;
      const t1 = e.touches[1]!;
      const dx = t1.clientX - t0.clientX;
      const dy = t1.clientY - t0.clientY;
      this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
      this.lastTouchMidX = (t0.clientX + t1.clientX) * 0.5;
      this.lastTouchMidY = (t0.clientY + t1.clientY) * 0.5;
      this.canvas.style.cursor = 'move';
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.enabled || !this.isTouching) return;
    if (e.touches.length === 0) return;

    e.preventDefault();

    const camera = useCameraStore.getState();

    if (e.touches.length === 1) {
      const t = e.touches[0]!;
      const deltaX = t.clientX - this.lastMouseX;
      const deltaY = t.clientY - this.lastMouseY;
      this.lastMouseX = t.clientX;
      this.lastMouseY = t.clientY;

      // One-finger orbit
      camera.orbit(
        -deltaX * this.options.orbitSensitivity,
        -deltaY * this.options.orbitSensitivity
      );
      this.notifyCameraChange();
      return;
    }

    // Two-finger: pan + pinch zoom
    const t0 = e.touches[0]!;
    const t1 = e.touches[1]!;
    const dx = t1.clientX - t0.clientX;
    const dy = t1.clientY - t0.clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const midX = (t0.clientX + t1.clientX) * 0.5;
    const midY = (t0.clientY + t1.clientY) * 0.5;

    const deltaDist = dist - this.lastTouchDistance;
    const deltaMidX = midX - this.lastTouchMidX;
    const deltaMidY = midY - this.lastTouchMidY;

    this.lastTouchDistance = dist;
    this.lastTouchMidX = midX;
    this.lastTouchMidY = midY;

    // Pinch out => zoom in (positive delta)
    camera.zoom(deltaDist * 2);
    // Two-finger pan uses midpoint motion
    camera.pan(deltaMidX * this.options.panSensitivity, deltaMidY * this.options.panSensitivity);
    this.notifyCameraChange();
  }

  private onTouchEnd(_e: TouchEvent): void {
    this.isTouching = false;
    this.canvas.style.cursor = 'default';
  }

  private onWheel(e: WheelEvent): void {
    if (!this.enabled) return;
    e.preventDefault();
    const camera = useCameraStore.getState();
    camera.zoom(e.deltaY * this.options.zoomSensitivity);
    this.notifyCameraChange();
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Don't capture if user is typing in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    if (e.key === 'Shift') {
      this.isShiftDown = true;
    }

    if (e.key === 'Home') {
      useCameraStore.getState().reset();
      this.notifyCameraChange();
    }

    if (e.key === 'f' || e.key === 'F') {
      const selectedObject = useSceneStore.getState().getSelectedObject();
      if (selectedObject) {
        useCameraStore.getState().focusOn(selectedObject.transform.position);
        this.notifyCameraChange();
      }
    }

    if (e.key === 'Escape') {
      useSceneStore.getState().selectObject(null);
      this.notifyCameraChange();
    }

    // Gizmo mode switching (WER only)
    const key = e.key.toLowerCase();
    if (key === 'w') {
      useGizmoStore.getState().setMode('translate');
    } else if (key === 'e') {
      useGizmoStore.getState().setMode('rotate');
    } else if (key === 'r') {
      useGizmoStore.getState().setMode('scale');
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (e.key === 'Shift') {
      this.isShiftDown = false;
    }
  }

  private onDoubleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cameraState = useCameraStore.getState();
    const viewMatrix = cameraState.getViewMatrix();
    const projMatrix = mat4Perspective(
      cameraState.fovY,
      rect.width / rect.height,
      0.1,
      1000
    );
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

    const objects = useSceneStore.getState().objects;
    const hit = raycaster.pickWithRay(ray, objects);

    if (hit.objectId) {
      const obj = useSceneStore.getState().getObject(hit.objectId);
      if (obj) {
        useCameraStore.getState().focusOn(obj.transform.position);
        this.notifyCameraChange();
        return;
      }
    }

    // Fallback: focus origin
    useCameraStore.getState().focusOn([0, 0, 0]);
    this.notifyCameraChange();
  }

  destroy(): void {
    this.detach();
  }
}

