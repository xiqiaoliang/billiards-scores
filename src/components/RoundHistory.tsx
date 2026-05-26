import { PLAYER1_COLOR, PLAYER2_COLOR } from '../domain/constants';
import {
  calcRoundWinnerNet,
  formatNetScore,
  formatPlayerRoundSummary,
  formatTagLabel,
  getRoundWinTag,
  getRoundWinnerLabel,
  sortScoreTags,
} from '../domain/scoring';
import type { MatchRecord, RoundRecord } from '../domain/types';
import { formatRoundTimeLine } from '../utils/formatTime';

interface RoundHistoryProps {
  match: MatchRecord;
}

export function RoundHistory({ match }: RoundHistoryProps) {
  const isArchived = match.status === 'archived';
  const rounds = [...match.rounds].sort((a, b) => b.roundNumber - a.roundNumber);

  const renderRoundHeader = (round: RoundRecord) => {
    const winTag = getRoundWinTag(round.tags);
    const winnerLabel = getRoundWinnerLabel(round.tags, match);
    const winnerColor =
      winTag?.player === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
    const roundNet =
      winTag != null ? calcRoundWinnerNet(round, winTag.player) : 0;

    return (
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
    );
  };

  return (
    <section
      className={`section round-history${isArchived ? ' archived' : ''}`}
    >
      <h2 className="section-title">
        逐局得分历史记录
        {isArchived && <span className="round-history__badge">已结束</span>}
      </h2>
      {rounds.length === 0 ? (
        <p className="round-history__empty">暂无历史记录</p>
      ) : (
        rounds.map((round) => (
          <div key={round.roundNumber} className="round-item">
            {renderRoundHeader(round)}
            <div className="round-item__tags">
              {sortScoreTags(round.tags).map((tag) => {
                const name =
                  tag.player === 1 ? match.player1Name : match.player2Name;
                const color =
                  tag.player === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
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
                {match.player1Name} {formatPlayerRoundSummary(round.tags, 1)}
              </span>
              <span style={{ color: PLAYER2_COLOR }}>
                {match.player2Name}{' '}
                {formatPlayerRoundSummary(round.tags, 2)}
              </span>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
