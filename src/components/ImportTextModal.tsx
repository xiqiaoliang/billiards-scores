import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button, Modal, Space, Input, Typography } from 'antd';

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
    <Modal open title="粘贴导入数据" onCancel={onClose} centered destroyOnClose footer={null}>
      <Space direction="vertical" className="w-full" size={12}>
        <Typography.Paragraph className="!mb-0 text-sm leading-6 text-slate-600">
          粘贴以 bs:v3:/bs:v2: 开头的比赛数据（从二维码解码软件复制）
        </Typography.Paragraph>
        <Input.TextArea
          value={text}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          placeholder="bs:v3:..."
          autoSize={{ minRows: 6, maxRows: 10 }}
          autoFocus
        />
        <Space className="w-full" size={8}>
          <Button block onClick={onClose}>
            取消
          </Button>
          <Button block type="primary" onClick={handleSubmit} disabled={!text.trim()}>
            导入
          </Button>
        </Space>
      </Space>
    </Modal>
  );
}
