import { useCallback } from 'react';
import {
  PLAYER1_COLOR,
  PLAYER2_COLOR,
  PLAYER3_COLOR,
} from '../domain/constants';
import {
  calcRoundWinnerNet,
  formatNetScore,
  formatPlayerRoundSummary,
  formatTagLabel,
  getRoundWinTag,
  getRoundWinnerLabel,
  getRoundWinnerPlayer,
  getPlayerName,
  sortScoreTags,
} from '../domain/scoring';
import type { MatchRecord, PlayerId, RoundRecord } from '../domain/types';
import { useMatch } from '../context/MatchContext';
import { useLongPress } from '../hooks/useLongPress';
import { formatRoundTimeLine } from '../utils/formatTime';

interface RoundHistoryProps {
  match: MatchRecord;
}

function getPlayerColor(player: PlayerId): string {
  if (player === 1) return PLAYER1_COLOR;
  if (player === 2) return PLAYER2_COLOR;
  return PLAYER3_COLOR;
}

function getRoundOrder(round: RoundRecord, match: MatchRecord): PlayerId[] {
  if (round.playerOrder && round.playerOrder.length > 0) {
    return round.playerOrder;
  }
  return match.mode === 'trio' ? [1, 2, 3] : [1, 2];
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

  const order = getRoundOrder(round, match);
  const winTag = getRoundWinTag(round.tags);
  const winnerPlayer = getRoundWinnerPlayer(round.tags, match.mode, order);
  const winnerLabel = getRoundWinnerLabel(round.tags, match, order);
  const winnerColor =
    winnerPlayer === 1
      ? PLAYER1_COLOR
      : winnerPlayer === 2
        ? PLAYER2_COLOR
        : PLAYER3_COLOR;
  const roundNet =
    winnerPlayer != null ? calcRoundWinnerNet(round, winnerPlayer) : 0;

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
          const name = getPlayerName(match, tag.player);
          const color = getPlayerColor(tag.player);
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
      <div className="round-item__stats round-item__stats--stacked">
        {order.map((player) => (
          <span key={player} style={{ color: getPlayerColor(player) }}>
            {getPlayerName(match, player)}{' '}
            {formatPlayerRoundSummary(round.tags, player, {
              mode: match.mode,
              playerOrder: order,
              playerNames: {
                1: match.player1Name,
                2: match.player2Name,
                3: match.player3Name ?? '选手3',
              },
            })}
          </span>
        ))}
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
      <div className="round-history__header">
        <h2 className="section-title">
          逐局得分历史记录
          {isArchived && <span className="round-history__badge">已结束</span>}
        </h2>
        {!isArchived && rounds.length > 0 && (
          <p className="round-history__tip">长按某一局可修改该局得分</p>
        )}
      </div>
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
