import { describe, it, expect } from 'vitest';
import { Camera } from '../core/Camera';

describe('Camera', () => {
  it('has sensible defaults', () => {
    const cam = new Camera();
    expect(cam.position[1]).toBeGreaterThan(0); // Above ground
    expect(cam.fovY).toBeCloseTo(Math.PI / 3); // 60 degrees
  });

  it('generates view matrix', () => {
    const cam = new Camera();
    const view = cam.getViewMatrix();
    expect(view.length).toBe(16);
  });

  it('generates projection matrix', () => {
    const cam = new Camera();
    const proj = cam.getProjectionMatrix();
    expect(proj.length).toBe(16);
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

  it('updates aspect ratio', () => {
    const cam = new Camera();
    cam.setAspect(16 / 9);
    expect(cam.aspect).toBeCloseTo(16 / 9);
  });

  it('updates position', () => {
    const cam = new Camera();
    cam.setPosition([10, 20, 30]);
    expect(cam.getPosition()).toEqual([10, 20, 30]);
  });

  it('updates target', () => {
    const cam = new Camera();
    cam.setTarget([1, 2, 3]);
    expect(cam.getTarget()).toEqual([1, 2, 3]);
  });

  it('produces uniform data of correct size', () => {
    const cam = new Camera();
    const data = cam.getUniformData();
    expect(data.length).toBe(36); // 144 bytes / 4
  });

  it('uniform data contains camera position', () => {
    const cam = new Camera();
    cam.setPosition([5, 10, 15]);
    const data = cam.getUniformData();
    // Position is at indices 32-34
    expect(data[32]).toBe(5);
    expect(data[33]).toBe(10);
    expect(data[34]).toBe(15);
  });

  it('accepts initial state in constructor', () => {
    const cam = new Camera({
      position: [1, 2, 3],
      fovY: Math.PI / 4,
    });
    expect(cam.position).toEqual([1, 2, 3]);
    expect(cam.fovY).toBeCloseTo(Math.PI / 4);
  });
});

