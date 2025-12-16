# Stage 12: Scene Operations — Commits

## Overview
**Total Commits:** 4  
**Stage Goal:** Delete, duplicate, undo/redo, rename functionality.

---

## Commit 12.1: Add undo/redo middleware to store

### Description
Zustand middleware for history tracking with undo/redo.

### Files to Create
```
src/store/historyMiddleware.ts
src/__tests__/historyMiddleware.test.ts
```

### Key Implementation
```typescript
const MAX_HISTORY = 30;

export const historyMiddleware = (config) => (set, get, api) => {
  const initialState = config((args) => {
    const currentState = getStateWithoutHistory(get());
    set({
      ...args,
      past: [...get().past.slice(-MAX_HISTORY + 1), currentState],
      future: [],
    });
  }, get, api);
  
  return {
    ...initialState,
    past: [],
    future: [],
    
    undo: () => {
      const { past, future } = get();
      if (past.length === 0) return;
      const prev = past[past.length - 1];
      const current = getStateWithoutHistory(get());
      set({ ...prev, past: past.slice(0, -1), future: [current, ...future] });
    },
    
    redo: () => {
      const { past, future } = get();
      if (future.length === 0) return;
      const next = future[0];
      const current = getStateWithoutHistory(get());
      set({ ...next, past: [...past, current], future: future.slice(1) });
    },
    
    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
};
```

### Test Cases
```typescript
describe('historyMiddleware', () => {
  const useTestStore = create(historyMiddleware((set) => ({
    count: 0,
    increment: () => set(s => ({ count: s.count + 1 })),
  })));
  
  beforeEach(() => {
    useTestStore.setState({ count: 0, past: [], future: [] });
  });
  
  it('tracks state changes in past', () => {
    useTestStore.getState().increment();
    expect(useTestStore.getState().past.length).toBe(1);
    expect(useTestStore.getState().past[0].count).toBe(0);
  });
  
  it('undo restores previous state', () => {
    useTestStore.getState().increment();
    expect(useTestStore.getState().count).toBe(1);
    useTestStore.getState().undo();
    expect(useTestStore.getState().count).toBe(0);
  });
  
  it('redo re-applies undone change', () => {
    useTestStore.getState().increment();
    useTestStore.getState().undo();
    useTestStore.getState().redo();
    expect(useTestStore.getState().count).toBe(1);
  });
  
  it('new action clears future', () => {
    useTestStore.getState().increment();
    useTestStore.getState().undo();
    useTestStore.getState().increment();
    expect(useTestStore.getState().future.length).toBe(0);
  });
  
  it('limits history size', () => {
    for (let i = 0; i < 50; i++) {
      useTestStore.getState().increment();
    }
    expect(useTestStore.getState().past.length).toBeLessThanOrEqual(30);
  });
});
```

### Commit Message
```
feat(store): add undo/redo history middleware
```

---

## Commit 12.2: Apply history middleware to sceneStore

### Description
Wrap scene store with history for undo/redo support.

### Files to Modify
```
src/store/sceneStore.ts
```

### Key Implementation
```typescript
export const useSceneStore = create<SceneState>()(
  historyMiddleware(
    (set, get) => ({
      objects: [],
      selectedObjectId: null,
      
      // All mutations now tracked in history
      addSphere: () => { /* ... */ },
      removeObject: (id) => { /* ... */ },
      // etc.
      
      // Scene-level operations
      deleteSelected: () => {
        const id = get().selectedObjectId;
        if (id) get().removeObject(id);
      },
      
      duplicateSelected: () => {
        const id = get().selectedObjectId;
        if (id) return get().duplicateObject(id);
        return null;
      },
    }),
    { limit: 30 }
  )
);
```

### Test Cases
```typescript
describe('sceneStore with history', () => {
  beforeEach(() => useSceneStore.getState().clear());
  
  it('can undo addSphere', () => {
    useSceneStore.getState().addSphere();
    expect(useSceneStore.getState().objects.length).toBe(1);
    useSceneStore.getState().undo();
    expect(useSceneStore.getState().objects.length).toBe(0);
  });
  
  it('can undo removeObject', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().removeObject(id);
    expect(useSceneStore.getState().objects.length).toBe(0);
    useSceneStore.getState().undo();
    expect(useSceneStore.getState().objects.length).toBe(1);
  });
  
  it('can undo transform changes', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().updateTransform(id, { position: [5, 0, 0] });
    useSceneStore.getState().undo();
    expect(useSceneStore.getState().getObject(id)?.transform.position[0]).toBe(0);
  });
});
```

### Commit Message
```
feat(store): enable undo/redo for scene operations
```

---

## Commit 12.3: Add keyboard shortcuts for operations

### Description
Delete, Ctrl+D, Ctrl+Z, Ctrl+Y keyboard handling.

### Files to Create
```
src/hooks/useKeyboardShortcuts.ts
src/__tests__/useKeyboardShortcuts.test.ts
```

### Key Implementation
```typescript
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const isMac = navigator.platform.includes('Mac');
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Undo: Ctrl/Cmd + Z
      if (cmdKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useSceneStore.getState().undo();
        return;
      }
      
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if (cmdKey && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        useSceneStore.getState().redo();
        return;
      }
      
      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        useSceneStore.getState().deleteSelected();
        return;
      }
      
      // Duplicate: Ctrl/Cmd + D
      if (cmdKey && e.key === 'd') {
        e.preventDefault();
        useSceneStore.getState().duplicateSelected();
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### Test Cases
```typescript
describe('Keyboard shortcuts', () => {
  beforeEach(() => useSceneStore.getState().clear());
  
  it('Delete removes selected object', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().selectObject(id);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(useSceneStore.getState().objects.length).toBe(0);
  });
  
  it('Ctrl+D duplicates selected', () => {
    const id = useSceneStore.getState().addSphere();
    useSceneStore.getState().selectObject(id);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }));
    expect(useSceneStore.getState().objects.length).toBe(2);
  });
  
  it('Ctrl+Z undoes last action', () => {
    useSceneStore.getState().addSphere();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(useSceneStore.getState().objects.length).toBe(0);
  });
});
```

### Commit Message
```
feat(keyboard): add shortcuts for delete/duplicate/undo/redo
```

---

## Commit 12.4: Add object renaming and action buttons

### Description
Double-click to rename in list, action buttons in UI.

### Files to Modify
```
src/components/panels/ObjectList.tsx
src/components/panels/ActionSection.tsx  # NEW
```

### Key Implementation
```typescript
// ObjectList.tsx - add rename state
function ObjectListItem({ object, isSelected, onSelect }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(object.name);
  const { renameObject } = useSceneStore();
  
  const handleDoubleClick = () => { setIsRenaming(true); setEditName(object.name); };
  const handleRenameSubmit = () => {
    if (editName.trim()) renameObject(object.id, editName.trim());
    setIsRenaming(false);
  };
  
  return (
    <li onDoubleClick={handleDoubleClick}>
      {isRenaming ? (
        <input value={editName} onChange={e => setEditName(e.target.value)}
          onBlur={handleRenameSubmit} onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()} autoFocus />
      ) : (
        <span>{object.name}</span>
      )}
    </li>
  );
}

// ActionSection.tsx
export function ActionSection() {
  const { selectedObjectId, duplicateSelected, deleteSelected, undo, redo, canUndo, canRedo } = useSceneStore();
  
  return (
    <Panel title="Actions">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button disabled={!selectedObjectId} onClick={duplicateSelected}>Duplicate</Button>
          <Button disabled={!selectedObjectId} onClick={deleteSelected}>Delete</Button>
        </div>
        <div className="flex gap-2">
          <Button disabled={!canUndo()} onClick={undo}>Undo</Button>
          <Button disabled={!canRedo()} onClick={redo}>Redo</Button>
        </div>
      </div>
    </Panel>
  );
}
```

### Test Cases
```typescript
describe('Object renaming', () => {
  it('double-click enables edit mode', () => {
    useSceneStore.getState().addSphere();
    render(<ObjectList />);
    fireEvent.doubleClick(screen.getByText(/Sphere/));
    expect(screen.getByRole('textbox')).toBeDefined();
  });
  
  it('enter submits new name', () => {
    const id = useSceneStore.getState().addSphere();
    render(<ObjectList />);
    fireEvent.doubleClick(screen.getByText(/Sphere/));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My Sphere' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(useSceneStore.getState().getObject(id)?.name).toBe('My Sphere');
  });
});

describe('ActionSection', () => {
  it('disables buttons when no selection', () => {
    render(<ActionSection />);
    expect(screen.getByText('Delete').closest('button')).toBeDisabled();
  });
});
```

### Manual Testing
1. Select object, press Delete → removed
2. Select, Ctrl+D → duplicated with offset
3. Ctrl+Z → undoes action
4. Ctrl+Shift+Z → redoes
5. Double-click name → edit mode
6. Type new name, Enter → renamed

### Commit Message
```
feat(ui): add rename, action buttons, complete shortcuts

Stage 12 complete: Scene operations functional
```

---

## Stage 12 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 12.1 | History middleware | Undo/redo tracking |
| 12.2 | Apply to sceneStore | Scene history |
| 12.3 | Keyboard shortcuts | Delete/Ctrl+D/Z/Y |
| 12.4 | Rename + UI buttons | Double-click edit |

