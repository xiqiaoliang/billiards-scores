import { useCallback } from 'react';
import { Card, Space, Tag, Typography } from 'antd';
import {
  PLAYER1_COLOR,
  PLAYER2_COLOR,
  PLAYER3_COLOR,
} from '../domain/constants';
import {
  buildComputedRoundOrders,
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
  order,
  isArchived,
}: {
  round: RoundRecord;
  match: MatchRecord;
  order: PlayerId[];
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
    <Card
      size="small"
      className={`rounded-2xl border-slate-200 shadow-sm ${isArchived ? 'opacity-70' : 'cursor-pointer active:bg-slate-50'}`}
      {...longPressHandlers}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Typography.Text strong>第 {round.roundNumber} 局</Typography.Text>
          {winnerLabel && winTag && (
            <Typography.Text style={{ color: winnerColor }}>
              {winnerLabel} · 净分{formatNetScore(roundNet)}
            </Typography.Text>
          )}
        </div>
        <Typography.Text className="text-right text-xs text-slate-500">
          {formatRoundTimeLine(round.startTime, round.endTime, round.durationMs)}
        </Typography.Text>
      </div>
      <Space className="mb-2 flex-wrap" size={[6, 6]}>
        {sortScoreTags(round.tags).map((tag) => {
          const name = getPlayerName(match, tag.player);
          const color = getPlayerColor(tag.player);
          return (
            <Tag
              key={tag.id}
              className="mr-0 rounded-full px-3 py-1"
              style={{ borderColor: color, color }}
            >
              {formatTagLabel(name, tag)}
            </Tag>
          );
        })}
      </Space>
      <div className="flex w-full flex-wrap gap-y-1 text-xs leading-5">
        {order.map((player) => (
          <Typography.Text
            key={player}
            className={`min-w-0 ${order.length === 3 && player === order[2] ? 'basis-full text-left' : 'basis-1/2'} ${player === order[0] ? 'pr-2 text-left' : player === order[1] ? 'pl-2 text-right' : ''}`}
            style={{ color: getPlayerColor(player) }}
          >
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
          </Typography.Text>
        ))}
      </div>
    </Card>
  );
}

export function RoundHistory({ match }: RoundHistoryProps) {
  const isArchived = match.status === 'archived';
  const rounds = [...match.rounds].sort((a, b) => b.roundNumber - a.roundNumber);
  const computedOrders = buildComputedRoundOrders(match);

  return (
    <section className={`px-4 py-3 ${isArchived ? 'opacity-70' : ''}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Typography.Title level={5} className="!m-0">
          逐局得分历史记录 {isArchived && <Tag color="default">已结束</Tag>}
        </Typography.Title>
        {!isArchived && rounds.length > 0 && (
          <Typography.Text className="text-xs text-slate-500">
            长按某一局可修改该局得分
          </Typography.Text>
        )}
      </div>
      {rounds.length === 0 ? (
        <Typography.Text className="block py-2 text-sm text-slate-500">
          暂无历史记录
        </Typography.Text>
      ) : (
        <div className="flex flex-col gap-3">
          {rounds.map((round) => (
            <RoundHistoryItem
              key={round.roundNumber}
              round={round}
              match={match}
              order={computedOrders[round.roundNumber] ?? getRoundOrder(round, match)}
              isArchived={isArchived}
            />
          ))}
        </div>
      )}
    </section>
  );
}
