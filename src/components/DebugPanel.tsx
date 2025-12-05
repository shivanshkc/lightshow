import { useSceneStore } from '../store/sceneStore';

/**
 * Temporary debug panel for testing scene functionality
 * Will be replaced by proper UI in later stages
 */
export function DebugPanel() {
  const { addSphere, addCuboid, objects, clear, selectedObjectId, selectObject } = useSceneStore();

  return (
    <div className="absolute top-4 left-4 bg-panel p-4 rounded-lg shadow-lg border border-border-subtle space-y-3 min-w-[200px]">
      <h3 className="text-text-primary font-semibold text-sm">Debug Panel</h3>
      
      <div className="flex gap-2">
        <button
          onClick={() => addSphere()}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-sm rounded transition-colors"
        >
          + Sphere
        </button>
        <button
          onClick={() => addCuboid()}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-sm rounded transition-colors"
        >
          + Cuboid
        </button>
      </div>
      
      <button
        onClick={() => clear()}
        className="w-full px-3 py-1.5 bg-elevated hover:bg-hover text-text-secondary text-sm rounded transition-colors"
      >
        Clear All
      </button>
      
      <div className="text-text-secondary text-xs">
        Objects: {objects.length}
      </div>
      
      {objects.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {objects.map((obj) => (
            <div
              key={obj.id}
              onClick={() => selectObject(selectedObjectId === obj.id ? null : obj.id)}
              className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                selectedObjectId === obj.id
                  ? 'bg-active text-white'
                  : 'bg-elevated hover:bg-hover text-text-secondary'
              }`}
            >
              {obj.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

