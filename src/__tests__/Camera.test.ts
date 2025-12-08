import { describe, it, expect } from 'vitest';
import { Camera } from '../core/Camera';

describe('Camera', () => {
  describe('default values', () => {
    it('has sensible default position', () => {
      const cam = new Camera();
      expect(cam.position[1]).toBeGreaterThan(0); // Above ground
      expect(cam.position[2]).toBeGreaterThan(0); // In front of origin
    });

    it('has default target at origin', () => {
      const cam = new Camera();
      expect(cam.target).toEqual([0, 0, 0]);
    });

    it('has up vector pointing up', () => {
      const cam = new Camera();
      expect(cam.up).toEqual([0, 1, 0]);
    });

    it('has 60 degree FOV', () => {
      const cam = new Camera();
      expect(cam.fovY).toBeCloseTo(Math.PI / 3);
    });
  });

  describe('setters', () => {
    it('sets aspect ratio', () => {
      const cam = new Camera();
      cam.setAspect(16 / 9);
      expect(cam.aspect).toBeCloseTo(16 / 9);
    });

    it('sets position', () => {
      const cam = new Camera();
      cam.setPosition([1, 2, 3]);
      expect(cam.position).toEqual([1, 2, 3]);
    });

    it('sets target', () => {
      const cam = new Camera();
      cam.setTarget([5, 5, 5]);
      expect(cam.target).toEqual([5, 5, 5]);
    });
  });

  describe('matrices', () => {
    it('generates view matrix', () => {
      const cam = new Camera();
      const view = cam.getViewMatrix();
      expect(view.length).toBe(16);
      expect(view).toBeInstanceOf(Float32Array);
    });

    it('generates projection matrix', () => {
      const cam = new Camera();
      const proj = cam.getProjectionMatrix();
      expect(proj.length).toBe(16);
      expect(proj).toBeInstanceOf(Float32Array);
    });

    it('generates inverse view matrix', () => {
      const cam = new Camera();
      const invView = cam.getInverseViewMatrix();
      expect(invView.length).toBe(16);
    });

    it('generates inverse projection matrix', () => {
      const cam = new Camera();
      const invProj = cam.getInverseProjectionMatrix();
      expect(invProj.length).toBe(16);
    });
  });

  describe('uniform data', () => {
    it('produces uniform data of correct size', () => {
      const cam = new Camera();
      const data = cam.getUniformData();
      expect(data.length).toBe(36); // 144 bytes / 4 bytes per float
    });

    it('is a Float32Array', () => {
      const cam = new Camera();
      const data = cam.getUniformData();
      expect(data).toBeInstanceOf(Float32Array);
    });

    it('contains camera position at correct offset', () => {
      const cam = new Camera();
      cam.setPosition([10, 20, 30]);
      const data = cam.getUniformData();
      
      // Position is at offset 32 (after two 4x4 matrices)
      expect(data[32]).toBeCloseTo(10);
      expect(data[33]).toBeCloseTo(20);
      expect(data[34]).toBeCloseTo(30);
    });
  });
});

