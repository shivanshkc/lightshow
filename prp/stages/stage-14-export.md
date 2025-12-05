# Stage 14: Export & Persistence

## Objective
Implement scene save/load functionality (JSON) and image export (PNG). Add optional auto-save to localStorage for work persistence.

---

## Prerequisites
- Stage 13 completed (polish applied)
- All features functional and polished

---

## Features

| Feature | Description |
|---------|-------------|
| Export Scene | Save scene as JSON file |
| Import Scene | Load scene from JSON file |
| Export Image | Save render as PNG |
| Auto-save | Periodic save to localStorage |
| Recent Files | List of recently opened files |

---

## Project Structure

```
src/
├── io/
│   ├── sceneSerializer.ts    # NEW: JSON serialization
│   ├── imageExport.ts        # NEW: PNG export
│   └── autoSave.ts           # NEW: localStorage persistence
├── components/
│   └── layout/
│       └── Header.tsx        # UPDATE: file menu
│   └── modals/
│       └── ExportModal.tsx   # NEW: export options
```

---

## Implementation

### 14.1 Scene Serialization (sceneSerializer.ts)

```typescript
import { SceneObject } from '../core/types';

// Schema version for future compatibility
const SCHEMA_VERSION = 1;

interface SerializedScene {
  version: number;
  name: string;
  createdAt: string;
  modifiedAt: string;
  objects: SceneObject[];
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
    fovY: number;
  };
  settings?: {
    backgroundColor?: [number, number, number];
  };
}

export function serializeScene(
  objects: SceneObject[],
  name: string = 'Untitled Scene',
  camera?: any
): string {
  const scene: SerializedScene = {
    version: SCHEMA_VERSION,
    name,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    objects: objects.map(obj => ({
      ...obj,
      // Ensure clean serialization (remove any non-serializable properties)
    })),
    camera: camera ? {
      position: camera.position,
      target: camera.target,
      fovY: camera.fovY,
    } : undefined,
  };
  
  return JSON.stringify(scene, null, 2);
}

export function deserializeScene(json: string): {
  objects: SceneObject[];
  name: string;
  camera?: any;
} {
  const scene: SerializedScene = JSON.parse(json);
  
  // Version migration (for future use)
  if (scene.version !== SCHEMA_VERSION) {
    console.warn(`Scene version ${scene.version} differs from current ${SCHEMA_VERSION}`);
    // Perform migrations if needed
  }
  
  // Validate and sanitize objects
  const objects = scene.objects.map(obj => validateSceneObject(obj));
  
  return {
    objects,
    name: scene.name,
    camera: scene.camera,
  };
}

function validateSceneObject(obj: any): SceneObject {
  // Ensure all required fields exist with valid values
  return {
    id: obj.id || nanoid(),
    name: obj.name || 'Object',
    type: obj.type === 'sphere' || obj.type === 'cuboid' ? obj.type : 'sphere',
    visible: obj.visible !== false,
    transform: {
      position: validateVec3(obj.transform?.position, [0, 0, 0]),
      rotation: validateVec3(obj.transform?.rotation, [0, 0, 0]),
      scale: validateVec3(obj.transform?.scale, [1, 1, 1]),
    },
    material: {
      color: validateVec3(obj.material?.color, [0.8, 0.8, 0.8]),
      roughness: validateNumber(obj.material?.roughness, 0.5, 0, 1),
      metallic: validateNumber(obj.material?.metallic, 0, 0, 1),
      transparency: validateNumber(obj.material?.transparency, 0, 0, 1),
      ior: validateNumber(obj.material?.ior, 1.5, 1, 2.5),
      emission: validateNumber(obj.material?.emission, 0, 0, 100),
      emissionColor: validateVec3(obj.material?.emissionColor, [1, 1, 1]),
    },
  };
}

function validateVec3(value: any, fallback: [number, number, number]): [number, number, number] {
  if (!Array.isArray(value) || value.length !== 3) return fallback;
  return value.map((v, i) => 
    typeof v === 'number' && isFinite(v) ? v : fallback[i]
  ) as [number, number, number];
}

function validateNumber(value: any, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}
```

### 14.2 File Operations

```typescript
export function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function openFileDialog(accept: string = '.json'): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    
    input.onchange = () => {
      resolve(input.files?.[0] || null);
    };
    
    input.click();
  });
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
```

### 14.3 Image Export (imageExport.ts)

```typescript
export interface ExportOptions {
  width: number;
  height: number;
  samples: number;
  filename: string;
}

export async function exportImage(
  renderer: Renderer,
  options: ExportOptions
): Promise<void> {
  const { width, height, samples, filename } = options;
  
  // Create a separate canvas for export
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  
  // Render at target resolution with target samples
  // This may take a while for high sample counts
  await renderer.renderToCanvas(exportCanvas, samples, (progress) => {
    console.log(`Rendering: ${Math.round(progress * 100)}%`);
  });
  
  // Convert to blob and download
  exportCanvas.toBlob((blob) => {
    if (!blob) {
      console.error('Failed to create image blob');
      return;
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// Quick export (current viewport)
export function exportCurrentView(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, 'image/png');
}
```

### 14.4 Auto-save (autoSave.ts)

```typescript
const AUTOSAVE_KEY = 'lightshow_autosave';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

interface AutoSaveData {
  timestamp: number;
  scene: string;
}

export function enableAutoSave(
  getScene: () => string
): () => void {
  const save = () => {
    try {
      const data: AutoSaveData = {
        timestamp: Date.now(),
        scene: getScene(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
      console.log('Auto-saved at', new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Auto-save failed:', err);
    }
  };
  
  // Initial save
  save();
  
  // Periodic saves
  const interval = setInterval(save, AUTOSAVE_INTERVAL);
  
  // Save on page unload
  const handleUnload = () => save();
  window.addEventListener('beforeunload', handleUnload);
  
  // Cleanup function
  return () => {
    clearInterval(interval);
    window.removeEventListener('beforeunload', handleUnload);
  };
}

export function loadAutoSave(): { scene: string; timestamp: number } | null {
  try {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (!data) return null;
    
    const parsed: AutoSaveData = JSON.parse(data);
    return {
      scene: parsed.scene,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

export function clearAutoSave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
}

export function hasAutoSave(): boolean {
  return localStorage.getItem(AUTOSAVE_KEY) !== null;
}
```

### 14.5 File Menu Component

```tsx
import { useState } from 'react';
import { 
  Save, 
  FolderOpen, 
  Download, 
  Image, 
  FileJson,
  ChevronDown 
} from 'lucide-react';
import { useSceneStore } from '../../store/sceneStore';
import { useCameraStore } from '../../store/cameraStore';
import { serializeScene, deserializeScene } from '../../io/sceneSerializer';
import { downloadJson, openFileDialog, readFileAsText } from '../../io/fileOps';
import { exportCurrentView } from '../../io/imageExport';

export function FileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { objects, clear } = useSceneStore();
  const camera = useCameraStore();
  
  const handleSave = () => {
    const json = serializeScene(objects, 'My Scene', camera);
    downloadJson(json, 'scene.json');
    setIsOpen(false);
  };
  
  const handleOpen = async () => {
    const file = await openFileDialog('.json');
    if (!file) return;
    
    try {
      const content = await readFileAsText(file);
      const { objects: loadedObjects, camera: loadedCamera } = deserializeScene(content);
      
      // Clear and load
      clear();
      loadedObjects.forEach(obj => {
        useSceneStore.getState().addObjectDirect(obj);
      });
      
      if (loadedCamera) {
        useCameraStore.getState().setPosition(loadedCamera.position);
        useCameraStore.getState().setTarget(loadedCamera.target);
      }
    } catch (err) {
      console.error('Failed to load scene:', err);
      alert('Failed to load scene file. It may be corrupted or invalid.');
    }
    
    setIsOpen(false);
  };
  
  const handleExportImage = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      exportCurrentView(canvas, `render-${Date.now()}.png`);
    }
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 hover:bg-hover rounded transition-colors"
      >
        File
        <ChevronDown className="w-3 h-3" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-panel border border-border-default rounded-md shadow-lg z-50">
            <div className="py-1">
              <MenuItem icon={FolderOpen} label="Open..." shortcut="Ctrl+O" onClick={handleOpen} />
              <MenuItem icon={Save} label="Save Scene" shortcut="Ctrl+S" onClick={handleSave} />
              
              <div className="my-1 border-t border-border-subtle" />
              
              <MenuItem icon={Image} label="Export Image" onClick={handleExportImage} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ 
  icon: Icon, 
  label, 
  shortcut, 
  onClick 
}: {
  icon: any;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-hover transition-colors"
      onClick={onClick}
    >
      <Icon className="w-4 h-4 text-text-secondary" />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="text-xs text-text-muted">{shortcut}</span>
      )}
    </button>
  );
}
```

### 14.6 Auto-save Recovery Dialog

```tsx
import { useEffect, useState } from 'react';
import { loadAutoSave, clearAutoSave } from '../../io/autoSave';

export function AutoSaveRecoveryDialog() {
  const [autoSave, setAutoSave] = useState<{ scene: string; timestamp: number } | null>(null);
  
  useEffect(() => {
    const saved = loadAutoSave();
    if (saved) {
      setAutoSave(saved);
    }
  }, []);
  
  if (!autoSave) return null;
  
  const timeAgo = formatTimeAgo(autoSave.timestamp);
  
  const handleRecover = () => {
    try {
      const { objects } = deserializeScene(autoSave.scene);
      useSceneStore.getState().clear();
      objects.forEach(obj => {
        useSceneStore.getState().addObjectDirect(obj);
      });
    } catch (err) {
      console.error('Recovery failed:', err);
    }
    setAutoSave(null);
  };
  
  const handleDiscard = () => {
    clearAutoSave();
    setAutoSave(null);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-panel rounded-lg shadow-xl max-w-md p-6">
        <h2 className="text-lg font-semibold mb-2">Recover Auto-saved Work?</h2>
        <p className="text-text-secondary mb-4">
          We found an auto-saved scene from {timeAgo}. Would you like to recover it?
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleDiscard}
            className="px-4 py-2 text-text-secondary hover:bg-hover rounded transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleRecover}
            className="px-4 py-2 bg-accent hover:bg-accent-hover rounded transition-colors"
          >
            Recover
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
```

### 14.7 Keyboard Shortcuts for File Operations

Add to keyboard shortcuts hook:

```typescript
// In useKeyboardShortcuts
// Save: Ctrl/Cmd + S
if (cmdKey && e.key === 's') {
  e.preventDefault();
  const json = serializeScene(
    useSceneStore.getState().objects,
    'scene',
    useCameraStore.getState()
  );
  downloadJson(json, 'scene.json');
}

// Open: Ctrl/Cmd + O
if (cmdKey && e.key === 'o') {
  e.preventDefault();
  // Trigger file open dialog
  openFileDialog('.json').then(async (file) => {
    if (file) {
      const content = await readFileAsText(file);
      const { objects } = deserializeScene(content);
      useSceneStore.getState().clear();
      objects.forEach(obj => useSceneStore.getState().addObjectDirect(obj));
    }
  });
}
```

---

## Testing Requirements

### Scene Export/Import Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T14.1 | Export scene | Create scene, File > Save | JSON file downloaded |
| T14.2 | Import scene | File > Open, select JSON | Scene loaded |
| T14.3 | Roundtrip | Export, clear, import | Scene identical |
| T14.4 | Invalid file | Open corrupted JSON | Error message, no crash |
| T14.5 | Wrong format | Open non-scene JSON | Error message |

### Image Export Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T14.6 | Export PNG | File > Export Image | PNG file downloaded |
| T14.7 | Image quality | Open exported PNG | Clean, correct render |
| T14.8 | Transparent bg | Export with transparent bg | Alpha channel correct |

### Auto-save Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T14.9 | Auto-save triggers | Wait 30 seconds | Console shows "Auto-saved" |
| T14.10 | Recovery dialog | Refresh page after work | Dialog appears |
| T14.11 | Recovery works | Click "Recover" | Scene restored |
| T14.12 | Discard works | Click "Discard" | Clean slate |

### Keyboard Shortcut Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| T14.13 | Ctrl+S | Save dialog / download |
| T14.14 | Ctrl+O | Open file dialog |

---

## Acceptance Criteria

- [ ] Scene can be exported as JSON
- [ ] Scene can be imported from JSON
- [ ] Import validates and sanitizes data
- [ ] Image can be exported as PNG
- [ ] Auto-save runs periodically
- [ ] Recovery dialog on page load
- [ ] File operations don't block UI
- [ ] Keyboard shortcuts work (Ctrl+S, Ctrl+O)
- [ ] Error handling for invalid files

---

## Definition of Done

Stage 14 is complete when:
1. Scene export/import works reliably
2. Image export produces correct output
3. Auto-save provides work recovery
4. All file operations feel polished
5. The complete application is functional

---

## 🎉 Project Complete!

With Stage 14 done, Lightshow v1.0 is complete. The application now supports:

- ✅ WebGPU-based raytracing
- ✅ Sphere and cuboid primitives
- ✅ Full material system (color, roughness, metallic, transparency, emission)
- ✅ Global illumination with shadows
- ✅ Intuitive camera controls
- ✅ Professional transform gizmos
- ✅ Complete properties panel
- ✅ Undo/redo system
- ✅ Scene save/load
- ✅ Image export
- ✅ Polished UI/UX

