export const LIMITS = {
  maxObjects: 256,
  maxDpr: 2,
  // Conservative max render dimension to prevent accidental huge allocations on high-DPR displays.
  maxRenderSize: 4096,
} as const;


