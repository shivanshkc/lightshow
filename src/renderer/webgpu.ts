/**
 * WebGPU context and initialization utilities
 */

export interface WebGPUContext {
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  canvas: HTMLCanvasElement;
}

export interface WebGPUSupport {
  supported: boolean;
  reason?: string;
}

/**
 * Check if WebGPU is supported in the current browser
 */
export function checkWebGPUSupport(): WebGPUSupport {
  if (!navigator.gpu) {
    return {
      supported: false,
      reason: 'WebGPU is not supported in this browser. Please use Chrome 113+, Edge 113+, or Safari 17+.',
    };
  }
  return { supported: true };
}

/**
 * Initialize WebGPU with a canvas element
 */
export async function initWebGPU(canvas: HTMLCanvasElement): Promise<WebGPUContext> {
  // Check support
  const support = checkWebGPUSupport();
  if (!support.supported) {
    throw new Error(support.reason);
  }

  // Request adapter
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('Failed to get WebGPU adapter. Your GPU may not support WebGPU.');
  }

  // Request device
  const device = await adapter.requestDevice();
  
  // Handle device loss
  device.lost.then((info) => {
    console.error('WebGPU device lost:', info.message);
    if (info.reason !== 'destroyed') {
      // Attempt recovery could go here
    }
  });

  // Get canvas context
  const context = canvas.getContext('webgpu');
  if (!context) {
    throw new Error('Failed to get WebGPU canvas context.');
  }

  // Get preferred format
  const format = navigator.gpu.getPreferredCanvasFormat();

  // Configure context
  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
  });

  return { device, context, format, canvas };
}

/**
 * Reconfigure the WebGPU context (e.g., after resize)
 */
export function reconfigureContext(
  ctx: WebGPUContext,
  _width: number,
  _height: number
): void {
  ctx.context.configure({
    device: ctx.device,
    format: ctx.format,
    alphaMode: 'premultiplied',
  });
}

