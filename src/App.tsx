import { ConfirmModal } from './components/ConfirmModal';
import { MatchHistoryPage } from './components/MatchHistoryPage';
import { OverviewTable } from './components/OverviewTable';
import { PageHeader } from './components/PageHeader';
import { PendingTags } from './components/PendingTags';
import { PlayerScoreBar } from './components/PlayerScoreBar';
import { RoundHistory } from './components/RoundHistory';
import { SubmitSection } from './components/SubmitSection';
import { MatchProvider, useMatch } from './context/MatchContext';

function ScoringView() {
  const { match } = useMatch();
  if (!match) return null;

  return (
    <div className="scoring-shell">
      <PageHeader />
      <OverviewTable match={match} />
      <div className="scroll-content">
        <section className="section">
          <h2 className="section-title">本局选手记分选择</h2>
          <PlayerScoreBar player={1} />
          <PlayerScoreBar player={2} />
        </section>

        <section className="section">
          <h2 className="section-title">
            本局待提交得分（点击标签可单独删除）
          </h2>
          <PendingTags />
        </section>

        <SubmitSection />
        <RoundHistory match={match} />
      </div>
      <ConfirmModal />
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
