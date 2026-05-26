import { useMatch } from '../context/MatchContext';

export function PageHeader() {
  const { isReadOnly, openNewMatchModal, openArchiveModal, openHistory } =
    useMatch();

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
        <button
          type="button"
          className="btn-text btn-text--danger"
          onClick={openArchiveModal}
          disabled={isReadOnly}
        >
          结束本场比赛
        </button>
      </div>
    </header>
  );
}
