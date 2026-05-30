import { useMatch } from '../context/MatchContext';

export function ExportPreviewModal() {
  const {
    exportPreviewUrl,
    exportPreviewKind,
    closeExportPreview,
    downloadExportPreview,
    exporting,
  } = useMatch();

  if (!exportPreviewUrl) return null;

  const isQr = exportPreviewKind === 'qr';

  return (
    <div
      className="export-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isQr ? '二维码预览' : '导出图片预览'}
    >
      <div className="export-preview">
        <p className="export-preview__hint">
          {isQr ? '先预览二维码，再点击下方按钮下载' : '请长按图片保存到相册，或点击下方按钮下载'}
        </p>
        <div className="export-preview__scroll">
          <img
            src={exportPreviewUrl}
            alt={isQr ? '比赛二维码导出' : '比赛记分导出'}
            className="export-preview__img"
          />
        </div>
        <button
          type="button"
          className="export-preview__download"
          onClick={downloadExportPreview}
          disabled={exporting}
        >
          {exporting ? '下载中...' : isQr ? '下载二维码' : '下载图片'}
        </button>
        <button
          type="button"
          className="export-preview__close"
          onClick={closeExportPreview}
        >
          关闭
        </button>
      </div>
    </div>
  );
}
