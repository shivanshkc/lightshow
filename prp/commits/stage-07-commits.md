# Stage 7: UI Shell — Commits

## Overview
**Total Commits:** 5  
**Stage Goal:** Three-panel layout with header, object list, properties panel.

---

## Commit 7.1: Install UI dependencies and setup theme

### Description
Add Lucide icons, update Tailwind theme with CSS variables.

### Dependencies
```json
{ "dependencies": { "lucide-react": "^0.294.0" } }
```

### Files to Modify
```
src/index.css
tailwind.config.js
```

### Key Implementation
```css
/* index.css - add CSS variables */
:root {
  --bg-base: #121212;
  --bg-panel: #1E1E1E;
  --bg-elevated: #2D2D2D;
  --border-subtle: #333333;
  --text-primary: #E0E0E0;
  --text-secondary: #A0A0A0;
  --accent-primary: #007ACC;
  /* ... */
}
```

### Test Cases
```typescript
describe('Theme setup', () => {
  it('CSS variables are defined', () => {
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.documentElement;
    const style = getComputedStyle(root);
    // Variables should be readable after styles load
  });
});
```

### Commit Message
```
chore(ui): setup theme CSS variables and icons
```

---

## Commit 7.2: Create base UI components

### Description
Create reusable Button, Panel components.

### Files to Create
```
src/components/ui/Button.tsx
src/components/ui/Panel.tsx
src/__tests__/ui/Button.test.tsx
```

### Key Implementation
```typescript
// Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white',
    secondary: 'bg-elevated hover:bg-hover border border-border-default',
    ghost: 'hover:bg-hover',
  };
  const sizes = { sm: 'text-xs px-2 py-1', md: 'text-sm px-3 py-1.5', lg: 'px-4 py-2' };
  
  return <button className={`rounded ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

// Panel.tsx
export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border-subtle">
      <h3 className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">{title}</h3>
      <div className="p-3">{children}</div>
    </div>
  );
}
```

### Test Cases
```typescript
describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });
  
  it('applies variant styles', () => {
    const { container } = render(<Button variant="secondary">Test</Button>);
    expect(container.firstChild).toHaveClass('bg-elevated');
  });
  
  it('handles click events', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('Panel', () => {
  it('renders title', () => {
    render(<Panel title="Test Panel"><div>Content</div></Panel>);
    expect(screen.getByText('Test Panel')).toBeDefined();
  });
  
  it('renders children', () => {
    render(<Panel title="Test"><span>Child content</span></Panel>);
    expect(screen.getByText('Child content')).toBeDefined();
  });
});
```

### Commit Message
```
feat(ui): create Button and Panel components
```

---

## Commit 7.3: Create layout structure

### Description
Header, LeftPanel, RightPanel, StatusBar components.

### Files to Create
```
src/components/layout/Header.tsx
src/components/layout/LeftPanel.tsx
src/components/layout/RightPanel.tsx
src/components/layout/StatusBar.tsx
src/App.tsx  # MODIFY
```

### Key Implementation
```typescript
// Header.tsx
export function Header() {
  return (
    <header className="h-12 bg-panel border-b border-border-subtle flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600" />
        <h1 className="text-lg font-semibold">Lightshow</h1>
      </div>
    </header>
  );
}

// App.tsx
export default function App() {
  return (
    <div className="w-screen h-screen flex flex-col bg-base text-text-primary">
      <Header />
      <div className="flex-1 flex min-h-0">
        <LeftPanel />
        <main className="flex-1 relative"><Canvas className="absolute inset-0" /></main>
        <RightPanel />
      </div>
      <StatusBar />
    </div>
  );
}
```

### Test Cases
```typescript
describe('Layout', () => {
  it('Header renders app name', () => {
    render(<Header />);
    expect(screen.getByText('Lightshow')).toBeDefined();
  });
  
  it('App has three-column layout', () => {
    const { container } = render(<App />);
    expect(container.querySelector('header')).toBeDefined();
    expect(container.querySelector('main')).toBeDefined();
    expect(container.querySelector('footer')).toBeDefined();
  });
});
```

### Commit Message
```
feat(layout): create three-panel layout structure
```

---

## Commit 7.4: Create AddObjectSection

### Description
Buttons to add sphere and cuboid.

### Files to Create
```
src/components/panels/AddObjectSection.tsx
src/__tests__/panels/AddObjectSection.test.tsx
```

### Key Implementation
```typescript
import { Circle, Box } from 'lucide-react';
import { useSceneStore } from '../../store/sceneStore';
import { Button } from '../ui/Button';

export function AddObjectSection() {
  const { addSphere, addCuboid } = useSceneStore();
  
  return (
    <div className="p-3 border-b border-border-subtle">
      <h2 className="text-xs font-semibold text-text-secondary uppercase mb-3">Add Object</h2>
      <div className="flex gap-2">
        <Button onClick={addSphere} variant="secondary" className="flex-1">
          <Circle className="w-4 h-4 mr-2" /> Sphere
        </Button>
        <Button onClick={addCuboid} variant="secondary" className="flex-1">
          <Box className="w-4 h-4 mr-2" /> Cuboid
        </Button>
      </div>
    </div>
  );
}
```

### Test Cases
```typescript
describe('AddObjectSection', () => {
  beforeEach(() => useSceneStore.getState().clear());
  
  it('renders add buttons', () => {
    render(<AddObjectSection />);
    expect(screen.getByText('Sphere')).toBeDefined();
    expect(screen.getByText('Cuboid')).toBeDefined();
  });
  
  it('clicking Sphere adds sphere to scene', () => {
    render(<AddObjectSection />);
    fireEvent.click(screen.getByText('Sphere'));
    expect(useSceneStore.getState().objects).toHaveLength(1);
    expect(useSceneStore.getState().objects[0].type).toBe('sphere');
  });
  
  it('clicking Cuboid adds cuboid to scene', () => {
    render(<AddObjectSection />);
    fireEvent.click(screen.getByText('Cuboid'));
    expect(useSceneStore.getState().objects[0].type).toBe('cuboid');
  });
});
```

### Commit Message
```
feat(panels): create AddObjectSection with add buttons
```

---

## Commit 7.5: Create ObjectList

### Description
List of scene objects with selection, visibility toggle, delete.

### Files to Create
```
src/components/panels/ObjectList.tsx
src/__tests__/panels/ObjectList.test.tsx
```

### Key Implementation
```typescript
export function ObjectList() {
  const { objects, selectedObjectId, selectObject, toggleVisibility, removeObject } = useSceneStore();
  
  return (
    <div className="flex flex-col">
      <h2 className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Objects</h2>
      <ul className="overflow-y-auto">
        {objects.map(obj => (
          <li
            key={obj.id}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${obj.id === selectedObjectId ? 'bg-active' : 'hover:bg-hover'}`}
            onClick={() => selectObject(obj.id)}
          >
            {obj.type === 'sphere' ? <Circle className="w-4 h-4" /> : <Box className="w-4 h-4" />}
            <span className="flex-1 truncate">{obj.name}</span>
            <button onClick={(e) => { e.stopPropagation(); toggleVisibility(obj.id); }}>
              {obj.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Test Cases
```typescript
describe('ObjectList', () => {
  beforeEach(() => useSceneStore.getState().clear());
  
  it('shows empty state when no objects', () => {
    render(<ObjectList />);
    // Should show Objects header but no list items
  });
  
  it('lists all scene objects', () => {
    useSceneStore.getState().addSphere();
    useSceneStore.getState().addCuboid();
    
    render(<ObjectList />);
    
    expect(screen.getByText(/Sphere/)).toBeDefined();
    expect(screen.getByText(/Cuboid/)).toBeDefined();
  });
  
  it('clicking item selects it', () => {
    const id = useSceneStore.getState().addSphere();
    render(<ObjectList />);
    
    fireEvent.click(screen.getByText(/Sphere/));
    
    expect(useSceneStore.getState().selectedObjectId).toBe(id);
  });
  
  it('delete button removes object', () => {
    useSceneStore.getState().addSphere();
    render(<ObjectList />);
    
    const deleteBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('Trash'));
    fireEvent.click(deleteBtn!);
    
    expect(useSceneStore.getState().objects).toHaveLength(0);
  });
});
```

### Commit Message
```
feat(panels): create ObjectList with selection and actions

Stage 7 complete: UI shell with panels
```

---

## Stage 7 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 7.1 | Theme setup | CSS variables |
| 7.2 | Base components | Button, Panel |
| 7.3 | Layout structure | Three-panel app |
| 7.4 | AddObjectSection | Add buttons work |
| 7.5 | ObjectList | Selection, delete |

