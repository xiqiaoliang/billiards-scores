import { useState } from 'react';

interface ImportTextModalProps {
  onImport: (text: string) => void;
  onClose: () => void;
}

export function ImportTextModal({ onImport, onClose }: ImportTextModalProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onImport(trimmed);
  };

  return (
    <div
      className="import-text-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="粘贴导入数据"
    >
      <div className="import-text">
        <p className="import-text__hint">
          粘贴以 bs:v1: 开头的比赛数据（从二维码解码软件复制）
        </p>
        <textarea
          className="import-text__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="bs:v1:..."
          rows={6}
          autoFocus
        />
        <div className="import-text__actions">
          <button type="button" className="import-text__btn" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="import-text__btn import-text__btn--primary"
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            导入
          </button>
        </div>
      </div>
    </div>
  );
}
