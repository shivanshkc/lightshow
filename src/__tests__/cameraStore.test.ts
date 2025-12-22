import { describe, it, expect, beforeEach } from 'vitest';
import { useCameraStore } from '../store/cameraStore';

describe('cameraStore', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useCameraStore.getState().reset();
  });

  describe('initial state', () => {
    it('has default position', () => {
      const state = useCameraStore.getState();
      expect(state.position).toBeDefined();
      expect(state.position.length).toBe(3);
    });

    it('has default target at origin', () => {
      const state = useCameraStore.getState();
      expect(state.target).toEqual([0, 0, 0]);
    });

    it('has up vector pointing Y+', () => {
      const state = useCameraStore.getState();
      expect(state.up).toEqual([0, 1, 0]);
    });

    it('has reasonable default distance', () => {
      const state = useCameraStore.getState();
      expect(state.distance).toBeGreaterThan(0);
      expect(state.distance).toBeLessThan(20);
    });

    it('has fovY set', () => {
      const state = useCameraStore.getState();
      expect(state.fovY).toBeGreaterThan(0);
      expect(state.fovY).toBeLessThan(Math.PI);
    });
  });

  describe('orbit', () => {
    it('changes azimuth on horizontal orbit', () => {
      const initialAzimuth = useCameraStore.getState().azimuth;
      
      useCameraStore.getState().orbit(0.1, 0);
      
      expect(useCameraStore.getState().azimuth).toBeCloseTo(initialAzimuth + 0.1);
    });

    it('changes elevation on vertical orbit', () => {
      const initialElevation = useCameraStore.getState().elevation;
      
      useCameraStore.getState().orbit(0, 0.1);
      
      expect(useCameraStore.getState().elevation).toBeCloseTo(initialElevation + 0.1);
    });

    it('clamps elevation to prevent gimbal lock', () => {
      // Try to go past 90 degrees
      useCameraStore.getState().orbit(0, 10);
      
      const elevation = useCameraStore.getState().elevation;
      expect(elevation).toBeLessThan(Math.PI / 2);
    });

    it('clamps elevation at negative limit', () => {
      // Try to go past -90 degrees
      useCameraStore.getState().orbit(0, -10);
      
      const elevation = useCameraStore.getState().elevation;
      expect(elevation).toBeGreaterThan(-Math.PI / 2);
    });

    it('updates position when orbiting', () => {
      const initialPosition = [...useCameraStore.getState().position];
      
      useCameraStore.getState().orbit(0.5, 0.2);
      
      const newPosition = useCameraStore.getState().position;
      expect(newPosition).not.toEqual(initialPosition);
    });
  });

  describe('pan', () => {
    it('changes target position', () => {
      const initialTarget = [...useCameraStore.getState().target];
      
      useCameraStore.getState().pan(100, 50);
      
      const newTarget = useCameraStore.getState().target;
      expect(newTarget).not.toEqual(initialTarget);
    });

    it('updates camera position to maintain distance', () => {
      const initialDistance = useCameraStore.getState().distance;
      
      useCameraStore.getState().pan(100, 100);
      
      // Distance should remain the same after panning
      expect(useCameraStore.getState().distance).toBe(initialDistance);
    });
  });

  describe('zoom', () => {
    it('decreases distance when zooming in (positive delta)', () => {
      const initialDistance = useCameraStore.getState().distance;
      
      useCameraStore.getState().zoom(100);
      
      expect(useCameraStore.getState().distance).toBeLessThan(initialDistance);
    });

    it('increases distance when zooming out (negative delta)', () => {
      const initialDistance = useCameraStore.getState().distance;
      
      useCameraStore.getState().zoom(-100);
      
      expect(useCameraStore.getState().distance).toBeGreaterThan(initialDistance);
    });

    it('clamps minimum distance', () => {
      // Zoom in a lot
      for (let i = 0; i < 100; i++) {
        useCameraStore.getState().zoom(-1000);
      }
      
      expect(useCameraStore.getState().distance).toBeGreaterThanOrEqual(0.5);
    });

    it('clamps maximum distance', () => {
      // Zoom out a lot
      for (let i = 0; i < 100; i++) {
        useCameraStore.getState().zoom(1000);
      }
      
      expect(useCameraStore.getState().distance).toBeLessThanOrEqual(100);
    });
  });

  describe('focusOn', () => {
    it('changes target to specified point', () => {
      const newTarget: [number, number, number] = [5, 3, -2];
      
      useCameraStore.getState().focusOn(newTarget);
      
      expect(useCameraStore.getState().target).toEqual(newTarget);
    });

    it('can optionally change distance', () => {
      const newDistance = 15;
      
      useCameraStore.getState().focusOn([0, 0, 0], newDistance);
      
      expect(useCameraStore.getState().distance).toBe(newDistance);
    });

    it('preserves distance when not specified', () => {
      const initialDistance = useCameraStore.getState().distance;
      
      useCameraStore.getState().focusOn([5, 5, 5]);
      
      expect(useCameraStore.getState().distance).toBe(initialDistance);
    });
  });

  describe('reset', () => {
    it('returns to default state', () => {
      // Make some changes
      useCameraStore.getState().orbit(1, 0.5);
      useCameraStore.getState().pan(100, 100);
      useCameraStore.getState().zoom(500);
      
      // Reset
      useCameraStore.getState().reset();
      
      const state = useCameraStore.getState();
      expect(state.target).toEqual([0, 0, 0]);
      expect(state.distance).toBe(8.5);
    });
  });

  describe('matrix getters', () => {
    it('returns view matrix as Float32Array', () => {
      const viewMatrix = useCameraStore.getState().getViewMatrix();
      
      expect(viewMatrix).toBeInstanceOf(Float32Array);
      expect(viewMatrix.length).toBe(16);
    });

    it('returns inverse view matrix', () => {
      const inverseViewMatrix = useCameraStore.getState().getInverseViewMatrix();
      
      expect(inverseViewMatrix).toBeInstanceOf(Float32Array);
      expect(inverseViewMatrix.length).toBe(16);
    });

    it('returns projection matrix', () => {
      const projMatrix = useCameraStore.getState().getProjectionMatrix(16 / 9);
      
      expect(projMatrix).toBeInstanceOf(Float32Array);
      expect(projMatrix.length).toBe(16);
    });

    it('returns inverse projection matrix', () => {
      const invProjMatrix = useCameraStore.getState().getInverseProjectionMatrix(16 / 9);
      
      expect(invProjMatrix).toBeInstanceOf(Float32Array);
      expect(invProjMatrix.length).toBe(16);
    });
  });
});

