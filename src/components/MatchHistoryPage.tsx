import { useEffect, useMemo, useState } from 'react';
import { calcMatchOverview } from '../domain/scoring';
import { useMatch } from '../context/MatchContext';
import { formatDateTime } from '../utils/formatTime';
import { ConfirmModal } from './ConfirmModal';

export function MatchHistoryPage() {
  const {
    historyMatches,
    historyLoading,
    match: currentMatch,
    closeHistory,
    loadMatchFromHistory,
    requestDeleteHistory,
  } = useMatch();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(historyMatches.map((m) => m.id));
      const next = [...prev].filter((id) => validIds.has(id));
      if (next.length === prev.size) return prev;
      return new Set(next);
    });
  }, [historyMatches]);

  const allSelected = useMemo(
    () =>
      historyMatches.length > 0 &&
      selectedIds.size === historyMatches.length,
    [historyMatches.length, selectedIds.size],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(historyMatches.map((m) => m.id)));
    }
  };

  const handleDeleteOne = (id: string, e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    requestDeleteHistory([id]);
  };

  const handleBatchDelete = () => {
    requestDeleteHistory([...selectedIds]);
  };

  const handleOpen = (id: string) => {
    loadMatchFromHistory(id);
    setSelectedIds(new Set());
  };

  return (
    <div className="history-page">
      <header className="history-page__header">
        <button type="button" className="btn-text" onClick={closeHistory}>
          返回
        </button>
        <h1 className="history-page__title">历史比赛</h1>
        <span className="history-page__spacer" />
      </header>

      {historyMatches.length > 0 && !historyLoading && (
        <div className="history-toolbar">
          <label className="history-toolbar__select-all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
            />
            全选
          </label>
          <button
            type="button"
            className="btn-text btn-text--danger"
            disabled={selectedIds.size === 0}
            onClick={handleBatchDelete}
          >
            批量删除{selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
        </div>
      )}

      <div className="history-page__content">
        {historyLoading ? (
          <p className="history-page__empty">加载中...</p>
        ) : historyMatches.length === 0 ? (
          <p className="history-page__empty">暂无历史比赛记录</p>
        ) : (
          <ul className="history-list">
            {historyMatches.map((m) => {
              const overview = calcMatchOverview(m);
              const isCurrent = currentMatch?.id === m.id;
              const isSelected = selectedIds.has(m.id);
              const statusLabel =
                m.status === 'archived' ? '已封存' : '进行中';

              return (
                <li key={m.id} className="history-list__item">
                  <input
                    type="checkbox"
                    className="history-card__checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(m.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`选择 ${m.player1Name} vs ${m.player2Name}`}
                  />
                  <button
                    type="button"
                    className={`history-card${isCurrent ? ' history-card--active' : ''}`}
                    onClick={() => handleOpen(m.id)}
                  >
                    <div className="history-card__top">
                      <span className="history-card__players">
                        {m.player1Name} vs {m.player2Name}
                      </span>
                      <span
                        className={`history-card__status history-card__status--${m.status}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="history-card__meta">
                      {formatDateTime(m.createdAt)} · 共 {m.rounds.length} 局
                    </div>
                    <div className="history-card__scores">
                      <span style={{ color: 'var(--color-player1)' }}>
                        {m.player1Name} {overview.player1.totalScore}
                      </span>
                      <span className="history-card__vs">
                        净分{' '}
                        {overview.netScore > 0
                          ? `+${overview.netScore}`
                          : overview.netScore}
                      </span>
                      <span style={{ color: 'var(--color-player2)' }}>
                        {m.player2Name} {overview.player2.totalScore}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="history-card__delete"
                    onClick={(e) => handleDeleteOne(m.id, e)}
                    aria-label="删除"
                  >
                    删除
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ConfirmModal />
    </div>
  );
}
