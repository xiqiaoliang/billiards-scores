import { useMatch } from '../context/MatchContext';

export function ExportPreviewModal() {
  const { exportPreviewUrl, closeExportPreview, downloadExportPreview, exporting } = useMatch();

  if (!exportPreviewUrl) return null;

  return (
    <div
      className="export-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="导出图片预览"
    >
      <div className="export-preview">
        <p className="export-preview__hint">先预览二维码，再点击下方按钮下载</p>
        <div className="export-preview__scroll">
          <img
            src={exportPreviewUrl}
            alt="比赛记分导出"
            className="export-preview__img"
          />
        </div>
        <button
          type="button"
          className="export-preview__download"
          onClick={downloadExportPreview}
          disabled={exporting}
        >
          {exporting ? '下载中...' : '下载二维码'}
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
