import { Box, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useKernel, useKernelSceneSnapshot } from '@adapters';
import type { SceneObjectSnapshot } from '@ports';

export function ObjectList() {
  const kernel = useKernel();
  const snap = useKernelSceneSnapshot();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-subtle flex items-center justify-between">
        <span>Scene Objects</span>
        <span className="text-text-muted font-medium">({snap.objects.length})</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {snap.objects.length === 0 ? (
          <div className="p-3 text-sm text-text-muted">No objects in scene</div>
        ) : (
          <ul>
            {snap.objects.map((obj) => (
              <ObjectListItem
                key={obj.id}
                object={obj}
                isSelected={obj.id === snap.selectedObjectId}
                onSelect={() =>
                  kernel.dispatch({ v: 1, type: 'selection.set', objectId: obj.id })
                }
                onToggleVisibility={() =>
                  kernel.dispatch({
                    v: 1,
                    type: 'object.visibility.set',
                    objectId: obj.id,
                    visible: !obj.visible,
                  })
                }
                onDelete={() =>
                  kernel.dispatch({ v: 1, type: 'object.remove', objectId: obj.id })
                }
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface ObjectListItemProps {
  object: SceneObjectSnapshot;
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
  const kernel = useKernel();
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(object.name);
  const inputRef = useRef<HTMLInputElement>(null);

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
      kernel.dispatch({ v: 1, type: 'object.rename', objectId: object.id, name: trimmed });
    }
    setIsRenaming(false);
    setEditName(object.name);
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
      <Box className="w-4 h-4 text-text-secondary flex-shrink-0" />

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
        <span className="flex-1 text-sm truncate">{object.name}</span>
      )}

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

