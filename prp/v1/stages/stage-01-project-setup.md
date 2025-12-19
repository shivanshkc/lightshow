# Stage 1: Project Setup & WebGPU Foundation

## Objective
Initialize the project with all required tooling and establish a working WebGPU rendering context that displays output to the screen.

---

## Prerequisites
- Node.js 18+ installed
- A WebGPU-compatible browser (Chrome 113+, Edge 113+, Safari 17+)

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 5.x | Build tool & dev server |
| TypeScript | 5.x | Type safety |
| React | 18.x | UI framework |
| Tailwind CSS | 3.x | Styling |
| @webgpu/types | latest | WebGPU TypeScript definitions |

---

## Project Structure

```
lightshow/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root component
│   ├── index.css                # Tailwind imports + base styles
│   ├── renderer/
│   │   ├── WebGPUContext.ts     # WebGPU initialization
│   │   ├── Renderer.ts          # Main render loop
│   │   └── shaders/
│   │       └── test.wgsl        # Simple test shader
│   └── components/
│       └── Canvas.tsx           # WebGPU canvas component
```

---

## Detailed Requirements

### 1.1 Package.json Configuration

```json
{
  "name": "lightshow",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@webgpu/types": "^0.1.40",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 1.2 TypeScript Configuration

The `tsconfig.json` must include WebGPU types:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["@webgpu/types"]
  },
  "include": ["src"]
}
```

### 1.3 Tailwind Configuration

```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'panel': '#1E1E1E',
        'panel-lighter': '#2D2D2D',
        'panel-border': '#3D3D3D',
      }
    }
  },
  plugins: []
}
```

### 1.4 Base CSS

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  margin: 0;
  padding: 0;
  background: #1E1E1E;
  color: #E0E0E0;
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

#root {
  width: 100vw;
  height: 100vh;
}
```

---

## WebGPU Implementation Details

### 1.5 WebGPUContext.ts

This module handles WebGPU initialization with proper error handling.

**Must implement:**

```typescript
interface WebGPUContext {
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  canvas: HTMLCanvasElement;
}

async function initWebGPU(canvas: HTMLCanvasElement): Promise<WebGPUContext>
```

**Initialization steps:**
1. Check if `navigator.gpu` exists
2. Call `navigator.gpu.requestAdapter()` with no options
3. Handle adapter being `null` (WebGPU not supported)
4. Call `adapter.requestDevice()` with no options
5. Get canvas context via `canvas.getContext('webgpu')`
6. Get preferred format via `navigator.gpu.getPreferredCanvasFormat()`
7. Configure context with device and format
8. Return the context object

**Error messages to display:**
- "WebGPU is not supported in this browser"
- "Failed to get WebGPU adapter"
- "Failed to get WebGPU device"

### 1.6 Renderer.ts

Main render loop that clears the screen with a color.

**Must implement:**

```typescript
class Renderer {
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private animationFrameId: number | null = null;

  constructor(webgpuContext: WebGPUContext);
  
  start(): void;           // Begin render loop
  stop(): void;            // Cancel animation frame
  destroy(): void;         // Cleanup resources
  
  private render(): void;  // Single frame render
}
```

**Render loop behavior:**
1. Use `requestAnimationFrame` for the loop
2. Get current texture via `context.getCurrentTexture()`
3. Create a command encoder
4. Begin a render pass with a clear color
5. End the pass and submit commands

**Clear color:** Use a gradient or animated color to prove the loop works:
- Option A: Static dark blue `{ r: 0.05, g: 0.05, b: 0.1, a: 1.0 }`
- Option B: Animated hue based on time (more visually interesting)

### 1.7 Test Shader (test.wgsl)

A minimal shader that fills the screen. Not strictly required for Stage 1 but good to have:

```wgsl
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  // Full-screen triangle
  var pos = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0)
  );
  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
  return vec4f(0.1, 0.1, 0.15, 1.0);
}
```

### 1.8 Canvas.tsx Component

React component that manages the WebGPU canvas.

**Must implement:**
```typescript
interface CanvasProps {
  className?: string;
}

function Canvas({ className }: CanvasProps): JSX.Element
```

**Behavior:**
1. Use `useRef` to get canvas element reference
2. Use `useEffect` to initialize WebGPU when canvas mounts
3. Handle canvas resize via `ResizeObserver`
4. Update canvas `width` and `height` attributes on resize (not just CSS)
5. Reconfigure WebGPU context on resize
6. Cleanup on unmount (stop renderer, destroy resources)

**Resize handling is critical:**
```typescript
// Canvas size must match pixel dimensions
const observer = new ResizeObserver((entries) => {
  const entry = entries[0];
  const width = entry.contentBoxSize[0].inlineSize;
  const height = entry.contentBoxSize[0].blockSize;
  
  canvas.width = Math.max(1, Math.floor(width * devicePixelRatio));
  canvas.height = Math.max(1, Math.floor(height * devicePixelRatio));
  
  // Reconfigure context...
});
```

### 1.9 App.tsx

Root application component.

```typescript
function App(): JSX.Element {
  return (
    <div className="w-full h-full">
      <Canvas className="w-full h-full" />
    </div>
  );
}
```

### 1.10 Error Boundary

Wrap the canvas in an error boundary to catch WebGPU initialization failures gracefully.

Display a user-friendly message if WebGPU is not available:
- Dark panel with centered text
- Message explaining WebGPU requirement
- Link to browser compatibility info

---

## Testing Requirements

### Manual Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| T1.1 | Dev server starts | Run `npm run dev` | Server starts on localhost, no errors |
| T1.2 | Page loads | Open browser to dev server URL | Page loads without console errors |
| T1.3 | Canvas renders | View page | Canvas shows colored background (not white/black) |
| T1.4 | Console clean | Check browser console | No errors or warnings (WebGPU-related) |
| T1.5 | Resize handling | Resize browser window | Canvas resizes smoothly, no stretching/pixelation |
| T1.6 | Full-screen | Make window very large | Canvas fills space, renders correctly |
| T1.7 | Small window | Make window very small (200x200) | Canvas still renders, minimum size handled |
| T1.8 | Unsupported browser | Open in non-WebGPU browser | Friendly error message displayed |

### Automated Tests (Optional for Stage 1)

No unit tests required for Stage 1. Focus on manual verification.

---

## Acceptance Criteria

- [ ] Project initializes with `npm install` without errors
- [ ] `npm run dev` starts the development server
- [ ] Browser displays a colored canvas (proving WebGPU works)
- [ ] Canvas correctly resizes when browser window changes
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No console errors in browser
- [ ] Error message shown if WebGPU is unavailable
- [ ] Code is properly typed (no `any` types except where necessary)

---

## Files to Create

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration with WebGPU types |
| `vite.config.ts` | Vite configuration with React plugin |
| `tailwind.config.js` | Tailwind CSS configuration |
| `postcss.config.js` | PostCSS configuration for Tailwind |
| `index.html` | HTML entry point with root div |
| `src/main.tsx` | React DOM render entry |
| `src/App.tsx` | Root React component |
| `src/index.css` | Tailwind imports and base styles |
| `src/renderer/WebGPUContext.ts` | WebGPU initialization |
| `src/renderer/Renderer.ts` | Render loop |
| `src/components/Canvas.tsx` | Canvas React component |

---

## Common Pitfalls to Avoid

1. **Canvas size mismatch**: Always set `canvas.width` and `canvas.height` attributes, not just CSS dimensions
2. **Device pixel ratio**: Multiply dimensions by `devicePixelRatio` for sharp rendering on high-DPI displays
3. **Context loss**: WebGPU context can be lost; handle `device.lost` promise
4. **Forgetting cleanup**: Always cancel animation frames and destroy resources on unmount
5. **Synchronous initialization**: WebGPU init is async; show loading state while initializing

---

## Definition of Done

Stage 1 is complete when:
1. Running `npm run dev` opens a browser window
2. The window shows a colored background rendered by WebGPU
3. Resizing the window updates the canvas correctly
4. The codebase has clean TypeScript with proper types
5. The project structure matches the specification above

