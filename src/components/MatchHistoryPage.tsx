import { useEffect, useRef, useState } from 'react';
import { calcMatchOverview } from '../domain/scoring';
import { useMatch } from '../context/MatchContext';
import { formatDateTime } from '../utils/formatTime';
import { ConfirmModal } from './ConfirmModal';
import { GlobalToast } from './GlobalToast';
import { ImportTextModal } from './ImportTextModal';
import { QrErrorDetailModal } from './QrErrorDetailModal';
import { QrScanModal } from './QrScanModal';

export function MatchHistoryPage() {
  const {
    historyMatches,
    historyLoading,
    match: currentMatch,
    closeHistory,
    loadMatchFromHistory,
    requestDeleteHistory,
    importMatchFromQrPayload,
    importMatchFromQrImage,
    importMatchFromQrText,
  } = useMatch();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scanOpen, setScanOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(historyMatches.map((m) => m.id));
      const next = [...prev].filter((id) => validIds.has(id));
      if (next.length === prev.size) return prev;
      return new Set(next);
    });
  }, [historyMatches]);

  const allSelected =
    historyMatches.length > 0 &&
    selectedIds.size === historyMatches.length;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await importMatchFromQrImage(file);
  };

  const handleScanResult = async (text: string) => {
    setScanOpen(false);
    await importMatchFromQrPayload(text);
  };

  const handlePasteImport = async (text: string) => {
    setPasteOpen(false);
    await importMatchFromQrText(text);
  };

  return (
    <div className="history-page">
      <header className="history-page__header">
        <button type="button" className="btn-text" onClick={closeHistory}>
          返回
        </button>
        <h1 className="history-page__title">历史比赛</h1>
        <div className="history-page__actions">
          <button
            type="button"
            className="btn-text"
            onClick={handleImportClick}
          >
            导入
          </button>
          <button
            type="button"
            className="btn-text"
            onClick={() => setPasteOpen(true)}
          >
            粘贴
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setScanOpen(true)}
            aria-label="扫码导入"
            title="扫码导入"
          >
            <svg
              className="btn-icon__svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M22 14h.01M22 18h.01" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.txt,text/plain"
            className="sr-only"
            onChange={handleFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </header>

      {historyMatches.length > 0 && !historyLoading && (
        <div className="history-toolbar">
          <label className="history-toolbar__select-all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => {
                if (allSelected) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(historyMatches.map((m) => m.id)));
                }
              }}
            />
            全选
          </label>
          <button
            type="button"
            className="btn-text btn-text--danger"
            disabled={selectedIds.size === 0}
            onClick={() => requestDeleteHistory([...selectedIds])}
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
                    onChange={() => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(m.id)) next.delete(m.id);
                        else next.add(m.id);
                        return next;
                      });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`选择 ${m.player1Name} vs ${m.player2Name}`}
                  />
                  <button
                    type="button"
                    className={`history-card${isCurrent ? ' history-card--active' : ''}`}
                    onClick={() => {
                      loadMatchFromHistory(m.id);
                      setSelectedIds(new Set());
                    }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      requestDeleteHistory([m.id]);
                    }}
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
      <QrErrorDetailModal />
      <GlobalToast />
      {scanOpen && (
        <QrScanModal
          onScan={handleScanResult}
          onClose={() => setScanOpen(false)}
        />
      )}
      {pasteOpen && (
        <ImportTextModal
          onImport={handlePasteImport}
          onClose={() => setPasteOpen(false)}
        />
      )}
    </div>
  );
}
