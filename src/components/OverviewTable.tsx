import { PLAYER1_COLOR, PLAYER2_COLOR } from '../domain/constants';
import { calcMatchOverview, formatNetScore } from '../domain/scoring';
import type { MatchRecord } from '../domain/types';
import { useMatch } from '../context/MatchContext';
import { PlayerNameEditor } from './PlayerNameEditor';

interface OverviewTableProps {
  match: MatchRecord;
}

export function OverviewTable({ match }: OverviewTableProps) {
  const { session, isReadOnly, setPlayerName } = useMatch();
  const overview = calcMatchOverview(match);
  const { player1, player2, netScore } = overview;

  const rows = [
    {
      player: 1 as const,
      name: session.player1Name,
      color: PLAYER1_COLOR,
      stats: player1,
    },
    {
      player: 2 as const,
      name: session.player2Name,
      color: PLAYER2_COLOR,
      stats: player2,
    },
  ];

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
          {rows.map((row) => (
            <tr key={row.player}>
              <td className="col-player">
                <PlayerNameEditor
                  name={row.name}
                  color={row.color}
                  editable={!isReadOnly}
                  className="overview-player-name"
                  onNameChange={(n) => setPlayerName(row.player, n)}
                />
              </td>
              <td>{row.stats.foulCount}</td>
              <td>{row.stats.splitCount}</td>
              <td>{row.stats.normalWinCount}</td>
              <td>{row.stats.smallGoldCount}</td>
              <td>{row.stats.bigGoldCount}</td>
              <td>{row.stats.extraScore}</td>
              <td>{row.stats.totalScore}</td>
              <td>
                {formatNetScore(
                  row.player === 1 ? netScore : -netScore,
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
