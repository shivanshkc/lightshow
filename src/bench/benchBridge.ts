import { useCameraStore } from '../store/cameraStore';
import type { Renderer } from '../renderer/Renderer';
import { median } from './stats';

type BenchResult = {
  version: 1;
  startedAtIso: string;
  userAgent: string;
  ttffMs: number;
  orbitMedianFps: number;
  orbitDurationMs: number;
  orbitFrames: number;
  orbitDeltaAzimuth: number;
};

type BenchApi = {
  registerRenderer: (renderer: Renderer) => void;
  run: (opts: { orbitDurationMs: number }) => Promise<BenchResult>;
};

function isBenchEnabled(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('__bench');
  } catch {
    return false;
  }
}

function isoNow(): string {
  return new Date().toISOString();
}

export function installBenchBridge(): void {
  if (!isBenchEnabled()) return;
  if (window.__LIGHTSHOW_BENCH__) return;

  let renderer: Renderer | null = null;
  let firstFrameMs: number | null = null;
  let firstFramePromise: Promise<number> | null = null;

  function waitForFirstFrame(): Promise<number> {
    if (firstFrameMs !== null) return Promise.resolve(firstFrameMs);
    if (firstFramePromise) return firstFramePromise;

    firstFramePromise = new Promise((resolve) => {
      const tick = () => {
        if (!renderer) {
          requestAnimationFrame(tick);
          return;
        }
        // sampleCount increments each render dispatch; use it to detect "first frame rendered".
        if (renderer.getSampleCount() > 0) {
          firstFrameMs = performance.now();
          resolve(firstFrameMs);
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    return firstFramePromise;
  }

  async function runOrbit(durationMs: number): Promise<{ orbitMedianFps: number; orbitFrames: number; orbitDeltaAzimuth: number }> {
    const fpsSamples: number[] = [];

    let last = performance.now();
    const endAt = last + durationMs;

    const startAzimuth = useCameraStore.getState().azimuth;
    const sweepHalfRangeRad = (30 * Math.PI) / 180;
    const minAzimuth = startAzimuth - sweepHalfRangeRad;
    const maxAzimuth = startAzimuth + sweepHalfRangeRad;
    const orbitStepRad = 0.01; // ~0.6 rad/s at 60fps (~34 deg/s)
    let dir: 1 | -1 = 1;
    let traveledAzimuth = 0;
    let frames = 0;

    const orbitMedianFps = await new Promise<number>((resolve) => {
      const step = () => {
        const now = performance.now();
        const dt = now - last;
        last = now;

        // Drive camera in a back-and-forth sweep over the Cornell box opening.
        // This focuses the benchmark on the "worst-case" viewpoint instead of a full 360 orbit.
        const state = useCameraStore.getState();
        const az = state.azimuth;
        if (az >= maxAzimuth) dir = -1;
        if (az <= minAzimuth) dir = 1;

        const dAz = orbitStepRad * dir;
        traveledAzimuth += Math.abs(dAz);
        state.orbit(dAz, 0.0);
        renderer?.resetAccumulation();
        frames++;

        // Ignore pathological stalls (tab switching / debugger / etc.)
        if (dt > 0 && dt < 250) {
          fpsSamples.push(1000 / dt);
        }

        if (now >= endAt) {
          const m = median(fpsSamples);
          resolve(m ?? 0);
          return;
        }

        requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    });

    // For a ping-pong sweep, start/end can be similar, so use total traveled distance.
    const orbitDeltaAzimuth = traveledAzimuth;

    // If the page is backgrounded/occluded, rAF can throttle badly; this makes orbit appear "stuck".
    // Fail fast so the CDP runner can retry or report a real failure instead of silently producing bad data.
    if (frames < 60 || orbitDeltaAzimuth < 0.5) {
      throw new Error(`Orbit did not run reliably (frames=${frames}, deltaAzimuth=${orbitDeltaAzimuth.toFixed(3)})`);
    }

    return { orbitMedianFps, orbitFrames: frames, orbitDeltaAzimuth };
  }

  const api: BenchApi = {
    registerRenderer: (r) => {
      renderer = r;
      void waitForFirstFrame();
    },
    run: async ({ orbitDurationMs }) => {
      const ttffMs = await waitForFirstFrame();
      const orbit = await runOrbit(orbitDurationMs);
      return {
        version: 1,
        startedAtIso: isoNow(),
        userAgent: navigator.userAgent,
        ttffMs,
        orbitMedianFps: orbit.orbitMedianFps,
        orbitDurationMs,
        orbitFrames: orbit.orbitFrames,
        orbitDeltaAzimuth: orbit.orbitDeltaAzimuth,
      };
    },
  };

  window.__LIGHTSHOW_BENCH__ = api;
}

declare global {
  interface Window {
    __LIGHTSHOW_BENCH__?: BenchApi;
  }
}


