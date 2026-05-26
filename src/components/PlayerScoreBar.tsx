import {
  HEI_JIN_BUTTONS,
  LET_GAN_BUTTONS,
  PLAYER1_COLOR,
  PLAYER2_COLOR,
  REGULAR_BUTTONS,
  SCORE_LABELS,
} from '../domain/constants';
import { useMatch } from '../context/MatchContext';
import { hasGolden9Exclusive } from '../domain/validators';
import type { PlayerId, ScoreItemType } from '../domain/types';
import { PlayerNameEditor } from './PlayerNameEditor';

interface PlayerScoreBarProps {
  player: PlayerId;
}

export function PlayerScoreBar({ player }: PlayerScoreBarProps) {
  const {
    session,
    activeSession,
    tagFormReadOnly,
    isEditingRound,
    addScoreTag,
    addGolden9Tag,
    setLetGan,
    setHeiJin,
    setPlayerName,
  } = useMatch();
  const color = player === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
  const name = player === 1 ? session.player1Name : session.player2Name;
  const letGanChecked =
    player === 1 ? activeSession.letGan.player1 : activeSession.letGan.player2;
  const heiJinChecked =
    player === 1 ? activeSession.heiJin.player1 : activeSession.heiJin.player2;
  const canEditNames = !tagFormReadOnly && !isEditingRound;
  const golden9Locked = hasGolden9Exclusive(activeSession.pendingTags);
  const scoreButtonsDisabled = tagFormReadOnly || golden9Locked;
  const buttons: ScoreItemType[] = heiJinChecked
    ? HEI_JIN_BUTTONS
    : letGanChecked
      ? LET_GAN_BUTTONS
      : REGULAR_BUTTONS;

  return (
    <div className="player-score-bar">
      <div className="player-score-bar__head">
        <PlayerNameEditor
          name={name}
          color={color}
          editable={canEditNames}
          className="player-score-bar__name"
          onNameChange={(n) => setPlayerName(player, n)}
        />
        <label className="player-score-bar__letgan">
          <input
            type="checkbox"
            checked={letGanChecked}
            disabled={tagFormReadOnly}
            onChange={(e) => setLetGan(player, e.target.checked)}
          />
          让杆得分
        </label>
        <label className="player-score-bar__letgan">
          <input
            type="checkbox"
            checked={heiJinChecked}
            disabled={tagFormReadOnly}
            onChange={(e) => setHeiJin(player, e.target.checked)}
          />
          黑金
        </label>
        {!letGanChecked && (
          <button
            type="button"
            className="player-score-bar__golden9"
            disabled={tagFormReadOnly}
            onClick={() => addGolden9Tag(player)}
          >
            {SCORE_LABELS.golden_9}
          </button>
        )}
      </div>
      <div className="score-buttons">
        {buttons.map((type) => (
          <button
            key={type}
            type="button"
            className="score-btn"
            disabled={scoreButtonsDisabled}
            onClick={() => addScoreTag(player, type)}
          >
            {SCORE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
