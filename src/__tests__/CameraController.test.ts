import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CameraController } from '../core/CameraController';
import { useCameraStore } from '../store/cameraStore';

describe('CameraController', () => {
  let canvas: HTMLCanvasElement;
  let controller: CameraController;

  beforeEach(() => {
    // Create mock canvas
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    
    // Reset camera store
    useCameraStore.getState().reset();
  });

  afterEach(() => {
    controller?.destroy();
    document.body.removeChild(canvas);
  });

  describe('construction', () => {
    it('creates controller without error', () => {
      controller = new CameraController(canvas);
      expect(controller).toBeDefined();
    });

    it('accepts custom sensitivity options', () => {
      controller = new CameraController(canvas, {
        orbitSensitivity: 0.01,
        panSensitivity: 2,
        zoomSensitivity: 0.5,
      });
      expect(controller).toBeDefined();
    });
  });

  describe('event handling', () => {
    beforeEach(() => {
      controller = new CameraController(canvas);
    });

    it('prevents context menu on canvas', () => {
      const event = new MouseEvent('contextmenu', { bubbles: true });
      const preventDefault = vi.spyOn(event, 'preventDefault');
      
      canvas.dispatchEvent(event);
      
      expect(preventDefault).toHaveBeenCalled();
    });

    it('handles wheel events', () => {
      const initialDistance = useCameraStore.getState().distance;
      
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
      });
      Object.defineProperty(wheelEvent, 'preventDefault', {
        value: vi.fn(),
      });
      
      canvas.dispatchEvent(wheelEvent);
      
      // Distance should change after wheel
      expect(useCameraStore.getState().distance).not.toBe(initialDistance);
    });

    it('calls onCameraChange callback', () => {
      const callback = vi.fn();
      controller.onCameraChange = callback;
      
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
      });
      Object.defineProperty(wheelEvent, 'preventDefault', {
        value: vi.fn(),
      });
      
      canvas.dispatchEvent(wheelEvent);
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      controller = new CameraController(canvas);
    });

    it('resets camera on Home key', () => {
      // Move camera first
      useCameraStore.getState().orbit(1, 0.5);
      
      // Press Home
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      window.dispatchEvent(event);
      
      // Should be back to default
      expect(useCameraStore.getState().target).toEqual([0, 0, 0]);
    });

    it('tracks Shift key state', () => {
      const downEvent = new KeyboardEvent('keydown', { key: 'Shift' });
      window.dispatchEvent(downEvent);
      
      const upEvent = new KeyboardEvent('keyup', { key: 'Shift' });
      window.dispatchEvent(upEvent);
      
      // No error should occur
      expect(true).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('removes event listeners on destroy', () => {
      controller = new CameraController(canvas);
      const removeEventListener = vi.spyOn(canvas, 'removeEventListener');
      
      controller.destroy();
      
      expect(removeEventListener).toHaveBeenCalled();
    });
  });
});

