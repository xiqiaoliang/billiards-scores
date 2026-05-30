import {
  PLAYER1_COLOR,
  PLAYER2_COLOR,
  PLAYER3_COLOR,
} from '../domain/constants';
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

function getPlayerName(match: MatchRecord, session: { player1Name: string; player2Name: string; player3Name: string }, player: PlayerId): string {
  if (player === 1) return session.player1Name || match.player1Name;
  if (player === 2) return session.player2Name || match.player2Name;
  return session.player3Name || match.player3Name || '选手3';
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

  return (
    <div className="overview-fixed">
      <div className="overview-fixed__inner">
      <table className="overview-table">
        <thead>
          <tr>
            <th className="col-player">选手</th>
            <th>犯</th>
            <th>分</th>
            <th>普</th>
            <th>金</th>
            <th>大</th>
            <th>额</th>
            <th>总</th>
            <th>净</th>
          </tr>
        </thead>
        <tbody>
          {playersInOrder.map((player) => {
            const stats = statsByPlayer[player];
            return (
              <tr key={player}>
                <td className="col-player">
                  <PlayerNameEditor
                    name={getPlayerName(match, session, player)}
                    color={getPlayerColor(player)}
                    editable={!isReadOnly}
                    className="overview-player-name"
                    onNameChange={(n) => setPlayerName(player, n)}
                  />
                </td>
                <td>{stats.foulCount}</td>
                <td>{stats.splitCount}</td>
                <td>{stats.normalWinCount}</td>
                <td>{stats.smallGoldCount}</td>
                <td>{stats.bigGoldCount}</td>
                <td>{stats.extraScore}</td>
                <td>{100 + stats.totalScore}</td>
                <td>{formatNetScore(stats.totalScore)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
