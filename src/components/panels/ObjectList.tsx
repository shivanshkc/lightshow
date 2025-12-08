import { Circle, Box, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useSceneStore } from '../../store/sceneStore';
import { SceneObject } from '../../core/types';

export function ObjectList() {
  const { objects, selectedObjectId, selectObject, updateObject, removeObject } =
    useSceneStore();

  return (
    <div className="flex flex-col h-full">
      <h2 className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-subtle">
        Scene Objects
      </h2>

      <div className="flex-1 overflow-y-auto">
        {objects.length === 0 ? (
          <div className="p-3 text-sm text-text-muted">No objects in scene</div>
        ) : (
          <ul>
            {objects.map((obj) => (
              <ObjectListItem
                key={obj.id}
                object={obj}
                isSelected={obj.id === selectedObjectId}
                onSelect={() => selectObject(obj.id)}
                onToggleVisibility={() =>
                  updateObject(obj.id, { visible: !obj.visible })
                }
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

function ObjectListItem({
  object,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDelete,
}: ObjectListItemProps) {
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

      <span className="flex-1 text-sm truncate">{object.name}</span>

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

