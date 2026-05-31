import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Input, Typography } from 'antd';
import type { InputRef } from 'antd';
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
  const inputRef = useRef<InputRef>(null);

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
      <Typography.Text className={className} style={{ color }}>
        {name}
      </Typography.Text>
    );
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        className={className}
        style={{ color }}
        value={draft}
        maxLength={12}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        onBlur={commit}
        onPressEnter={commit}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Escape') {
            setDraft(name);
            setEditing(false);
          }
        }}
        variant="borderless"
        size="small"
      />
    );
  }

  return (
    <Typography.Text
      className={className}
      style={{ color }}
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setEditing(true);
        }
      }}
      title="点击修改选手名称"
    >
      {name}
    </Typography.Text>
  );
}
