import {
  PLAYER1_COLOR,
  PLAYER2_COLOR,
  PLAYER3_COLOR,
} from '../domain/constants';
import { Table } from 'antd';
import { calcMatchOverview, formatNetScore } from '../domain/scoring';
import type { MatchRecord, PlayerId, PlayerOverviewStats } from '../domain/types';
import { useMatch } from '../context/MatchContext';
import { PlayerNameEditor } from './PlayerNameEditor';

interface OverviewTableProps {
  match: MatchRecord;
}

function getPlayerColor(player: PlayerId): string {
  if (player === 1) return PLAYER1_COLOR;
  if (player === 2) return PLAYER2_COLOR;
  return PLAYER3_COLOR;
}

function getOverviewPlayerOrder(
  match: MatchRecord,
  fallbackOrder: PlayerId[],
): PlayerId[] {
  const expected: PlayerId[] = match.mode === 'trio' ? [1, 2, 3] : [1, 2];
  const firstRound = [...match.rounds].sort((a, b) => a.roundNumber - b.roundNumber)[0];
  const base =
    firstRound?.playerOrder && firstRound.playerOrder.length > 0
      ? firstRound.playerOrder
      : fallbackOrder;

  const ordered = base.filter((p): p is PlayerId => expected.includes(p));
  for (const player of expected) {
    if (!ordered.includes(player)) {
      ordered.push(player);
    }
  }
  return ordered;
}

export function OverviewTable({ match }: OverviewTableProps) {
  const { session, isReadOnly, setPlayerName, displayPlayerOrder } = useMatch();
  const overview = calcMatchOverview(match);

  const statsByPlayer: Record<PlayerId, PlayerOverviewStats> = {
    1: overview.player1,
    2: overview.player2,
    3: overview.player3 ?? {
      foulCount: 0,
      splitCount: 0,
      normalWinCount: 0,
      smallGoldCount: 0,
      bigGoldCount: 0,
      extraScore: 0,
      totalScore: 0,
    },
  };

  const playersInOrder = getOverviewPlayerOrder(match, displayPlayerOrder);

  const columns = [
    {
      title: '选手',
      dataIndex: 'player',
      key: 'player',
      width: 68,
      align: 'center',
      onCell: () => ({
        style: {
          padding: 0,
          textAlign: 'center',
          verticalAlign: 'middle',
        },
      }),
      render: (_: unknown, record: { player: PlayerId; color: string; name: string }) => (
        <div className="flex h-full w-full items-center justify-center">
          <PlayerNameEditor
            name={record.name}
            color={record.color}
            editable={!isReadOnly}
            className="block w-full truncate text-center text-sm font-semibold leading-5"
            onNameChange={(n) => setPlayerName(record.player, n)}
          />
        </div>
      ),
    },
    { title: '犯', dataIndex: 'foulCount', key: 'foulCount', width: 36, align: 'center' },
    { title: '分', dataIndex: 'splitCount', key: 'splitCount', width: 36, align: 'center' },
    { title: '普', dataIndex: 'normalWinCount', key: 'normalWinCount', width: 36, align: 'center' },
    { title: '金', dataIndex: 'smallGoldCount', key: 'smallGoldCount', width: 36, align: 'center' },
    { title: '大', dataIndex: 'bigGoldCount', key: 'bigGoldCount', width: 36, align: 'center' },
    { title: '额', dataIndex: 'extraScore', key: 'extraScore', width: 36, align: 'center' },
    {
      title: '总',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 44,
      align: 'center',
      render: (score: number) => 100 + score,
    },
    {
      title: '净',
      dataIndex: 'netScore',
      key: 'netScore',
      width: 44,
      align: 'center',
      render: (score: number) => formatNetScore(score),
    },
  ];

  const dataSource = playersInOrder.map((player) => {
    const stats = statsByPlayer[player];
    return {
      key: player,
      player,
      name:
        player === 1
          ? session.player1Name || match.player1Name
          : player === 2
            ? session.player2Name || match.player2Name
            : session.player3Name || match.player3Name || '选手3',
      color: getPlayerColor(player),
      ...stats,
      netScore: stats.totalScore,
    };
  });

  return (
    <div className="overview-table border-b border-slate-200 bg-white px-2 py-2 shadow-sm">
      <Table
        className="overflow-hidden rounded-xl"
        tableLayout="fixed"
        pagination={false}
        size="small"
        bordered
        columns={columns as never}
        dataSource={dataSource}
      />
    </div>
  );
}
