import { useMatch } from '../context/MatchContext';

export function ExportPreviewModal() {
  const { exportPreviewUrl, closeExportPreview } = useMatch();

  if (!exportPreviewUrl) return null;

  return (
    <div
      className="export-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="导出图片预览"
    >
      <div className="export-preview">
        <p className="export-preview__hint">长按图片保存到相册</p>
        <div className="export-preview__scroll">
          <img
            src={exportPreviewUrl}
            alt="比赛记分导出"
            className="export-preview__img"
          />
        </div>
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
