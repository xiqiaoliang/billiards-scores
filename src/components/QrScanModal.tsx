import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button, Modal, Space, Typography } from 'antd';

interface QrScanModalProps {
  onScan: (text: string) => void;
  onClose: () => void;
}

export function QrScanModal({ onScan, onClose }: QrScanModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    const scannerId = 'qr-scanner-region';
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;
    scannedRef.current = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          onScan(decodedText);
        },
        () => {},
      )
      .catch(() => {
        setError('无法启动摄像头，请检查权限或使用导入图片');
      });

    return () => {
      scanner
        .stop()
        .catch(() => {})
        .finally(() => {
          scannerRef.current = null;
        });
    };
  }, [onScan]);

  return (
    <Modal
      open
      title="扫描二维码"
      onCancel={onClose}
      centered
      destroyOnClose
      footer={null}
      width={520}
    >
      <Space direction="vertical" className="w-full" size={12}>
        <Typography.Paragraph className="!mb-0 text-center text-sm text-slate-600">
          将二维码放入框内自动识别
        </Typography.Paragraph>
        <div id="qr-scanner-region" className="min-h-[320px] overflow-hidden rounded-xl bg-black" />
        {error && <Typography.Text type="danger">{error}</Typography.Text>}
        <Button block onClick={onClose}>
          关闭
        </Button>
      </Space>
    </Modal>
  );
}
