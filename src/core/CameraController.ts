import { useCameraStore } from '../store/cameraStore';
import { useSceneStore } from '../store/sceneStore';

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
 * - Double-click: Focus on origin
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

  private boundHandlers: {
    mousedown: (e: MouseEvent) => void;
    mousemove: (e: MouseEvent) => void;
    mouseup: (e: MouseEvent) => void;
    wheel: (e: WheelEvent) => void;
    keydown: (e: KeyboardEvent) => void;
    keyup: (e: KeyboardEvent) => void;
    dblclick: (e: MouseEvent) => void;
    contextmenu: (e: Event) => void;
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
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (e.key === 'Shift') {
      this.isShiftDown = false;
    }
  }

  private onDoubleClick(_e: MouseEvent): void {
    // Focus on origin (TODO: implement raycasting to focus on clicked object)
    useCameraStore.getState().focusOn([0, 0, 0]);
    this.notifyCameraChange();
  }

  destroy(): void {
    this.detach();
  }
}

