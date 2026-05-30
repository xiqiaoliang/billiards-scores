import {
  HEI_JIN_BUTTONS,
  PLAYER1_COLOR,
  PLAYER2_COLOR,
  PLAYER3_COLOR,
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

const LET_GAN_ALL_BUTTONS: ScoreItemType[] = [
  'let_foul',
  'split',
  'normal_win',
  'small_gold',
];
const LET_GAN_HEI_JIN_BUTTONS: ScoreItemType[] = ['normal_win', 'small_gold'];

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
  const color =
    player === 1 ? PLAYER1_COLOR : player === 2 ? PLAYER2_COLOR : PLAYER3_COLOR;
  const name =
    player === 1
      ? session.player1Name
      : player === 2
        ? session.player2Name
        : session.player3Name;
  const letGanChecked =
    player === 1
      ? activeSession.letGan.player1
      : player === 2
        ? activeSession.letGan.player2
        : activeSession.letGan.player3;
  const heiJinChecked =
    player === 1
      ? activeSession.heiJin.player1
      : player === 2
        ? activeSession.heiJin.player2
        : activeSession.heiJin.player3;
  const canEditNames = !tagFormReadOnly && !isEditingRound;
  const golden9Locked = hasGolden9Exclusive(activeSession.pendingTags);
  const scoreButtonsDisabled = tagFormReadOnly || golden9Locked;

  const buttons: ScoreItemType[] = letGanChecked
    ? heiJinChecked
      ? LET_GAN_HEI_JIN_BUTTONS
      : LET_GAN_ALL_BUTTONS
    : heiJinChecked
      ? HEI_JIN_BUTTONS
      : REGULAR_BUTTONS;

  const showGolden9Button = !letGanChecked;

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
        <div className="player-score-bar__win-btns">
          {showGolden9Button && (
            <button
              type="button"
              className="player-score-bar__golden9"
              disabled={scoreButtonsDisabled}
              onClick={() => addGolden9Tag(player)}
            >
              {SCORE_LABELS.golden_9}
            </button>
          )}
          <button
            type="button"
            className="player-score-bar__golden9"
            disabled={scoreButtonsDisabled}
            onClick={() => addScoreTag(player, 'big_gold')}
          >
            {SCORE_LABELS.big_gold}
          </button>
        </div>
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
            {type === 'let_foul' ? SCORE_LABELS.foul : SCORE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
