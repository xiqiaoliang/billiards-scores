import { toPng } from 'html-to-image';

export type ExportPageImageResult =
  | { method: 'download' }
  | { method: 'preview'; dataUrl: string };

interface SavedStyle {
  el: HTMLElement;
  overflow: string;
  height: string;
  maxHeight: string;
  flex: string;
}

function collectOverflowChain(root: HTMLElement): HTMLElement[] {
  const nodes = new Set<HTMLElement>();
  nodes.add(root);

  let parent: HTMLElement | null = root.parentElement;
  while (parent) {
    if (
      parent.classList.contains('app') ||
      parent.classList.contains('scoring-shell') ||
      parent.classList.contains('export-capture-root') ||
      parent.classList.contains('scroll-content')
    ) {
      nodes.add(parent);
    }
    parent = parent.parentElement;
  }

  const scroll = root.querySelector<HTMLElement>('.scroll-content');
  if (scroll) nodes.add(scroll);

  return [...nodes];
}

function expandForCapture(root: HTMLElement): SavedStyle[] {
  const nodes = collectOverflowChain(root);
  const saved: SavedStyle[] = [];

  for (const el of nodes) {
    saved.push({
      el,
      overflow: el.style.overflow,
      height: el.style.height,
      maxHeight: el.style.maxHeight,
      flex: el.style.flex,
    });
    el.style.overflow = 'visible';
    el.style.height = 'auto';
    el.style.maxHeight = 'none';
    if (el.classList.contains('scroll-content')) {
      el.style.flex = 'none';
    }
  }

  return saved;
}

function restoreStyles(saved: SavedStyle[]) {
  for (const { el, overflow, height, maxHeight, flex } of saved) {
    el.style.overflow = overflow;
    el.style.height = height;
    el.style.maxHeight = maxHeight;
    el.style.flex = flex;
  }
}

interface SavedVisibility {
  el: HTMLElement;
  visibility: string;
}

function hideExportControls(root: HTMLElement): SavedVisibility[] {
  const hidden: SavedVisibility[] = [];
  root.querySelectorAll<HTMLElement>('[data-export-hide]').forEach((el) => {
    hidden.push({ el, visibility: el.style.visibility });
    el.style.visibility = 'hidden';
  });
  return hidden;
}

function restoreExportControls(hidden: SavedVisibility[]) {
  for (const { el, visibility } of hidden) {
    el.style.visibility = visibility;
  }
}

function needsPreviewFallback(): boolean {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isWeChat = /MicroMessenger/i.test(ua);
  return isIOS || isWeChat;
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

export async function exportPageImage(
  root: HTMLElement,
  filename: string,
): Promise<ExportPageImageResult> {
  const expanded = expandForCapture(root);
  const hiddenControls = hideExportControls(root);

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
    const dataUrl = await toPng(root, {
      cacheBust: true,
      pixelRatio,
      backgroundColor: '#ffffff',
    });

    if (needsPreviewFallback()) {
      return { method: 'preview', dataUrl };
    }

    const downloaded = await triggerDownload(dataUrl, filename);
    if (downloaded) {
      return { method: 'download' };
    }
    return { method: 'preview', dataUrl };
  } finally {
    restoreExportControls(hiddenControls);
    restoreStyles(expanded);
  }
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim();
}

export function buildMatchExportFilename(
  player1Name: string,
  player2Name: string,
  createdAt: number,
  player3Name?: string,
): string {
  const datePart = formatDateForFilename(createdAt);
  const names = player3Name
    ? `${player1Name}vs${player2Name}vs${player3Name}`
    : `${player1Name}vs${player2Name}`;
  const base = `台球记分-${names}-${datePart}.png`;
  return sanitizeFilename(base);
}

function formatDateForFilename(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}
