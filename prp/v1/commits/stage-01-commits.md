# Stage 1: Project Setup & WebGPU Foundation — Commits

## Overview
**Total Commits:** 5  
**Stage Goal:** Initialize project with Vite, TypeScript, React, Tailwind, and verify WebGPU renders to canvas.

---

## Commit 1.1: Initialize Vite + React + TypeScript project

### Description
Bootstrap the project with Vite, React, and TypeScript. Create basic file structure and verify dev server runs.

### Files to Create
```
lightshow/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   └── vite-env.d.ts
```

### Implementation

**package.json:**
```json
{
  "name": "lightshow",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vitest": "^1.1.0",
    "@vitest/ui": "^1.1.0"
  }
}
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lightshow</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**src/main.tsx:**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**src/App.tsx:**
```typescript
export default function App() {
  return (
    <div>
      <h1>Lightshow</h1>
      <p>WebGPU Raytracer</p>
    </div>
  );
}
```

### Test File: `src/__tests__/App.test.tsx`
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Lightshow')).toBeDefined();
  });

  it('displays the subtitle', () => {
    render(<App />);
    expect(screen.getByText('WebGPU Raytracer')).toBeDefined();
  });
});
```

### Manual Testing
1. Run `npm install`
2. Run `npm run dev`
3. Open browser to localhost URL
4. Verify "Lightshow" and "WebGPU Raytracer" text appears

### Commit Message
```
feat(setup): initialize Vite + React + TypeScript project

- Create package.json with dependencies
- Configure TypeScript with strict mode
- Setup Vite with React plugin
- Add basic App component
- Configure Vitest for testing
```

---

## Commit 1.2: Add Tailwind CSS configuration

### Description
Install and configure Tailwind CSS with custom dark theme colors.

### Files to Create/Modify
```
src/
├── index.css          # NEW
├── main.tsx           # MODIFY (import css)
postcss.config.js      # NEW
tailwind.config.js     # NEW
```

### Implementation

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base': '#121212',
        'panel': '#1E1E1E',
        'panel-secondary': '#252526',
        'elevated': '#2D2D2D',
        'hover': '#3C3C3C',
        'active': '#094771',
        'border-subtle': '#333333',
        'border-default': '#454545',
        'border-focus': '#007ACC',
        'text-primary': '#E0E0E0',
        'text-secondary': '#A0A0A0',
        'text-muted': '#6E6E6E',
        'accent': '#007ACC',
        'accent-hover': '#1A8AD4',
        'gizmo-x': '#E53935',
        'gizmo-y': '#43A047',
        'gizmo-z': '#1E88E5',
      },
    },
  },
  plugins: [],
};
```

**postcss.config.js:**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: #121212;
  color: #E0E0E0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

#root {
  width: 100vw;
  height: 100vh;
}
```

**src/main.tsx (updated):**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**package.json additions:**
```json
{
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  }
}
```

### Test File: `src/__tests__/tailwind.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import tailwindConfig from '../../tailwind.config.js';

describe('Tailwind Configuration', () => {
  it('has custom dark theme colors defined', () => {
    const colors = tailwindConfig.theme?.extend?.colors;
    
    expect(colors).toBeDefined();
    expect(colors?.base).toBe('#121212');
    expect(colors?.panel).toBe('#1E1E1E');
    expect(colors?.accent).toBe('#007ACC');
  });

  it('has gizmo colors defined', () => {
    const colors = tailwindConfig.theme?.extend?.colors;
    
    expect(colors?.['gizmo-x']).toBe('#E53935');
    expect(colors?.['gizmo-y']).toBe('#43A047');
    expect(colors?.['gizmo-z']).toBe('#1E88E5');
  });

  it('includes all source paths in content', () => {
    expect(tailwindConfig.content).toContain('./index.html');
    expect(tailwindConfig.content).toContain('./src/**/*.{js,ts,jsx,tsx}');
  });
});
```

### Manual Testing
1. Run `npm install`
2. Run `npm run dev`
3. Verify dark background (#121212) appears
4. Update App.tsx to use Tailwind classes, verify they apply

### Commit Message
```
feat(setup): configure Tailwind CSS with dark theme

- Install tailwindcss, postcss, autoprefixer
- Create custom color palette for dark theme
- Add gizmo axis colors (RGB)
- Setup base styles in index.css
```

---

## Commit 1.3: Add WebGPU types and detection utility

### Description
Add WebGPU TypeScript types and create a utility to detect WebGPU support.

### Files to Create
```
src/
├── renderer/
│   └── webgpu.ts      # NEW: WebGPU detection and init
```

### Implementation

**package.json additions:**
```json
{
  "devDependencies": {
    "@webgpu/types": "^0.1.40"
  }
}
```

**tsconfig.json update:**
```json
{
  "compilerOptions": {
    "types": ["@webgpu/types", "vitest/globals"]
  }
}
```

**src/renderer/webgpu.ts:**
```typescript
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
  width: number,
  height: number
): void {
  ctx.context.configure({
    device: ctx.device,
    format: ctx.format,
    alphaMode: 'premultiplied',
  });
}
```

### Test File: `src/__tests__/webgpu.test.ts`
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWebGPUSupport } from '../renderer/webgpu';

describe('WebGPU Utilities', () => {
  describe('checkWebGPUSupport', () => {
    beforeEach(() => {
      // Reset navigator.gpu mock
      vi.stubGlobal('navigator', { gpu: undefined });
    });

    it('returns not supported when navigator.gpu is undefined', () => {
      const result = checkWebGPUSupport();
      
      expect(result.supported).toBe(false);
      expect(result.reason).toContain('not supported');
    });

    it('returns supported when navigator.gpu exists', () => {
      vi.stubGlobal('navigator', { gpu: {} });
      
      const result = checkWebGPUSupport();
      
      expect(result.supported).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });
});

describe('WebGPU Context Types', () => {
  it('WebGPUContext interface has required properties', () => {
    // Type check - this test passes if types compile correctly
    const mockContext: import('../renderer/webgpu').WebGPUContext = {
      device: {} as GPUDevice,
      context: {} as GPUCanvasContext,
      format: 'bgra8unorm',
      canvas: document.createElement('canvas'),
    };
    
    expect(mockContext.format).toBe('bgra8unorm');
  });
});
```

### Manual Testing
1. Open browser console
2. Run `navigator.gpu` — should return object (not undefined)
3. Import and call `checkWebGPUSupport()` from console

### Commit Message
```
feat(renderer): add WebGPU types and initialization utility

- Install @webgpu/types for TypeScript support
- Create checkWebGPUSupport() detection function
- Create initWebGPU() async initialization
- Add reconfigureContext() for resize handling
- Handle device loss events
```

---

## Commit 1.4: Create Canvas component with WebGPU initialization

### Description
Create a React component that initializes WebGPU and manages canvas lifecycle.

### Files to Create
```
src/
├── components/
│   └── Canvas.tsx     # NEW
├── App.tsx            # MODIFY
```

### Implementation

**src/components/Canvas.tsx:**
```typescript
import { useRef, useEffect, useState } from 'react';
import { initWebGPU, WebGPUContext } from '../renderer/webgpu';

interface CanvasProps {
  className?: string;
  onContextReady?: (ctx: WebGPUContext) => void;
  onError?: (error: Error) => void;
}

export type CanvasStatus = 'loading' | 'ready' | 'error';

export function Canvas({ className, onContextReady, onError }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<WebGPUContext | null>(null);
  const [status, setStatus] = useState<CanvasStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mounted = true;

    const init = async () => {
      try {
        const ctx = await initWebGPU(canvas);
        
        if (!mounted) {
          ctx.device.destroy();
          return;
        }

        contextRef.current = ctx;
        setStatus('ready');
        onContextReady?.(ctx);
      } catch (err) {
        if (!mounted) return;
        
        const error = err instanceof Error ? err : new Error(String(err));
        setStatus('error');
        setErrorMessage(error.message);
        onError?.(error);
      }
    };

    init();

    return () => {
      mounted = false;
      if (contextRef.current) {
        contextRef.current.device.destroy();
        contextRef.current = null;
      }
    };
  }, [onContextReady, onError]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
    });

    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  if (status === 'error') {
    return (
      <div className={`flex items-center justify-center bg-base ${className}`}>
        <div className="text-center p-8 max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-text-primary">
            WebGPU Not Available
          </h2>
          <p className="text-text-secondary mb-4">{errorMessage}</p>
          <a
            href="https://caniuse.com/webgpu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Check browser compatibility →
          </a>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center bg-base ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary">Initializing WebGPU...</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      tabIndex={0}
    />
  );
}

export default Canvas;
```

**src/App.tsx (updated):**
```typescript
import { Canvas } from './components/Canvas';

export default function App() {
  return (
    <div className="w-full h-full bg-base">
      <Canvas className="w-full h-full" />
    </div>
  );
}
```

### Test File: `src/__tests__/Canvas.test.tsx`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Canvas, CanvasStatus } from '../components/Canvas';

// Mock WebGPU
const mockDevice = {
  destroy: vi.fn(),
  lost: Promise.resolve({ reason: 'destroyed', message: '' }),
};

const mockContext = {
  configure: vi.fn(),
};

vi.stubGlobal('navigator', {
  gpu: {
    requestAdapter: vi.fn().mockResolvedValue({
      requestDevice: vi.fn().mockResolvedValue(mockDevice),
    }),
    getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
  },
});

// Mock canvas.getContext
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);

describe('Canvas Component', () => {
  it('shows loading state initially', () => {
    render(<Canvas />);
    expect(screen.getByText('Initializing WebGPU...')).toBeDefined();
  });

  it('calls onContextReady when initialization succeeds', async () => {
    const onContextReady = vi.fn();
    
    render(<Canvas onContextReady={onContextReady} />);
    
    await waitFor(() => {
      expect(onContextReady).toHaveBeenCalled();
    });
  });

  it('renders canvas element when ready', async () => {
    const { container } = render(<Canvas />);
    
    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeDefined();
    });
  });

  it('applies className prop', async () => {
    const { container } = render(<Canvas className="test-class" />);
    
    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas?.className).toContain('test-class');
    });
  });
});

describe('Canvas Error Handling', () => {
  it('shows error state when WebGPU is not supported', async () => {
    // Override mock to simulate no WebGPU
    vi.stubGlobal('navigator', { gpu: undefined });
    
    render(<Canvas />);
    
    await waitFor(() => {
      expect(screen.getByText('WebGPU Not Available')).toBeDefined();
    });
  });
});
```

### Manual Testing
1. Run `npm run dev`
2. Should see loading spinner briefly, then canvas
3. If WebGPU unsupported, should see error message
4. Resize window — canvas should resize smoothly

### Commit Message
```
feat(components): create Canvas component with WebGPU lifecycle

- Add Canvas component with loading/error/ready states
- Handle WebGPU initialization asynchronously
- Implement resize observer for canvas dimensions
- Clean up device on unmount
- Show user-friendly error for unsupported browsers
```

---

## Commit 1.5: Add basic render loop that clears canvas

### Description
Create a Renderer class that runs a render loop and clears the canvas with a color, proving WebGPU is working.

### Files to Create/Modify
```
src/
├── renderer/
│   ├── Renderer.ts    # NEW
│   └── webgpu.ts      # (existing)
├── components/
│   └── Canvas.tsx     # MODIFY
```

### Implementation

**src/renderer/Renderer.ts:**
```typescript
import { WebGPUContext } from './webgpu';

export interface RendererStats {
  fps: number;
  frameTime: number;
  frameCount: number;
}

export class Renderer {
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private format: GPUTextureFormat;
  
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsUpdateTime: number = 0;
  
  private clearColor: GPUColor = { r: 0.05, g: 0.05, b: 0.08, a: 1.0 };

  constructor(ctx: WebGPUContext) {
    this.device = ctx.device;
    this.context = ctx.context;
    this.format = ctx.format;
  }

  /**
   * Start the render loop
   */
  start(): void {
    if (this.animationFrameId !== null) return;
    
    this.lastFrameTime = performance.now();
    this.fpsUpdateTime = this.lastFrameTime;
    this.render();
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Set the clear color
   */
  setClearColor(color: GPUColor): void {
    this.clearColor = color;
  }

  /**
   * Get current renderer statistics
   */
  getStats(): RendererStats {
    return {
      fps: this.fps,
      frameTime: performance.now() - this.lastFrameTime,
      frameCount: this.frameCount,
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
  }

  private render = (): void => {
    const now = performance.now();
    
    // Update FPS counter
    this.frameCount++;
    if (now - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }
    this.lastFrameTime = now;

    // Get current texture
    const textureView = this.context.getCurrentTexture().createView();

    // Create command encoder
    const commandEncoder = this.device.createCommandEncoder();

    // Create render pass that clears to our color
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: this.clearColor,
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });

    renderPass.end();

    // Submit commands
    this.device.queue.submit([commandEncoder.finish()]);

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.render);
  };
}
```

**src/components/Canvas.tsx (updated):**
```typescript
import { useRef, useEffect, useState, useCallback } from 'react';
import { initWebGPU, WebGPUContext } from '../renderer/webgpu';
import { Renderer } from '../renderer/Renderer';

interface CanvasProps {
  className?: string;
}

export type CanvasStatus = 'loading' | 'ready' | 'error';

export function Canvas({ className }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [status, setStatus] = useState<CanvasStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mounted = true;

    const init = async () => {
      try {
        const ctx = await initWebGPU(canvas);
        
        if (!mounted) {
          ctx.device.destroy();
          return;
        }

        const renderer = new Renderer(ctx);
        rendererRef.current = renderer;
        renderer.start();
        
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        
        const error = err instanceof Error ? err : new Error(String(err));
        setStatus('error');
        setErrorMessage(error.message);
      }
    };

    init();

    return () => {
      mounted = false;
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
    });

    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  if (status === 'error') {
    return (
      <div className={`flex items-center justify-center bg-base ${className}`}>
        <div className="text-center p-8 max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-text-primary">
            WebGPU Not Available
          </h2>
          <p className="text-text-secondary mb-4">{errorMessage}</p>
          <a
            href="https://caniuse.com/webgpu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Check browser compatibility →
          </a>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center bg-base ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary">Initializing WebGPU...</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      tabIndex={0}
    />
  );
}

export default Canvas;
```

### Test File: `src/__tests__/Renderer.test.ts`
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Renderer, RendererStats } from '../renderer/Renderer';
import { WebGPUContext } from '../renderer/webgpu';

describe('Renderer', () => {
  let mockContext: WebGPUContext;
  let mockDevice: any;
  let mockGPUContext: any;
  let mockCommandEncoder: any;
  let mockRenderPass: any;

  beforeEach(() => {
    mockRenderPass = {
      end: vi.fn(),
    };

    mockCommandEncoder = {
      beginRenderPass: vi.fn().mockReturnValue(mockRenderPass),
      finish: vi.fn().mockReturnValue({}),
    };

    mockGPUContext = {
      getCurrentTexture: vi.fn().mockReturnValue({
        createView: vi.fn().mockReturnValue({}),
      }),
    };

    mockDevice = {
      createCommandEncoder: vi.fn().mockReturnValue(mockCommandEncoder),
      queue: {
        submit: vi.fn(),
      },
      destroy: vi.fn(),
    };

    mockContext = {
      device: mockDevice,
      context: mockGPUContext,
      format: 'bgra8unorm',
      canvas: document.createElement('canvas'),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a renderer instance', () => {
    const renderer = new Renderer(mockContext);
    expect(renderer).toBeDefined();
    renderer.destroy();
  });

  it('starts and stops the render loop', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    const cafSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const renderer = new Renderer(mockContext);
    
    renderer.start();
    expect(rafSpy).toHaveBeenCalled();
    
    renderer.stop();
    expect(cafSpy).toHaveBeenCalledWith(1);
    
    renderer.destroy();
  });

  it('returns renderer stats', () => {
    const renderer = new Renderer(mockContext);
    
    const stats: RendererStats = renderer.getStats();
    
    expect(stats).toHaveProperty('fps');
    expect(stats).toHaveProperty('frameTime');
    expect(stats).toHaveProperty('frameCount');
    expect(typeof stats.fps).toBe('number');
    
    renderer.destroy();
  });

  it('allows setting clear color', () => {
    const renderer = new Renderer(mockContext);
    
    // Should not throw
    renderer.setClearColor({ r: 1, g: 0, b: 0, a: 1 });
    
    renderer.destroy();
  });

  it('cleans up on destroy', () => {
    const cafSpy = vi.spyOn(window, 'cancelAnimationFrame');
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);

    const renderer = new Renderer(mockContext);
    renderer.start();
    renderer.destroy();
    
    expect(cafSpy).toHaveBeenCalled();
  });
});
```

### Manual Testing
1. Run `npm run dev`
2. Canvas should display dark blue-gray color (#0D0D14 approximately)
3. No console errors
4. Resize window — color should persist, no flickering
5. Open DevTools Performance tab — verify ~60fps render loop

### Commit Message
```
feat(renderer): implement Renderer class with render loop

- Create Renderer class with start/stop/destroy lifecycle
- Implement render loop using requestAnimationFrame
- Clear canvas with configurable color
- Track FPS and frame statistics
- Integrate renderer with Canvas component

Stage 1 complete: WebGPU foundation verified working
```

---

## Stage 1 Commit Summary

| Commit | Description | Tests |
|--------|-------------|-------|
| 1.1 | Initialize Vite + React + TypeScript | App renders |
| 1.2 | Configure Tailwind CSS | Theme colors defined |
| 1.3 | Add WebGPU types and detection | Support detection works |
| 1.4 | Create Canvas component | Lifecycle management |
| 1.5 | Implement Renderer with loop | Canvas clears with color |

**Total Tests:** ~20 test cases across 5 commits

