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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // ensure container element is mounted before constructing scanner
    let mounted = true;
    scannedRef.current = false;

    const startScanner = async () => {
      if (!mounted) return;
      const el = containerRef.current;
      if (!el) {
        setError('无法找到扫描区域');
        return;
      }

      const scanner = new Html5Qrcode(el.id);
      scannerRef.current = scanner;

      try {
        // try to pick a camera (preferred back camera) when available
        let cameraIdOrConfig: string | { facingMode: 'environment' } = { facingMode: 'environment' };
        try {
          // getCameras may fail on some browsers; guard it
          const getCamerasFn = (Html5Qrcode as any).getCameras;
          const devices = getCamerasFn ? await getCamerasFn() : [];
          if (devices && devices.length > 0) {
            // prefer cameras with "back"/"rear" in label or the last device
            const back = devices.find((d: any) => /back|rear|环境/i.test(d.label));
            cameraIdOrConfig = back ? back.id : devices[devices.length - 1].id;
          }
        } catch {
          // ignore and fall back to facingMode
        }

        await scanner.start(
          cameraIdOrConfig,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            onScan(decodedText);
          },
          () => {
            // ignore per-frame decode errors
          },
        );
      } catch (e: any) {
        console.error('二维码摄像头启动失败', e);
        setError(String(e?.message ?? e) || '无法启动摄像头，请检查权限或使用导入图片');
      }
    };

    // delay to next animation frame to ensure DOM is ready (Antd modal portal etc)
    const raf = requestAnimationFrame(() => void startScanner());

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
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
        <div
          id="qr-scanner-region"
          ref={containerRef}
          className="min-h-[320px] overflow-hidden rounded-xl bg-black"
        />
        {error && <Typography.Text type="danger">{error}</Typography.Text>}
        <Button block onClick={onClose}>
          关闭
        </Button>
      </Space>
    </Modal>
  );
}
