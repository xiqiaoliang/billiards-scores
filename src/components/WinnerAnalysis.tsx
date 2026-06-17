import { Card, Tag, Typography } from 'antd';
import type { MatchRecord, PlayerId } from '../domain/types';
import {
  calcWinnerAnalysisStats,
} from '../domain/scoring';
import { useMatch } from '../context/MatchContext';

interface WinnerAnalysisProps {
  match: MatchRecord;
}

function getPlayers(match: MatchRecord): PlayerId[] {
  return match.mode === 'trio' ? [1, 2, 3] : [1, 2];
}

function getDisplayName(match: MatchRecord, player: PlayerId): string {
  if (player === 1) return match.player1Name;
  if (player === 2) return match.player2Name;
  return match.player3Name ?? '选手3';
}

export function WinnerAnalysis({ match }: WinnerAnalysisProps) {
  const { displayPlayerOrder } = useMatch();
  const players = getPlayers(match);
  const orderedPlayers = [...displayPlayerOrder.filter((player) => players.includes(player))];
  for (const player of players) {
    if (!orderedPlayers.includes(player)) {
      orderedPlayers.push(player);
    }
  }
  const statsByPlayer = calcWinnerAnalysisStats(match);

  return (
    <section className="px-4 py-3">
      <Card size="small" className="rounded-2xl border-slate-200 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Typography.Title level={5} className="!m-0">
            获胜信息分析
          </Typography.Title>
          <Tag color="blue">已结束比赛</Tag>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          {orderedPlayers.map((player) => {
            const stats = statsByPlayer[player];
            return (
              <div
                key={player}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
              >
                <Typography.Text strong>{getDisplayName(match, player)}</Typography.Text>
                <Typography.Text>
                  获胜 {stats.winCount} 局；对方犯规 {stats.upstreamFoulWinCount} 局；错失 {stats.upstreamFoulNotWinCount} 局
                </Typography.Text>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}