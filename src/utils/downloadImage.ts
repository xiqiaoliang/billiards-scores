export function needsPreviewFallback(): boolean {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isWeChat = /MicroMessenger/i.test(ua);
  return isIOS || isWeChat;
}

export type DownloadImageResult =
  | { method: 'download' }
  | { method: 'preview'; dataUrl: string };

export async function downloadOrPreviewImage(
  dataUrl: string,
  filename: string,
): Promise<DownloadImageResult> {
  if (needsPreviewFallback()) {
    return { method: 'preview', dataUrl };
  }

  const downloaded = await triggerDownload(dataUrl, filename);
  if (downloaded) {
    return { method: 'download' };
  }
  return { method: 'preview', dataUrl };
}

async function triggerDownload(dataUrl: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
