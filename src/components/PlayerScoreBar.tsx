import {
  LET_GAN_BUTTONS,
  PLAYER1_COLOR,
  PLAYER2_COLOR,
  REGULAR_BUTTONS,
  SCORE_LABELS,
} from '../domain/constants';
import { useMatch } from '../context/MatchContext';
import type { PlayerId, ScoreItemType } from '../domain/types';
import { PlayerNameEditor } from './PlayerNameEditor';

interface PlayerScoreBarProps {
  player: PlayerId;
}

export function PlayerScoreBar({ player }: PlayerScoreBarProps) {
  const { session, isReadOnly, addScoreTag, setLetGan, setPlayerName } =
    useMatch();
  const color = player === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
  const name = player === 1 ? session.player1Name : session.player2Name;
  const letGanChecked =
    player === 1 ? session.letGan.player1 : session.letGan.player2;
  const buttons: ScoreItemType[] = letGanChecked
    ? LET_GAN_BUTTONS
    : REGULAR_BUTTONS;

  return (
    <div className="player-score-bar">
      <div className="player-score-bar__head">
        <PlayerNameEditor
          name={name}
          color={color}
          editable={!isReadOnly}
          className="player-score-bar__name"
          onNameChange={(n) => setPlayerName(player, n)}
        />
        <label className="player-score-bar__letgan">
          <input
            type="checkbox"
            checked={letGanChecked}
            disabled={isReadOnly}
            onChange={(e) => setLetGan(player, e.target.checked)}
          />
          让杆得分
        </label>
      </div>
      <div className="score-buttons">
        {buttons.map((type) => (
          <button
            key={type}
            type="button"
            className="score-btn"
            disabled={isReadOnly}
            onClick={() => addScoreTag(player, type)}
          >
            {SCORE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
