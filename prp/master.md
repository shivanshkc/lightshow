# Product Requirement Prompt (PRP)
## Lightshow — Browser-Based Raytracing Application

---

## 1. Product Vision

**Lightshow** is a browser-based real-time raytracing application that enables users to create, manipulate, and render 3D scenes with physically accurate lighting. The application provides an intuitive interface for placing primitive objects, adjusting their transformations, and fine-tuning material properties to achieve stunning visual results—all within a web browser.

### Target Users
- 3D artists exploring lighting and materials
- Educators teaching computer graphics concepts
- Hobbyists interested in raytracing technology
- Developers prototyping scene compositions

### Core Value Proposition
- **Zero installation**: Runs entirely in the browser
- **Real-time feedback**: See raytraced results as you make changes
- **Intuitive controls**: Professional-grade gizmos with beginner-friendly UX
- **Physical accuracy**: Realistic light behavior including reflections, refractions, and shadows

---

## 2. Core Features

### 2.1 Scene Management

#### 2.1.1 Object Creation
- **Supported Primitives (v1.0)**:
  - Sphere
  - Cuboid (Box)
- **Future Primitives** (out of scope for v1.0):
  - Cylinder
  - Cone
  - Torus
  - Plane/Ground
  - Custom mesh import (.obj, .gltf)

#### 2.1.2 Default Object Properties
When a new object is added to the scene, it should have sensible defaults:

| Property | Sphere Default | Cuboid Default |
|----------|---------------|----------------|
| Position | (0, 0, 0) or auto-placed in camera view | (0, 0, 0) or auto-placed in camera view |
| Size | Radius: 1.0 unit | Dimensions: 1.0 × 1.0 × 1.0 units |
| Rotation | (0°, 0°, 0°) | (0°, 0°, 0°) |
| Color | Light gray (#CCCCCC) | Light gray (#CCCCCC) |
| Roughness | 0.5 (semi-glossy) | 0.5 (semi-glossy) |
| Transparency | 0.0 (fully opaque) | 0.0 (fully opaque) |
| Emission | 0.0 (no light emission) | 0.0 (no light emission) |

**Smart Placement**: New objects should be placed at a visible location within the current camera frustum, avoiding overlap with existing objects when possible.

#### 2.1.3 Object Selection
- **Click to select**: Single click on an object in the viewport to select it
- **Visual feedback**: Selected objects display transformation gizmos
- **Selection outline**: Subtle highlight/outline on selected objects
- **Deselection**: Click on empty space or press `Escape` to deselect
- **No multi-select required** for v1.0

#### 2.1.4 Object Deletion
- **Keyboard shortcut**: `Delete` or `Backspace` key removes selected object
- **UI button**: Delete button in the properties panel
- **Confirmation**: No confirmation dialog for single object deletion (undo will be available)
- **Undo support**: `Ctrl/Cmd + Z` to restore deleted objects

---

### 2.2 Object Transformation

#### 2.2.1 Translation (Move)
- **Gizmo**: Three-axis translation gizmo with colored arrows
  - X-axis: Red
  - Y-axis: Green  
  - Z-axis: Blue
- **Interaction**: Click and drag on axis arrows to move along that axis
- **Plane movement**: Click and drag on the squares between axes to move on that plane (XY, XZ, YZ)
- **Free movement**: Central sphere/cube for free movement in screen space
- **Precision**: Hold `Shift` while dragging for slower, precise movement
- **Snapping**: Hold `Ctrl/Cmd` to snap to grid increments (default: 0.5 units)

#### 2.2.2 Rotation
- **Gizmo**: Three circular rings for rotation around each axis
  - X-axis rotation: Red ring
  - Y-axis rotation: Green ring
  - Z-axis rotation: Blue ring
- **Interaction**: Click and drag on a ring to rotate around that axis
- **Visual feedback**: Display rotation angle in degrees while dragging
- **Snapping**: Hold `Ctrl/Cmd` to snap to 15° increments
- **Trackball rotation**: Outer gray ring for free-form rotation

#### 2.2.3 Scale (Dimensions)
- **Gizmo**: Three-axis scale handles (cubes at the end of lines)
  - X-axis: Red
  - Y-axis: Green
  - Z-axis: Blue
- **Uniform scale**: Central cube handle for proportional scaling on all axes
- **Non-uniform scale**: Individual axis handles for stretching
- **Constraints**: Minimum size limit to prevent zero/negative dimensions
- **For Spheres**: Only uniform scale (radius adjustment)
- **For Cuboids**: Independent width, height, depth scaling

#### 2.2.4 Gizmo Behavior
- **Mode switching**: Keyboard shortcuts to switch between transform modes:
  - `W` or `G`: Translate (move)
  - `E` or `R`: Rotate
  - `R` or `S`: Scale
- **Gizmo size**: Constant screen-space size regardless of camera distance
- **Depth handling**: Gizmos always render on top of scene objects
- **Hover feedback**: Axis highlights when hovered
- **Active feedback**: Brighter color and thicker lines when actively dragging

---

### 2.3 Material Properties

Each object has the following material properties that users can adjust:

#### 2.3.1 Base Color
- **Type**: RGB color picker
- **Default**: Light gray (#CCCCCC)
- **UI**: Color wheel/picker with hex input option
- **Alpha channel**: Not used here (transparency is separate)

#### 2.3.2 Roughness / Smoothness
- **Type**: Slider (0.0 to 1.0)
- **0.0**: Perfectly smooth (mirror-like reflections)
- **1.0**: Completely rough (diffuse, matte surface)
- **Default**: 0.5
- **Label options**: Can be labeled as "Roughness" or inverted as "Smoothness"
- **Visual preview**: Real-time update in viewport

#### 2.3.3 Transparency / Opacity
- **Type**: Slider (0.0 to 1.0)
- **0.0**: Fully opaque
- **1.0**: Fully transparent (glass-like)
- **Default**: 0.0
- **Refraction**: Transparent objects should exhibit refraction
- **IOR (Index of Refraction)**: Optional advanced setting (default: 1.5 for glass)

#### 2.3.4 Emission (Light Source)
- **Emission Strength**: Slider (0.0 to 10.0+)
  - 0.0: No emission (default)
  - Higher values: Brighter light emission
- **Emission Color**: RGB color picker
  - Default: White (#FFFFFF)
  - Allows any color of light
- **Behavior**: Objects with emission > 0 act as area lights in the scene
- **Self-illumination**: Emissive objects appear bright regardless of scene lighting

---

### 2.4 Camera Controls

#### 2.4.1 Orbit Camera
- **Rotation**: Left-click and drag on empty space to orbit around focus point
- **Pan**: Middle-click drag or `Shift + Left-click` drag to pan
- **Zoom**: Scroll wheel to zoom in/out
- **Focus**: Double-click on object to focus camera on it

#### 2.4.2 Camera Properties (Optional for v1.0)
- Field of View adjustment
- Depth of Field (advanced)
- Camera position reset button

---

### 2.5 Scene Environment

#### 2.5.1 Background
- **Solid color**: Default background color (dark gray or gradient)
- **Sky gradient**: Simple two-color sky gradient option
- **Environment lighting**: Background contributes to scene illumination

#### 2.5.2 Ground Plane (Optional for v1.0)
- Infinite ground plane with grid
- Toggleable visibility
- Receives shadows

#### 2.5.3 Default Lighting
- Scene should have reasonable default lighting so objects are visible
- At minimum: ambient light + one directional or point light
- Users can add emissive objects for additional lighting

---

## 3. User Interface Design

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Header Bar (App name, File operations, Settings)               │
├──────────────┬─────────────────────────────────┬────────────────┤
│              │                                 │                │
│   Object     │                                 │   Properties   │
│   Hierarchy  │        3D Viewport              │   Panel        │
│   Panel      │                                 │                │
│              │                                 │   - Transform  │
│   - List of  │        (Raytraced Scene)        │   - Material   │
│     objects  │                                 │   - Actions    │
│   - Add new  │                                 │                │
│     buttons  │                                 │                │
│              │                                 │                │
├──────────────┴─────────────────────────────────┴────────────────┤
│  Status Bar (Render info, FPS, Tips)                            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Left Panel — Object Hierarchy

#### Content:
- **Add Object Section**:
  - "+ Sphere" button
  - "+ Cuboid" button
  - (Future: more primitive buttons)
  
- **Scene Objects List**:
  - Hierarchical list of all objects in scene
  - Object type icon + name
  - Visibility toggle (eye icon)
  - Click to select object
  - Double-click to rename
  - Drag to reorder (optional)

#### Behavior:
- Selected object highlighted in list
- List scrollable if many objects
- Right-click context menu: Duplicate, Delete, Rename

### 3.3 Center — 3D Viewport

#### Features:
- Full raytraced render of the scene
- Transform gizmos overlay when object selected
- Grid floor (optional, toggleable)
- Axis indicator in corner (showing world orientation)

#### Render Modes (Optional for v1.0):
- Progressive refinement: Start rough, improve quality over time
- Pause rendering when transforming for performance

### 3.4 Right Panel — Properties Panel

#### When Nothing Selected:
- Display scene/environment settings
- Background color picker
- Ambient light settings

#### When Object Selected:

**Transform Section:**
```
┌─────────────────────────────┐
│ Transform                   │
├─────────────────────────────┤
│ Position                    │
│ X: [____] Y: [____] Z: [___]│
│                             │
│ Rotation (degrees)          │
│ X: [____] Y: [____] Z: [___]│
│                             │
│ Scale / Dimensions          │
│ X: [____] Y: [____] Z: [___]│
│ (or Radius for sphere)      │
└─────────────────────────────┘
```

**Material Section:**
```
┌─────────────────────────────┐
│ Material                    │
├─────────────────────────────┤
│ Color      [■■■■■] #CCCCCC  │
│                             │
│ Roughness  ════●════  0.50  │
│                             │
│ Transparency ●══════  0.00  │
│                             │
│ ☐ Emissive                  │
│   Strength ══●════   1.00   │
│   Color    [■■■■■] #FFFFFF  │
└─────────────────────────────┘
```

**Actions Section:**
```
┌─────────────────────────────┐
│ Actions                     │
├─────────────────────────────┤
│ [Duplicate]  [Delete]       │
│ [Reset Transform]           │
└─────────────────────────────┘
```

### 3.5 Visual Design Guidelines

#### Color Palette:
- **Background**: Dark theme preferred (easier on eyes, better for viewing renders)
- **Panel backgrounds**: Dark gray (#1E1E1E to #2D2D2D)
- **Text**: Light gray/white (#E0E0E0)
- **Accent color**: Vibrant but not overwhelming (e.g., #4A9EFF blue)
- **Gizmo colors**: Standard RGB for axes (Red, Green, Blue)

#### Typography:
- Clean, modern sans-serif font
- Clear hierarchy (headings, labels, values)
- Monospace for numerical inputs

#### Spacing & Layout:
- Consistent padding and margins
- Clear visual separation between sections
- Collapsible panels for advanced options

### 3.6 Gizmo Visual Design

#### Translation Gizmo:
```
        ▲ Y (Green)
        │
        │    
        ●───────► X (Red)
       /
      /
     ▼ Z (Blue)
     
- Arrows: Conical heads, cylindrical shafts
- Plane handles: Small squares at axis intersections
- Center: Small sphere for free move
```

#### Rotation Gizmo:
```
- Three toroidal rings (circles)
- Each ring perpendicular to its axis
- Outer trackball ring (gray, larger)
- Visible arc shows rotation amount when dragging
```

#### Scale Gizmo:
```
- Three lines with cube endpoints
- Center cube for uniform scale
- Lines thinner than translation arrows
```

#### Gizmo Polish Requirements:
- Smooth anti-aliased rendering
- Semi-transparent when not hovered
- Full opacity on hover
- Highlighted axis when active
- Subtle drop shadow or glow for visibility against any background
- Consistent sizing regardless of camera distance

---

## 4. Technical Requirements

### 4.1 Rendering Engine

#### Core Technology:
- **WebGPU** as the sole rendering backend
- Path tracing or ray tracing algorithm for realistic lighting
- Progressive rendering for real-time feedback
- Compute shaders for raytracing acceleration

#### Performance Targets:
- Minimum 10 FPS for interactive viewport (during manipulation)
- Higher quality render when scene is static
- Support scenes with 20+ objects without significant slowdown
- Graceful degradation on lower-end hardware

#### Rendering Features:
- Global illumination (indirect lighting)
- Soft shadows
- Reflections (based on roughness)
- Refractions (for transparent objects)
- Anti-aliasing (progressive)

### 4.2 Browser Support
WebGPU is required. Supported browsers:
- Chrome 113+ (full support)
- Edge 113+ (full support)
- Firefox 130+ (with `dom.webgpu.enabled` flag, nightly builds)
- Safari 17+ (macOS Sonoma / iOS 17)
- Mobile: Limited support (WebGPU availability varies by device/OS)

### 4.3 State Management
- Scene state should be serializable (for save/load)
- Undo/Redo stack (minimum 20 operations)
- Auto-save to localStorage (optional)

### 4.4 File Operations (v1.0 Scope)
- **Export scene**: JSON format
- **Import scene**: JSON format
- **Export image**: PNG render export

---

## 5. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Delete selected object | `Delete` / `Backspace` |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` |
| Translate mode | `W` or `G` |
| Rotate mode | `E` |
| Scale mode | `R` or `S` |
| Deselect | `Escape` |
| Focus on selected | `F` |
| Reset camera | `Home` |
| Toggle grid | `G` (if not in translate mode) |
| Duplicate | `Ctrl/Cmd + D` |

---

## 6. User Flows

### 6.1 Adding and Positioning a New Object

```
1. User clicks "+ Sphere" button in left panel
2. Sphere appears in scene at default position (visible in viewport)
3. Sphere is automatically selected, translation gizmo appears
4. User clicks and drags X-axis arrow to move sphere right
5. User releases mouse, sphere stays in new position
6. Render updates to show sphere in new location
```

### 6.2 Modifying Material Properties

```
1. User clicks on existing object in viewport
2. Object becomes selected, properties panel shows its settings
3. User adjusts roughness slider from 0.5 to 0.1
4. Viewport updates in real-time showing shinier surface
5. User clicks emission checkbox to enable emission
6. User sets emission strength to 2.0 and color to orange
7. Object now glows orange and illuminates nearby objects
```

### 6.3 Creating a Glass Object

```
1. User adds a new sphere
2. User sets transparency to 0.9
3. User sets roughness to 0.0
4. Sphere now appears glass-like with visible refraction
5. Objects behind the sphere appear distorted through it
```

---

## 7. Edge Cases & Constraints

### 7.1 Object Limits
- Maximum objects per scene: 100 (soft limit with warning)
- Minimum object size: 0.01 units
- Maximum object size: 1000 units

### 7.2 Numerical Input Validation
- All numerical inputs should validate and clamp to valid ranges
- Invalid input should revert to last valid value
- Support mathematical expressions in number fields (e.g., "1+1" = 2)

### 7.3 Performance Safeguards
- Reduce render quality during active manipulation
- Option to pause rendering
- Warning when scene complexity impacts performance

---

## 8. Future Enhancements (Out of Scope for v1.0)

- Additional primitive shapes (cylinder, cone, torus, plane)
- Custom mesh import (.obj, .gltf, .fbx)
- Texture/image support on materials
- HDRI environment maps
- Animation timeline
- Multiple cameras
- Scene presets/templates
- Collaborative editing
- Cloud save/sync
- Render queue for high-quality exports
- Post-processing effects (bloom, tone mapping)
- Physics simulation
- Instancing for repeated objects

---

## 9. Success Metrics

### Usability Goals:
- New user can add and position an object within 30 seconds
- Material adjustments show visible results within 1 second
- No user confusion about gizmo controls (based on standard 3D software conventions)

### Performance Goals:
- Initial load time under 3 seconds
- Interactive frame rate maintained during object manipulation
- No browser crashes or memory leaks during extended sessions

### Quality Goals:
- Raytraced output should be visually comparable to offline renderers
- Gizmos should feel responsive and precise
- UI should be intuitive without requiring documentation

---

## 10. Acceptance Criteria

### MVP (v1.0) Must Have:
- [ ] Add sphere primitive to scene
- [ ] Add cuboid primitive to scene
- [ ] Select objects by clicking
- [ ] Translation gizmo with all three axes working
- [ ] Rotation gizmo with all three axes working
- [ ] Scale gizmo (uniform and per-axis)
- [ ] Delete selected object
- [ ] Material: Base color picker
- [ ] Material: Roughness slider
- [ ] Material: Transparency slider
- [ ] Material: Emission toggle, strength, and color
- [ ] Real-time raytraced viewport
- [ ] Working camera orbit controls
- [ ] Clean, dark-themed UI
- [ ] Polished gizmo visuals
- [ ] Basic undo/redo

### Nice to Have for v1.0:
- [ ] Scene export/import (JSON)
- [ ] Image export (PNG)
- [ ] Keyboard shortcuts
- [ ] Object hierarchy panel with list
- [ ] Object renaming
- [ ] Grid toggle
- [ ] Snapping for transforms

---

## 11. Glossary

| Term | Definition |
|------|------------|
| **Raytracing** | Rendering technique that simulates light rays to produce realistic images |
| **Primitive** | Basic 3D shape (sphere, cube, etc.) |
| **Gizmo** | Interactive 3D control widget for transforming objects |
| **Roughness** | Material property controlling how scattered reflections are |
| **Emission** | Material property making an object emit light |
| **IOR** | Index of Refraction - how much light bends through transparent materials |
| **Progressive rendering** | Technique where image quality improves over multiple passes |

---

*Document Version: 1.0*  
*Last Updated: December 2025*

