import { useMatch } from '../context/MatchContext';
import { PendingTags } from './PendingTags';
import { PlayerScoreBar } from './PlayerScoreBar';
import { SubmitSection } from './SubmitSection';

export function RoundEditModal() {
  const { editingRoundNumber, cancelEditRound, displayPlayerOrder } = useMatch();

  if (editingRoundNumber == null) return null;

  return (
    <div className="round-edit-overlay" role="dialog" aria-modal="true">
      <div className="round-edit-sheet">
        <header className="round-edit-sheet__header">
          <button
            type="button"
            className="btn-text"
            onClick={cancelEditRound}
          >
            取消
          </button>
          <h3 className="round-edit-sheet__title">编辑第 {editingRoundNumber} 局</h3>
          <span className="round-edit-sheet__spacer" />
        </header>
        <div className="round-edit-sheet__body">
          <p className="round-edit-sheet__hint">
            修改计分标签后点击保存，本局时间不变。
          </p>
          {displayPlayerOrder.map((player) => (
            <PlayerScoreBar key={player} player={player} />
          ))}
          <h4 className="round-edit-sheet__subtitle">本局得分（点击标签可删除）</h4>
          <PendingTags />
          <SubmitSection />
        </div>
      </div>
    </div>
  );
}
