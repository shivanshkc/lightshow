# Stage 7: UI Shell

## Objective
Build the complete UI layout with header, left panel (object hierarchy), center viewport, and right panel (properties). The UI should be dark-themed, clean, and professional.

---

## Prerequisites
- Stage 6 completed (camera controls working)
- Tailwind CSS configured

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header (48px)                                                      │
│  [Logo] Lightshow                              [Settings] [Help]    │
├────────────────┬────────────────────────────────┬───────────────────┤
│ Left Panel     │                                │ Right Panel       │
│ (240px)        │                                │ (280px)           │
│                │                                │                   │
│ ┌────────────┐ │        3D Viewport             │ ┌───────────────┐ │
│ │ Add Object │ │                                │ │ Transform     │ │
│ │ + Sphere   │ │                                │ │ Position      │ │
│ │ + Cuboid   │ │                                │ │ Rotation      │ │
│ └────────────┘ │                                │ │ Scale         │ │
│                │                                │ └───────────────┘ │
│ ┌────────────┐ │                                │ ┌───────────────┐ │
│ │ Objects    │ │                                │ │ Material      │ │
│ │ ○ Sphere 1 │ │                                │ │ Color         │ │
│ │ ○ Cuboid 1 │ │                                │ │ Roughness     │ │
│ │            │ │                                │ │ ...           │ │
│ └────────────┘ │                                │ └───────────────┘ │
│                │                                │                   │
├────────────────┴────────────────────────────────┴───────────────────┤
│  Status Bar (24px)           Samples: 128 | FPS: 60 | Objects: 3   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
src/
├── components/
│   ├── App.tsx                # UPDATE: full layout
│   ├── Canvas.tsx             # (from before)
│   ├── layout/
│   │   ├── Header.tsx         # NEW
│   │   ├── LeftPanel.tsx      # NEW
│   │   ├── RightPanel.tsx     # NEW
│   │   └── StatusBar.tsx      # NEW
│   ├── panels/
│   │   ├── AddObjectSection.tsx    # NEW
│   │   ├── ObjectList.tsx          # NEW
│   │   ├── TransformSection.tsx    # NEW (placeholder)
│   │   └── MaterialSection.tsx     # NEW (placeholder)
│   └── ui/
│       ├── Panel.tsx          # NEW: reusable panel component
│       ├── Button.tsx         # NEW: styled button
│       ├── Slider.tsx         # NEW: styled slider
│       ├── ColorPicker.tsx    # NEW: color input
│       └── NumberInput.tsx    # NEW: number input with drag
├── styles/
│   └── theme.ts               # NEW: CSS variable definitions
```

---

## Design System

### Color Palette (CSS Variables)

```css
/* src/index.css additions */

:root {
  /* Backgrounds */
  --bg-base: #121212;
  --bg-panel: #1E1E1E;
  --bg-panel-secondary: #252526;
  --bg-elevated: #2D2D2D;
  --bg-hover: #3C3C3C;
  --bg-active: #094771;
  
  /* Borders */
  --border-subtle: #333333;
  --border-default: #454545;
  --border-focus: #007ACC;
  
  /* Text */
  --text-primary: #E0E0E0;
  --text-secondary: #A0A0A0;
  --text-muted: #6E6E6E;
  --text-accent: #4FC3F7;
  
  /* Accent */
  --accent-primary: #007ACC;
  --accent-hover: #1A8AD4;
  --accent-success: #4CAF50;
  --accent-warning: #FFA726;
  --accent-error: #EF5350;
  
  /* Gizmo colors */
  --gizmo-x: #E53935;
  --gizmo-y: #43A047;
  --gizmo-z: #1E88E5;
}
```

### Tailwind Config Update

```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        panel: 'var(--bg-panel)',
        'panel-secondary': 'var(--bg-panel-secondary)',
        elevated: 'var(--bg-elevated)',
        hover: 'var(--bg-hover)',
        active: 'var(--bg-active)',
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-focus': 'var(--border-focus)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-accent': 'var(--text-accent)',
        accent: 'var(--accent-primary)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

---

## Component Implementations

### App.tsx

```tsx
import { Header } from './layout/Header';
import { LeftPanel } from './layout/LeftPanel';
import { RightPanel } from './layout/RightPanel';
import { StatusBar } from './layout/StatusBar';
import { Canvas } from './Canvas';

export function App() {
  return (
    <div className="w-screen h-screen flex flex-col bg-base text-text-primary overflow-hidden">
      <Header />
      
      <div className="flex-1 flex min-h-0">
        <LeftPanel />
        
        <main className="flex-1 relative">
          <Canvas className="absolute inset-0" />
        </main>
        
        <RightPanel />
      </div>
      
      <StatusBar />
    </div>
  );
}
```

### Header.tsx

```tsx
import { Settings, HelpCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="h-12 bg-panel border-b border-border-subtle flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600" />
        <h1 className="text-lg font-semibold tracking-tight">Lightshow</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-hover rounded-md transition-colors">
          <Settings className="w-4 h-4 text-text-secondary" />
        </button>
        <button className="p-2 hover:bg-hover rounded-md transition-colors">
          <HelpCircle className="w-4 h-4 text-text-secondary" />
        </button>
      </div>
    </header>
  );
}
```

### LeftPanel.tsx

```tsx
import { AddObjectSection } from '../panels/AddObjectSection';
import { ObjectList } from '../panels/ObjectList';

export function LeftPanel() {
  return (
    <aside className="w-60 bg-panel border-r border-border-subtle flex flex-col">
      <AddObjectSection />
      <div className="flex-1 overflow-hidden">
        <ObjectList />
      </div>
    </aside>
  );
}
```

### RightPanel.tsx

```tsx
import { useSceneStore } from '../../store/sceneStore';
import { TransformSection } from '../panels/TransformSection';
import { MaterialSection } from '../panels/MaterialSection';

export function RightPanel() {
  const selectedObject = useSceneStore(state => state.getSelectedObject());
  
  return (
    <aside className="w-72 bg-panel border-l border-border-subtle overflow-y-auto">
      {selectedObject ? (
        <>
          <TransformSection object={selectedObject} />
          <MaterialSection object={selectedObject} />
        </>
      ) : (
        <div className="p-4 text-text-secondary text-sm">
          Select an object to view properties
        </div>
      )}
    </aside>
  );
}
```

### StatusBar.tsx

```tsx
import { useSceneStore } from '../../store/sceneStore';

export function StatusBar() {
  const objectCount = useSceneStore(state => state.objects.length);
  // TODO: Get actual FPS and sample count from renderer
  
  return (
    <footer className="h-6 bg-panel-secondary border-t border-border-subtle flex items-center justify-end px-4 text-xs text-text-muted gap-4">
      <span>Objects: {objectCount}</span>
      <span>Samples: 0</span>
      <span>FPS: --</span>
    </footer>
  );
}
```

### AddObjectSection.tsx

```tsx
import { Circle, Box } from 'lucide-react';
import { useSceneStore } from '../../store/sceneStore';
import { Button } from '../ui/Button';

export function AddObjectSection() {
  const { addSphere, addCuboid } = useSceneStore();
  
  return (
    <div className="p-3 border-b border-border-subtle">
      <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Add Object
      </h2>
      <div className="flex gap-2">
        <Button
          onClick={() => addSphere()}
          className="flex-1"
          variant="secondary"
        >
          <Circle className="w-4 h-4 mr-2" />
          Sphere
        </Button>
        <Button
          onClick={() => addCuboid()}
          className="flex-1"
          variant="secondary"
        >
          <Box className="w-4 h-4 mr-2" />
          Cuboid
        </Button>
      </div>
    </div>
  );
}
```

### ObjectList.tsx

```tsx
import { Circle, Box, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useSceneStore } from '../../store/sceneStore';
import { SceneObject } from '../../core/types';

export function ObjectList() {
  const { objects, selectedObjectId, selectObject, updateObject, removeObject } = useSceneStore();
  
  return (
    <div className="flex flex-col">
      <h2 className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-subtle">
        Scene Objects
      </h2>
      
      <div className="flex-1 overflow-y-auto">
        {objects.length === 0 ? (
          <div className="p-3 text-sm text-text-muted">
            No objects in scene
          </div>
        ) : (
          <ul>
            {objects.map(obj => (
              <ObjectListItem
                key={obj.id}
                object={obj}
                isSelected={obj.id === selectedObjectId}
                onSelect={() => selectObject(obj.id)}
                onToggleVisibility={() => updateObject(obj.id, { visible: !obj.visible })}
                onDelete={() => removeObject(obj.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface ObjectListItemProps {
  object: SceneObject;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

function ObjectListItem({ object, isSelected, onSelect, onToggleVisibility, onDelete }: ObjectListItemProps) {
  const Icon = object.type === 'sphere' ? Circle : Box;
  
  return (
    <li
      className={`
        flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
        ${isSelected ? 'bg-active' : 'hover:bg-hover'}
      `}
      onClick={onSelect}
    >
      <Icon className="w-4 h-4 text-text-secondary flex-shrink-0" />
      
      <span className="flex-1 text-sm truncate">
        {object.name}
      </span>
      
      <button
        className="p-1 hover:bg-elevated rounded opacity-60 hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
      >
        {object.visible ? (
          <Eye className="w-3 h-3" />
        ) : (
          <EyeOff className="w-3 h-3 text-text-muted" />
        )}
      </button>
      
      <button
        className="p-1 hover:bg-elevated rounded opacity-60 hover:opacity-100 text-accent-error transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </li>
  );
}
```

### UI Components

#### Button.tsx

```tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors rounded-md disabled:opacity-50';
    
    const variants = {
      primary: 'bg-accent hover:bg-accent-hover text-white',
      secondary: 'bg-elevated hover:bg-hover text-text-primary border border-border-default',
      ghost: 'hover:bg-hover text-text-secondary',
    };
    
    const sizes = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-3 py-1.5',
      lg: 'text-base px-4 py-2',
    };
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
```

#### Panel.tsx

```tsx
import { ReactNode } from 'react';

interface PanelProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Panel({ title, children, defaultOpen = true }: PanelProps) {
  return (
    <div className="border-b border-border-subtle">
      <h3 className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider bg-panel-secondary">
        {title}
      </h3>
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "lucide-react": "^0.294.0"
  }
}
```

Also add Inter font in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
```

---

## Testing Requirements

### Visual Tests

| Test ID | Description | Expected |
|---------|-------------|----------|
| T7.1 | Layout structure | Three-column layout renders correctly |
| T7.2 | Header | Logo and title visible, buttons work |
| T7.3 | Left panel | Add buttons and object list visible |
| T7.4 | Right panel | Shows "Select an object" when none selected |
| T7.5 | Right panel with selection | Shows transform and material sections |
| T7.6 | Status bar | Shows object count |
| T7.7 | Dark theme | All elements use dark colors |
| T7.8 | Responsive | Panels stay fixed, viewport fills space |

### Interaction Tests

| Test ID | Description | Steps | Expected |
|---------|-------------|-------|----------|
| T7.I1 | Add sphere | Click "+ Sphere" | Sphere added to list |
| T7.I2 | Add cuboid | Click "+ Cuboid" | Cuboid added to list |
| T7.I3 | Select object | Click object in list | Object highlighted, properties shown |
| T7.I4 | Toggle visibility | Click eye icon | Icon toggles, object visibility toggles |
| T7.I5 | Delete object | Click trash icon | Object removed from list |
| T7.I6 | Object count | Add/remove objects | Status bar updates |

---

## Acceptance Criteria

- [ ] Full layout matches wireframe
- [ ] Dark theme applied consistently
- [ ] Header displays app name and icons
- [ ] Left panel shows add buttons and object list
- [ ] Right panel shows properties when object selected
- [ ] Status bar shows object count
- [ ] Add object buttons work
- [ ] Object selection works
- [ ] Delete and visibility toggles work
- [ ] No layout breaks or overflow issues

---

## Definition of Done

Stage 7 is complete when:
1. The three-panel layout is functional
2. Objects can be added from the UI
3. Objects appear in the list and can be selected
4. The right panel responds to selection
5. All UI elements follow the dark theme

