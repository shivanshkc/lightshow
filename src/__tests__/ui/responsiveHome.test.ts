import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyResponsiveHomeDistance } from '../../components/layout/responsiveHome';

// NOTE: We keep this test minimal to avoid depending on WebGPU/CameraController.
// It verifies that responsive framing is a no-op when there is no canvas.

describe('responsive home framing (UI-only)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw (no DOM required)', () => {
    expect(() => applyResponsiveHomeDistance(375, 667)).not.toThrow();
  });
});


