# Stage 12: Scene Operations

## Objective
Implement scene operations: delete, duplicate, undo/redo, and object renaming. These operations make the editor feel complete and professional.

---

## Prerequisites
- Stage 11 completed (properties panel working)
- Scene store functional

---

## Operations Overview

| Operation | Trigger | Description |
|-----------|---------|-------------|
| Delete | Delete key, button | Remove selected object |
| Duplicate | Ctrl+D, button | Copy selected object with offset |
| Undo | Ctrl+Z | Revert last operation |
| Redo | Ctrl+Shift+Z / Ctrl+Y | Re-apply undone operation |
| Rename | Double-click in list | Edit object name |
| Toggle visibility | Eye icon, H key | Show/hide object |

---

## Undo/Redo Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Undo Stack                               │
├─────────────────────────────────────────────────────────────────┤
│ ← Past States                          Future States →          │
│ [State 0] [State 1] [State 2] │ [State 3] [State 4]             │
│                               │                                 │
│                         Current ▲                               │
└─────────────────────────────────────────────────────────────────┘
```

We'll use **zustand middleware** for undo/redo with state snapshots.

---

## Project Structure Changes

```
src/
├── store/
│   ├── sceneStore.ts         # UPDATE: add undo/redo
│   └── historyMiddleware.ts  # NEW: undo/redo middleware
├── components/
│   └── panels/
│       └── ActionSection.tsx # NEW: action buttons
│   └── ObjectList.tsx        # UPDATE: rename functionality
├── hooks/
│   └── useKeyboardShortcuts.ts # NEW: global keyboard handler
```

---

## Implementation

### 12.1 History Middleware (historyMiddleware.ts)

Custom zustand middleware for undo/redo.

```typescript
import { StateCreator, StoreMutatorIdentifier } from 'zustand';

interface HistoryState<T> {
  past: T[];
  future: T[];
  
  // Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveCheckpoint: () => void;
}

const MAX_HISTORY = 50;

type Write<T, U> = Omit<T, keyof U> & U;

type WithHistory<S> = Write<S, HistoryState<S>>;

type HistoryMiddleware = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, Mps, Mcs>,
  options?: { limit?: number }
) => StateCreator<WithHistory<T>, Mps, Mcs>;

export const historyMiddleware: HistoryMiddleware = (initializer, options = {}) => (set, get, store) => {
  const limit = options.limit ?? MAX_HISTORY;
  
  type State = ReturnType<typeof initializer>;
  
  // Get state without history fields
  const getStateSnapshot = (): State => {
    const state = get() as WithHistory<State>;
    const { past, future, undo, redo, canUndo, canRedo, saveCheckpoint, ...rest } = state;
    return rest as State;
  };
  
  const historySet: typeof set = (partial, replace) => {
    // Save current state to past before making changes
    const currentState = getStateSnapshot();
    
    set((state) => ({
      ...state,
      past: [...(state as WithHistory<State>).past.slice(-limit + 1), currentState],
      future: [], // Clear future on new action
      ...(typeof partial === 'function' ? (partial as Function)(state) : partial),
    }), replace as false);
  };
  
  const initialState = initializer(historySet, get, store);
  
  return {
    ...initialState,
    past: [] as State[],
    future: [] as State[],
    
    undo: () => {
      const state = get() as WithHistory<State>;
      if (state.past.length === 0) return;
      
      const previous = state.past[state.past.length - 1];
      const current = getStateSnapshot();
      
      set({
        ...previous,
        past: state.past.slice(0, -1),
        future: [current, ...state.future],
      } as Partial<WithHistory<State>>);
    },
    
    redo: () => {
      const state = get() as WithHistory<State>;
      if (state.future.length === 0) return;
      
      const next = state.future[0];
      const current = getStateSnapshot();
      
      set({
        ...next,
        past: [...state.past, current],
        future: state.future.slice(1),
      } as Partial<WithHistory<State>>);
    },
    
    canUndo: () => (get() as WithHistory<State>).past.length > 0,
    canRedo: () => (get() as WithHistory<State>).future.length > 0,
    
    saveCheckpoint: () => {
      const state = get() as WithHistory<State>;
      const current = getStateSnapshot();
      set({
        past: [...state.past.slice(-limit + 1), current],
      } as Partial<WithHistory<State>>);
    },
  };
};
```

### 12.2 Updated Scene Store with History

```typescript
import { create } from 'zustand';
import { historyMiddleware } from './historyMiddleware';
import { SceneObject, ObjectId } from '../core/types';

interface SceneState {
  objects: SceneObject[];
  selectedObjectId: ObjectId | null;
  
  // CRUD operations
  addSphere: () => ObjectId;
  addCuboid: () => ObjectId;
  removeObject: (id: ObjectId) => void;
  duplicateObject: (id: ObjectId) => ObjectId | null;
  
  // Updates
  updateObject: (id: ObjectId, updates: Partial<SceneObject>) => void;
  updateTransform: (id: ObjectId, transform: Partial<Transform>) => void;
  updateMaterial: (id: ObjectId, material: Partial<Material>) => void;
  renameObject: (id: ObjectId, name: string) => void;
  toggleVisibility: (id: ObjectId) => void;
  
  // Selection
  selectObject: (id: ObjectId | null) => void;
  getSelectedObject: () => SceneObject | null;
  deleteSelected: () => void;
  duplicateSelected: () => ObjectId | null;
  
  // Scene
  clear: () => void;
  getObject: (id: ObjectId) => SceneObject | undefined;
}

export const useSceneStore = create<SceneState>()(
  historyMiddleware(
    (set, get) => ({
      objects: [],
      selectedObjectId: null,
      
      addSphere: () => {
        const id = nanoid();
        // ... implementation
        return id;
      },
      
      addCuboid: () => {
        const id = nanoid();
        // ... implementation
        return id;
      },
      
      removeObject: (id) => {
        set(state => ({
          objects: state.objects.filter(o => o.id !== id),
          selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
        }));
      },
      
      duplicateObject: (id) => {
        const obj = get().getObject(id);
        if (!obj) return null;
        
        const newId = nanoid();
        const duplicate: SceneObject = {
          ...structuredClone(obj),
          id: newId,
          name: `${obj.name} Copy`,
          transform: {
            ...obj.transform,
            position: [
              obj.transform.position[0] + 0.5,
              obj.transform.position[1],
              obj.transform.position[2] + 0.5,
            ],
          },
        };
        
        set(state => ({
          objects: [...state.objects, duplicate],
          selectedObjectId: newId,
        }));
        
        return newId;
      },
      
      renameObject: (id, name) => {
        set(state => ({
          objects: state.objects.map(o =>
            o.id === id ? { ...o, name } : o
          ),
        }));
      },
      
      toggleVisibility: (id) => {
        set(state => ({
          objects: state.objects.map(o =>
            o.id === id ? { ...o, visible: !o.visible } : o
          ),
        }));
      },
      
      deleteSelected: () => {
        const { selectedObjectId, removeObject } = get();
        if (selectedObjectId) {
          removeObject(selectedObjectId);
        }
      },
      
      duplicateSelected: () => {
        const { selectedObjectId, duplicateObject } = get();
        if (selectedObjectId) {
          return duplicateObject(selectedObjectId);
        }
        return null;
      },
      
      // ... other methods
    }),
    { limit: 30 }
  )
);
```

### 12.3 Keyboard Shortcuts Hook

```typescript
import { useEffect } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { useGizmoStore } from '../store/gizmoStore';
import { useCameraStore } from '../store/cameraStore';

export function useKeyboardShortcuts() {
  const sceneStore = useSceneStore();
  const gizmoStore = useGizmoStore();
  const cameraStore = useCameraStore();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Undo: Ctrl/Cmd + Z
      if (cmdKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        sceneStore.undo();
        return;
      }
      
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if (cmdKey && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        sceneStore.redo();
        return;
      }
      
      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        sceneStore.deleteSelected();
        return;
      }
      
      // Duplicate: Ctrl/Cmd + D
      if (cmdKey && e.key === 'd') {
        e.preventDefault();
        sceneStore.duplicateSelected();
        return;
      }
      
      // Gizmo modes
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'g':
          gizmoStore.setMode('translate');
          break;
        case 'e':
          gizmoStore.setMode('rotate');
          break;
        case 'r':
        case 's':
          gizmoStore.setMode('scale');
          break;
      }
      
      // Deselect: Escape
      if (e.key === 'Escape') {
        sceneStore.selectObject(null);
      }
      
      // Focus: F
      if (e.key === 'f' || e.key === 'F') {
        const selected = sceneStore.getSelectedObject();
        if (selected) {
          cameraStore.focusOn(selected.transform.position);
        }
      }
      
      // Reset camera: Home
      if (e.key === 'Home') {
        cameraStore.reset();
      }
      
      // Toggle visibility: H
      if (e.key === 'h' || e.key === 'H') {
        const selectedId = sceneStore.selectedObjectId;
        if (selectedId) {
          sceneStore.toggleVisibility(selectedId);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sceneStore, gizmoStore, cameraStore]);
}

// Use in App.tsx
export function App() {
  useKeyboardShortcuts();
  // ... rest of component
}
```

### 12.4 ActionSection Component

```tsx
import { Copy, Trash2, RotateCcw, RotateCw } from 'lucide-react';
import { useSceneStore } from '../../store/sceneStore';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';

export function ActionSection() {
  const {
    selectedObjectId,
    duplicateSelected,
    deleteSelected,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useSceneStore();
  
  const hasSelection = selectedObjectId !== null;
  
  return (
    <Panel title="Actions">
      <div className="space-y-3">
        {/* Object actions */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            disabled={!hasSelection}
            onClick={() => duplicateSelected()}
          >
            <Copy className="w-4 h-4 mr-1" />
            Duplicate
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-red-400 hover:text-red-300"
            disabled={!hasSelection}
            onClick={() => deleteSelected()}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
        
        {/* Undo/Redo */}
        <div className="flex gap-2 pt-2 border-t border-border-subtle">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            disabled={!canUndo()}
            onClick={() => undo()}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Undo
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            disabled={!canRedo()}
            onClick={() => redo()}
          >
            <RotateCw className="w-4 h-4 mr-1" />
            Redo
          </Button>
        </div>
        
        {/* Keyboard hints */}
        <div className="text-xs text-text-muted space-y-1">
          <div className="flex justify-between">
            <span>Delete</span>
            <kbd className="px-1 bg-elevated rounded">Del</kbd>
          </div>
          <div className="flex justify-between">
            <span>Duplicate</span>
            <kbd className="px-1 bg-elevated rounded">Ctrl+D</kbd>
          </div>
          <div className="flex justify-between">
            <span>Undo</span>
            <kbd className="px-1 bg-elevated rounded">Ctrl+Z</kbd>
          </div>
        </div>
      </div>
    </Panel>
  );
}
```

### 12.5 Object Renaming

Update ObjectList to support inline renaming:

```tsx
import { useState, useRef, useEffect } from 'react';

function ObjectListItem({ object, isSelected, onSelect }: ObjectListItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(object.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { renameObject } = useSceneStore();
  
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);
  
  const handleDoubleClick = () => {
    setIsRenaming(true);
    setEditName(object.name);
  };
  
  const handleRenameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== object.name) {
      renameObject(object.id, trimmed);
    }
    setIsRenaming(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setEditName(object.name);
    }
  };
  
  return (
    <li
      className={`
        flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
        ${isSelected ? 'bg-active' : 'hover:bg-hover'}
      `}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      <Icon className="w-4 h-4 text-text-secondary flex-shrink-0" />
      
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="
            flex-1 bg-elevated px-1 rounded text-sm
            outline-none border border-accent
          "
        />
      ) : (
        <span className="flex-1 text-sm truncate">
          {object.name}
        </span>
      )}
      
      {/* ... visibility and delete buttons */}
    </li>
  );
}
```

---

## Testing Requirements

### Delete Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T12.1 | Delete with key | Select object, press Delete | Object removed |
| T12.2 | Delete with button | Click delete button | Object removed |
| T12.3 | Delete updates render | Delete object | Scene re-renders without object |

### Duplicate Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T12.4 | Duplicate with Ctrl+D | Select, press Ctrl+D | New object appears offset |
| T12.5 | Duplicate preserves props | Duplicate object | Copy has same material/transform |
| T12.6 | Duplicate selects new | After duplicate | New object is selected |

### Undo/Redo Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T12.7 | Undo add | Add sphere, Ctrl+Z | Sphere removed |
| T12.8 | Undo delete | Delete sphere, Ctrl+Z | Sphere restored |
| T12.9 | Undo move | Move object, Ctrl+Z | Object back to original position |
| T12.10 | Redo | Undo, then Ctrl+Y | Action re-applied |
| T12.11 | History limit | Perform 50+ actions | Only last 30 undoable |
| T12.12 | Redo cleared | Undo, then new action | Redo stack cleared |

### Rename Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T12.13 | Start rename | Double-click name | Input appears focused |
| T12.14 | Submit with Enter | Type name, Enter | Name updated |
| T12.15 | Cancel with Escape | Type, Escape | Name unchanged |
| T12.16 | Empty name | Clear name, Enter | Reverts to original |

---

## Acceptance Criteria

- [ ] Delete removes selected object (key + button)
- [ ] Duplicate creates offset copy
- [ ] Undo reverts last operation
- [ ] Redo re-applies undone operation
- [ ] Undo/redo work for all operations
- [ ] History has reasonable limit (30+)
- [ ] Object renaming via double-click
- [ ] H key toggles visibility
- [ ] All keyboard shortcuts work

---

## Definition of Done

Stage 12 is complete when:
1. Delete works via keyboard and button
2. Duplicate creates proper copies
3. Undo/redo stack is functional
4. Object renaming works
5. All shortcuts documented and working

