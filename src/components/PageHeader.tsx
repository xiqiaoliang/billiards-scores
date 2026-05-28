import { useMatch } from '../context/MatchContext';

export function PageHeader() {
  const {
    isReadOnly,
    exporting,
    openNewMatchModal,
    openArchiveModal,
    openHistory,
    exportMatchAsImage,
  } = useMatch();

  return (
    <header className="page-header">
      <div className="page-header__actions page-header__actions--left">
        <button type="button" className="btn-text" onClick={() => openHistory()}>
          历史
        </button>
        <button type="button" className="btn-text" onClick={openNewMatchModal}>
          新比赛
        </button>
      </div>
      <h1 className="page-header__title">台球追分记分器</h1>
      <div className="page-header__actions">
        {isReadOnly ? (
          <button
            type="button"
            className="btn-text"
            data-export-hide
            onClick={() => exportMatchAsImage()}
            disabled={exporting}
          >
            {exporting ? '导出中…' : '导出'}
          </button>
        ) : (
          <button
            type="button"
            className="btn-text btn-text--danger"
            onClick={openArchiveModal}
          >
            结束本场比赛
          </button>
        )}
      </div>
    </header>
  );
}
