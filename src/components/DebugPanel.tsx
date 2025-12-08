import { useSceneStore } from '../store/sceneStore';
import { SceneObject, Material } from '../core/types';
import { nanoid } from 'nanoid';

/**
 * Create a demo scene showcasing all material types
 */
function createDemoScene(): SceneObject[] {
  const objects: SceneObject[] = [];

  // Helper to create object
  const makeObject = (
    name: string,
    type: 'sphere' | 'cuboid',
    position: [number, number, number],
    scale: [number, number, number],
    material: Material
  ): SceneObject => ({
    id: nanoid(),
    name,
    type,
    visible: true,
    transform: {
      position,
      rotation: [0, 0, 0],
      scale,
    },
    material,
  });

  // Ground plane (large cuboid)
  objects.push(makeObject(
    'Ground',
    'cuboid',
    [0, -1.5, 0],
    [10, 0.5, 10],
    { type: 'plastic', color: [0.3, 0.3, 0.35], ior: 1.5, intensity: 1 }
  ));

  // Light source (emissive sphere at top)
  objects.push(makeObject(
    'Light',
    'sphere',
    [0, 4, -2],
    [1.5, 1.5, 1.5],
    { type: 'light', color: [1, 0.95, 0.9], ior: 1.5, intensity: 8 }
  ));

  // Row of spheres demonstrating materials (from left to right)
  
  // 1. Red Plastic sphere
  objects.push(makeObject(
    'Plastic (Red)',
    'sphere',
    [-3, 0, 0],
    [0.8, 0.8, 0.8],
    { type: 'plastic', color: [0.9, 0.2, 0.2], ior: 1.5, intensity: 1 }
  ));

  // 2. Green Plastic sphere
  objects.push(makeObject(
    'Plastic (Green)',
    'sphere',
    [-1.5, 0, 0],
    [0.8, 0.8, 0.8],
    { type: 'plastic', color: [0.2, 0.8, 0.3], ior: 1.5, intensity: 1 }
  ));

  // 3. Gold Metal sphere
  objects.push(makeObject(
    'Metal (Gold)',
    'sphere',
    [0, 0, 0],
    [0.8, 0.8, 0.8],
    { type: 'metal', color: [1, 0.84, 0], ior: 1.5, intensity: 1 }
  ));

  // 4. Silver Metal sphere
  objects.push(makeObject(
    'Metal (Silver)',
    'sphere',
    [1.5, 0, 0],
    [0.8, 0.8, 0.8],
    { type: 'metal', color: [0.97, 0.97, 0.97], ior: 1.5, intensity: 1 }
  ));

  // 5. Glass sphere
  objects.push(makeObject(
    'Glass',
    'sphere',
    [3, 0, 0],
    [0.8, 0.8, 0.8],
    { type: 'glass', color: [1, 1, 1], ior: 1.5, intensity: 1 }
  ));

  // Back row with cuboids
  
  // Metal cube
  objects.push(makeObject(
    'Metal Cube',
    'cuboid',
    [-2, 0, -2.5],
    [0.6, 0.6, 0.6],
    { type: 'metal', color: [0.8, 0.5, 0.3], ior: 1.5, intensity: 1 }  // Copper
  ));

  // Glass cube
  objects.push(makeObject(
    'Glass Cube',
    'cuboid',
    [0, 0, -2.5],
    [0.6, 0.6, 0.6],
    { type: 'glass', color: [0.9, 0.95, 1], ior: 1.7, intensity: 1 }  // Slightly blue tinted
  ));

  // Small light cube
  objects.push(makeObject(
    'Light Cube',
    'cuboid',
    [2, 0, -2.5],
    [0.5, 0.5, 0.5],
    { type: 'light', color: [1, 0.5, 0.2], ior: 1.5, intensity: 5 }  // Orange glow
  ));

  return objects;
}

/**
 * Temporary debug panel for testing scene operations
 * Will be replaced by proper UI in later stages
 */
export function DebugPanel() {
  const { addSphere, addCuboid, objects, clear, selectedObjectId, selectObject, removeObject } = useSceneStore();

  const handleAddSphere = () => {
    const id = addSphere();
    selectObject(id);
  };

  const handleAddCuboid = () => {
    const id = addCuboid();
    selectObject(id);
  };

  const handleClear = () => {
    clear();
  };

  const handleLoadDemo = () => {
    clear();
    const demoObjects = createDemoScene();
    // Add objects directly to the store
    useSceneStore.setState({ objects: demoObjects });
  };

  const handleRemoveSelected = () => {
    if (selectedObjectId) {
      removeObject(selectedObjectId);
    }
  };

  return (
    <div className="absolute top-4 left-4 bg-panel border border-border-subtle rounded-lg p-4 space-y-3 min-w-[200px]">
      <h3 className="text-text-primary font-semibold text-sm">Scene Debug</h3>
      
      <button
        onClick={handleLoadDemo}
        className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
      >
        🎨 Load Material Demo
      </button>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleAddSphere}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded text-sm transition-colors"
        >
          Add Sphere
        </button>
        <button
          onClick={handleAddCuboid}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded text-sm transition-colors"
        >
          Add Cuboid
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleRemoveSelected}
          disabled={!selectedObjectId}
          className="px-3 py-1.5 bg-elevated hover:bg-hover text-text-primary rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Remove Selected
        </button>
        <button
          onClick={handleClear}
          disabled={objects.length === 0}
          className="px-3 py-1.5 bg-elevated hover:bg-hover text-text-primary rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
      </div>

      <div className="border-t border-border-subtle pt-3 mt-3">
        <div className="text-text-secondary text-xs mb-2">
          Objects: {objects.length}
        </div>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {objects.map((obj) => (
            <div
              key={obj.id}
              onClick={() => selectObject(obj.id)}
              className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                selectedObjectId === obj.id
                  ? 'bg-active text-white'
                  : 'bg-elevated hover:bg-hover text-text-secondary'
              }`}
            >
              {obj.name} ({obj.type})
            </div>
          ))}
          {objects.length === 0 && (
            <div className="text-text-muted text-xs italic">No objects</div>
          )}
        </div>
      </div>
    </div>
  );
}

