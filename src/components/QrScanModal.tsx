import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

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
    <div
      className="qr-scan-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="扫描二维码"
    >
      <div className="qr-scan">
        <p className="qr-scan__hint">将二维码放入框内自动识别</p>
        <div id="qr-scanner-region" className="qr-scan__region" />
        {error && <p className="qr-scan__error">{error}</p>}
        <button type="button" className="qr-scan__close" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
