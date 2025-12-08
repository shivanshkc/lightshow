import { useSceneStore } from '../store/sceneStore';

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

  const handleRemoveSelected = () => {
    if (selectedObjectId) {
      removeObject(selectedObjectId);
    }
  };

  return (
    <div className="absolute top-4 left-4 bg-panel border border-border-subtle rounded-lg p-4 space-y-3 min-w-[200px]">
      <h3 className="text-text-primary font-semibold text-sm">Scene Debug</h3>
      
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

