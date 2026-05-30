import { ConfirmModal } from './components/ConfirmModal';
import { ExportPreviewModal } from './components/ExportPreviewModal';
import { GlobalToast } from './components/GlobalToast';
import { MatchHistoryPage } from './components/MatchHistoryPage';
import { OverviewTable } from './components/OverviewTable';
import { PageHeader } from './components/PageHeader';
import { PendingTags } from './components/PendingTags';
import { PlayerScoreBarList } from './components/PlayerScoreBarList';
import { QrErrorDetailModal } from './components/QrErrorDetailModal';
import { RoundEditModal } from './components/RoundEditModal';
import { RoundHistory } from './components/RoundHistory';
import { SubmitSection } from './components/SubmitSection';
import { MatchProvider, useMatch } from './context/MatchContext';
import type { PlayerId } from './domain/types';

function ScoringView() {
  const matchApi = useMatch() as ReturnType<typeof useMatch> & {
    reorderPlayerOrder: (order: PlayerId[]) => Promise<void>;
  };
  const {
    match,
    exportRootRef,
    displayPlayerOrder,
    isReadOnly,
    isEditingRound,
    reorderPlayerOrder,
  } = matchApi;
  if (!match) return null;

  const canReorderScoreCards =
    !isReadOnly && !isEditingRound && match.rounds.length === 0;

  return (
    <div className="scoring-shell">
      <div ref={exportRootRef} className="export-capture-root">
        <PageHeader />
        <OverviewTable match={match} />
        <div className="scroll-content">
        <PlayerScoreBarList
          players={displayPlayerOrder}
          canReorder={canReorderScoreCards}
          onReorder={(nextOrder) => {
            void reorderPlayerOrder(nextOrder);
          }}
        />

        <section className="section">
          <h2 className="section-title">
            本局待提交得分（点击标签可单独删除）
          </h2>
          <PendingTags />
        </section>

        <SubmitSection />
        <RoundHistory match={match} />
        </div>
      </div>
      <ConfirmModal />
      <ExportPreviewModal />
      <QrErrorDetailModal />
      <GlobalToast />
      <RoundEditModal />
    </div>
  );
}

function AppContent() {
  const { loading, match, view } = useMatch();

  if (loading || !match) {
    return <div className="app-loading">加载中...</div>;
  }

  if (view === 'history') {
    return (
      <div className="app">
        <MatchHistoryPage />
      </div>
    );
  }

  return (
    <div className="app">
      <ScoringView />
    </div>
  );
}

export default function App() {
  return (
    <MatchProvider>
      <AppContent />
    </MatchProvider>
  );
}
