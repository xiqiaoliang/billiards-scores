import { ConfirmModal } from './components/ConfirmModal';
import { ExportPreviewModal } from './components/ExportPreviewModal';
import { GlobalToast } from './components/GlobalToast';
import { MatchHistoryPage } from './components/MatchHistoryPage';
import { OverviewTable } from './components/OverviewTable';
import { PageHeader } from './components/PageHeader';
import { PendingTags } from './components/PendingTags';
import { ScoreRuleGuide } from './components/ScoreRuleGuide';
import { PlayerScoreBarList } from './components/PlayerScoreBarList';
import { WinnerAnalysis } from './components/WinnerAnalysis';
import { QrErrorDetailModal } from './components/QrErrorDetailModal';
import { RoundEditModal } from './components/RoundEditModal';
import { RoundHistory } from './components/RoundHistory';
import { SubmitSection } from './components/SubmitSection';
import { MatchProvider, useMatch } from './context/MatchContext';
import type { PlayerId } from './domain/types';
import { Spin, Typography } from 'antd';

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

  const isArchived = match.status === 'archived';
  const canReorderScoreCards =
    !isReadOnly && !isEditingRound && match.rounds.length === 0;

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <div
        ref={exportRootRef}
        className="export-capture-root flex flex-1 flex-col bg-white shadow-sm"
      >
        <PageHeader />
        <OverviewTable match={match} />
        {isArchived && <WinnerAnalysis match={match} />}
        <div className="scroll-content flex-1 overflow-y-auto pb-6">
          {!isArchived && (
            <>
              <PlayerScoreBarList
                players={displayPlayerOrder}
                canReorder={canReorderScoreCards}
                onReorder={(nextOrder) => {
                  void reorderPlayerOrder(nextOrder);
                }}
              />

              <section className="px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Typography.Title level={5} className="!mb-0">
                    本局待提交得分（点击标签可单独删除）
                  </Typography.Title>
                  <ScoreRuleGuide />
                </div>
                <PendingTags />
              </section>

              <SubmitSection />
            </>
          )}
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
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500">
        <Spin size="large" />
        <Typography.Text className="text-slate-500">加载中...</Typography.Text>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="flex min-h-dvh flex-col bg-slate-100">
        <MatchHistoryPage />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
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
