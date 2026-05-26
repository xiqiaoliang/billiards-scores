import { useEffect, useRef, useState } from 'react';
interface PlayerNameEditorProps {
  name: string;
  color: string;
  editable: boolean;
  onNameChange: (name: string) => void;
  className?: string;
}

export function PlayerNameEditor({
  name,
  color,
  editable,
  onNameChange,
  className = '',
}: PlayerNameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    onNameChange(draft.trim() || name);
  };

  if (!editable) {
    return (
      <span className={className} style={{ color }}>
        {name}
      </span>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`player-name-input ${className}`}
        style={{ color }}
        value={draft}
        maxLength={12}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(name);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className={`player-name-btn ${className}`}
      style={{ color }}
      onClick={() => setEditing(true)}
      title="点击修改选手名称"
    >
      {name}
    </button>
  );
}
