import { useEffect, useState } from 'react';
import { useMatch } from '../context/MatchContext';
import { Alert, Button, Modal, Space, Input, Typography } from 'antd';
import type { FocusEvent } from 'react';

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) {
    throw new Error('document.execCommand copy failed');
  }
}

export function QrErrorDetailModal() {
  const { qrErrorDetail, closeQrErrorDetail } = useMatch();
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    setCopyStatus('idle');
  }, [qrErrorDetail]);

  if (!qrErrorDetail) return null;

  const handleCopy = async () => {
    try {
      await copyText(qrErrorDetail);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  return (
    <Modal
      open
      title="二维码生成失败"
      onCancel={closeQrErrorDetail}
      centered
      destroyOnClose
      footer={null}
      width={520}
    >
      <Space direction="vertical" className="w-full" size={12}>
        <Typography.Paragraph className="!mb-0 text-sm leading-6 text-slate-600">
          下面是完整错误信息，可复制后发给开发排查。
        </Typography.Paragraph>
        <Input.TextArea
          value={qrErrorDetail}
          readOnly
          autoSize={{ minRows: 10, maxRows: 16 }}
          onFocus={(e: FocusEvent<HTMLTextAreaElement>) => e.currentTarget.select()}
        />
        {copyStatus === 'copied' && <Alert type="success" message="已复制" showIcon />}
        {copyStatus === 'failed' && (
          <Alert type="error" message="复制失败，请手动选择文本复制" showIcon />
        )}
        <Space className="w-full" size={8}>
          <Button block onClick={closeQrErrorDetail}>
            关闭
          </Button>
          <Button block type="primary" onClick={handleCopy}>
            复制错误信息
          </Button>
        </Space>
      </Space>
    </Modal>
  );
}
