import { useCallback } from 'react';
import { PLAYER1_COLOR, PLAYER2_COLOR } from '../domain/constants';
import {
  calcRoundWinnerNet,
  formatNetScore,
  formatPlayerRoundSummary,
  formatTagLabel,
  getRoundWinTag,
  getRoundWinnerLabel,
  getRoundWinnerPlayer,
  sortScoreTags,
} from '../domain/scoring';
import type { MatchRecord, RoundRecord } from '../domain/types';
import { useMatch } from '../context/MatchContext';
import { useLongPress } from '../hooks/useLongPress';
import { formatRoundTimeLine } from '../utils/formatTime';

interface RoundHistoryProps {
  match: MatchRecord;
}

function RoundHistoryItem({
  round,
  match,
  isArchived,
}: {
  round: RoundRecord;
  match: MatchRecord;
  isArchived: boolean;
}) {
  const { beginEditRound } = useMatch();

  const handleEdit = useCallback(() => {
    if (!isArchived) {
      beginEditRound(round.roundNumber);
    }
  }, [beginEditRound, isArchived, round.roundNumber]);

  const longPressHandlers = useLongPress(handleEdit, { disabled: isArchived });

  const winTag = getRoundWinTag(round.tags);
  const winnerPlayer = getRoundWinnerPlayer(round.tags);
  const winnerLabel = getRoundWinnerLabel(round.tags, match);
  const winnerColor =
    winnerPlayer === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
  const roundNet =
    winnerPlayer != null ? calcRoundWinnerNet(round, winnerPlayer) : 0;

  const p1Summary = formatPlayerRoundSummary(round.tags, 1);
  const p2Summary = formatPlayerRoundSummary(round.tags, 2);

  return (
    <div
      className={`round-item${isArchived ? '' : ' round-item--editable'}`}
      {...longPressHandlers}
    >
      <div className="round-item__header">
        <div className="round-item__header-left">
          <span className="round-item__round-no">第 {round.roundNumber} 局</span>
          {winnerLabel && winTag && (
            <span
              className="round-item__header-info"
              style={{ color: winnerColor }}
            >
              {winnerLabel} · 净分{formatNetScore(roundNet)}
            </span>
          )}
        </div>
        <span className="round-item__header-time">
          {formatRoundTimeLine(
            round.startTime,
            round.endTime,
            round.durationMs,
          )}
        </span>
      </div>
      <div className="round-item__tags">
        {sortScoreTags(round.tags).map((tag) => {
          const name =
            tag.player === 1 ? match.player1Name : match.player2Name;
          const color = tag.player === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
          return (
            <span
              key={tag.id}
              className="pending-tag pending-tag--readonly"
              style={{ borderColor: color, color }}
            >
              {formatTagLabel(name, tag)}
            </span>
          );
        })}
      </div>
      <div className="round-item__stats">
        <span style={{ color: PLAYER1_COLOR }}>
          {match.player1Name} {p1Summary}
        </span>
        <span style={{ color: PLAYER2_COLOR }}>
          {match.player2Name} {p2Summary}
        </span>
      </div>
    </div>
  );
}

export function RoundHistory({ match }: RoundHistoryProps) {
  const isArchived = match.status === 'archived';
  const rounds = [...match.rounds].sort((a, b) => b.roundNumber - a.roundNumber);

  return (
    <section
      className={`section round-history${isArchived ? ' archived' : ''}`}
    >
      <h2 className="section-title">
        逐局得分历史记录
        {isArchived && <span className="round-history__badge">已结束</span>}
      </h2>
      {!isArchived && rounds.length > 0 && (
        <p className="round-history__tip">长按某一局可修改该局得分</p>
      )}
      {rounds.length === 0 ? (
        <p className="round-history__empty">暂无历史记录</p>
      ) : (
        rounds.map((round) => (
          <RoundHistoryItem
            key={round.roundNumber}
            round={round}
            match={match}
            isArchived={isArchived}
          />
        ))
      )}
    </section>
  );
}
