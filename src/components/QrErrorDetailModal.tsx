import { useEffect, useState } from 'react';
import { useMatch } from '../context/MatchContext';

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
    <div
      className="qr-error-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="二维码生成错误详情"
    >
      <div className="qr-error">
        <h2 className="qr-error__title">二维码生成失败</h2>
        <p className="qr-error__hint">下面是完整错误信息，可复制后发给开发排查。</p>
        <textarea
          className="qr-error__detail"
          value={qrErrorDetail}
          readOnly
          rows={10}
          onFocus={(e) => e.currentTarget.select()}
        />
        {copyStatus === 'copied' && <p className="qr-error__status">已复制</p>}
        {copyStatus === 'failed' && <p className="qr-error__status qr-error__status--failed">复制失败，请手动选择文本复制</p>}
        <div className="qr-error__actions">
          <button type="button" className="qr-error__btn" onClick={closeQrErrorDetail}>
            关闭
          </button>
          <button
            type="button"
            className="qr-error__btn qr-error__btn--primary"
            onClick={handleCopy}
          >
            复制错误信息
          </button>
        </div>
      </div>
    </div>
  );
}
