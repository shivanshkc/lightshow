# Stage 14: Export & Persistence — Commits

## Overview
**Total Commits:** 4  
**Stage Goal:** Scene save/load, image export, auto-save.

---

## Commit 14.1: Create scene serialization

### Description
JSON serialization with validation for scene data.

### Files to Create
```
src/io/sceneSerializer.ts
src/__tests__/io/sceneSerializer.test.ts
```

### Key Implementation
```typescript
const SCHEMA_VERSION = 1;

interface SerializedScene {
  version: number;
  name: string;
  createdAt: string;
  modifiedAt: string;
  objects: SceneObject[];
  camera?: { position: Vec3; target: Vec3; fovY: number };
}

export function serializeScene(objects: SceneObject[], name: string = 'Untitled', camera?: any): string {
  const scene: SerializedScene = {
    version: SCHEMA_VERSION,
    name,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    objects: objects.map(obj => ({ ...obj })),
    camera: camera ? { position: camera.position, target: camera.target, fovY: camera.fovY } : undefined,
  };
  return JSON.stringify(scene, null, 2);
}

export function deserializeScene(json: string): { objects: SceneObject[]; name: string; camera?: any } {
  const scene: SerializedScene = JSON.parse(json);
  if (scene.version !== SCHEMA_VERSION) {
    console.warn(`Scene version ${scene.version} differs from current ${SCHEMA_VERSION}`);
  }
  return { objects: scene.objects.map(validateSceneObject), name: scene.name, camera: scene.camera };
}

function validateSceneObject(obj: any): SceneObject {
  return {
    id: obj.id || nanoid(),
    name: obj.name || 'Object',
    type: ['sphere', 'cuboid'].includes(obj.type) ? obj.type : 'sphere',
    visible: obj.visible !== false,
    transform: {
      position: validateVec3(obj.transform?.position, [0,0,0]),
      rotation: validateVec3(obj.transform?.rotation, [0,0,0]),
      scale: validateVec3(obj.transform?.scale, [1,1,1]),
    },
    material: validateMaterial(obj.material || {}),
  };
}
```

### Test Cases
```typescript
describe('sceneSerializer', () => {
  it('serializes and deserializes scene', () => {
    const objects: SceneObject[] = [{ id: '1', name: 'Test', type: 'sphere', visible: true,
      transform: { position: [1,2,3], rotation: [0,0,0], scale: [1,1,1] },
      material: createDefaultMaterial() }];
    
    const json = serializeScene(objects, 'My Scene');
    const result = deserializeScene(json);
    
    expect(result.name).toBe('My Scene');
    expect(result.objects[0].transform.position).toEqual([1,2,3]);
  });
  
  it('handles missing fields gracefully', () => {
    const json = JSON.stringify({ version: 1, objects: [{ id: '1' }] });
    const result = deserializeScene(json);
    
    expect(result.objects[0].type).toBe('sphere'); // Default
    expect(result.objects[0].name).toBe('Object'); // Default
  });
  
  it('validates material values', () => {
    const json = JSON.stringify({ version: 1, objects: [{ id: '1', material: { roughness: 999 } }] });
    const result = deserializeScene(json);
    
    expect(result.objects[0].material.roughness).toBe(1); // Clamped
  });
});
```

### Commit Message
```
feat(io): create scene serialization with validation
```

---

## Commit 14.2: Add file save/load functionality

### Description
Download JSON, open file dialog, import scene.

### Files to Create
```
src/io/fileOps.ts
src/components/layout/FileMenu.tsx
```

### Key Implementation
```typescript
// fileOps.ts
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
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] || null);
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

// FileMenu.tsx
export function FileMenu() {
  const handleSave = () => {
    const json = serializeScene(useSceneStore.getState().objects, 'scene', useCameraStore.getState());
    downloadJson(json, 'scene.json');
  };
  
  const handleOpen = async () => {
    const file = await openFileDialog('.json');
    if (!file) return;
    try {
      const content = await readFileAsText(file);
      const { objects, camera } = deserializeScene(content);
      useSceneStore.getState().clear();
      objects.forEach(obj => useSceneStore.getState().addObjectDirect(obj));
      if (camera) { /* restore camera */ }
    } catch (err) {
      alert('Failed to load scene file');
    }
  };
  
  return (
    <div className="relative">
      <button>File</button>
      <div className="dropdown">
        <MenuItem icon={FolderOpen} label="Open..." shortcut="Ctrl+O" onClick={handleOpen} />
        <MenuItem icon={Save} label="Save Scene" shortcut="Ctrl+S" onClick={handleSave} />
      </div>
    </div>
  );
}
```

### Test Cases
```typescript
describe('File operations', () => {
  it('downloadJson creates download link', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    
    downloadJson('{}', 'test');
    
    expect(createObjectURL).toHaveBeenCalled();
  });
  
  it('readFileAsText reads file content', async () => {
    const file = new File(['{"test": true}'], 'test.json', { type: 'application/json' });
    const content = await readFileAsText(file);
    expect(content).toBe('{"test": true}');
  });
});
```

### Commit Message
```
feat(io): add file save/load functionality
```

---

## Commit 14.3: Add image export

### Description
Export current viewport as PNG.

### Files to Create
```
src/io/imageExport.ts
```

### Key Implementation
```typescript
export function exportCurrentView(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
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

// Add to FileMenu
const handleExportImage = () => {
  const canvas = document.querySelector('canvas');
  if (canvas) exportCurrentView(canvas, `render-${Date.now()}.png`);
};
```

### Test Cases
```typescript
describe('Image export', () => {
  it('creates PNG blob from canvas', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);
    
    // Verify toBlob works
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    expect(blob).not.toBeNull();
    expect(blob!.type).toBe('image/png');
  });
});
```

### Commit Message
```
feat(io): add image export functionality
```

---

## Commit 14.4: Add auto-save and recovery

### Description
Periodic localStorage save, recovery dialog on load.

### Files to Create
```
src/io/autoSave.ts
src/components/AutoSaveRecovery.tsx
```

### Key Implementation
```typescript
// autoSave.ts
const AUTOSAVE_KEY = 'lightshow_autosave';
const AUTOSAVE_INTERVAL = 30000;

export function enableAutoSave(getScene: () => string): () => void {
  const save = () => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ timestamp: Date.now(), scene: getScene() }));
    } catch (e) { console.warn('Auto-save failed:', e); }
  };
  
  save();
  const interval = setInterval(save, AUTOSAVE_INTERVAL);
  window.addEventListener('beforeunload', save);
  
  return () => { clearInterval(interval); window.removeEventListener('beforeunload', save); };
}

export function loadAutoSave(): { scene: string; timestamp: number } | null {
  try {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function clearAutoSave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
}

// AutoSaveRecovery.tsx
export function AutoSaveRecoveryDialog() {
  const [autoSave, setAutoSave] = useState<{ scene: string; timestamp: number } | null>(null);
  
  useEffect(() => { setAutoSave(loadAutoSave()); }, []);
  
  if (!autoSave) return null;
  
  const handleRecover = () => {
    const { objects } = deserializeScene(autoSave.scene);
    useSceneStore.getState().clear();
    objects.forEach(obj => useSceneStore.getState().addObjectDirect(obj));
    setAutoSave(null);
  };
  
  const handleDiscard = () => { clearAutoSave(); setAutoSave(null); };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-panel rounded-lg p-6 max-w-md">
        <h2 className="text-lg font-semibold mb-2">Recover Auto-saved Work?</h2>
        <p className="text-text-secondary mb-4">Found auto-save from {formatTimeAgo(autoSave.timestamp)}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={handleDiscard}>Discard</button>
          <button onClick={handleRecover} className="bg-accent">Recover</button>
        </div>
      </div>
    </div>
  );
}
```

### Test Cases
```typescript
describe('Auto-save', () => {
  beforeEach(() => localStorage.clear());
  
  it('saves to localStorage', () => {
    const getScene = () => '{"test": true}';
    const cleanup = enableAutoSave(getScene);
    expect(localStorage.getItem('lightshow_autosave')).not.toBeNull();
    cleanup();
  });
  
  it('loadAutoSave returns saved data', () => {
    localStorage.setItem('lightshow_autosave', JSON.stringify({ timestamp: 123, scene: '{}' }));
    const result = loadAutoSave();
    expect(result?.timestamp).toBe(123);
  });
  
  it('clearAutoSave removes data', () => {
    localStorage.setItem('lightshow_autosave', 'test');
    clearAutoSave();
    expect(localStorage.getItem('lightshow_autosave')).toBeNull();
  });
});
```

### Manual Testing
1. Create scene, wait 30s → "Auto-saved" in console
2. Refresh page → recovery dialog appears
3. Click "Recover" → scene restored
4. File > Save → JSON downloaded
5. File > Open → load saved JSON
6. File > Export Image → PNG downloaded

### Commit Message
```
feat(io): add auto-save with recovery dialog

Stage 14 complete: Export and persistence functional

🎉 Lightshow v1.0 complete!
```

---

## Stage 14 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 14.1 | Scene serialization | Roundtrip, validation |
| 14.2 | File save/load | Download, open dialog |
| 14.3 | Image export | PNG from canvas |
| 14.4 | Auto-save | LocalStorage, recovery |

---

## Project Complete Summary

**Total Stages:** 14  
**Total Commits:** 60  
**Estimated Dev Time:** 6-8 weeks

All features implemented and tested:
- ✅ WebGPU raytracing engine
- ✅ Sphere and cuboid primitives
- ✅ Full PBR material system
- ✅ Global illumination with shadows
- ✅ Orbit camera controls
- ✅ Transform gizmos (translate/rotate/scale)
- ✅ Properties panel with two-way binding
- ✅ Undo/redo system
- ✅ Scene save/load (JSON)
- ✅ Image export (PNG)
- ✅ Auto-save recovery

