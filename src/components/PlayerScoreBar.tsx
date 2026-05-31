import {
  HEI_JIN_BUTTONS,
  PLAYER1_COLOR,
  PLAYER2_COLOR,
  PLAYER3_COLOR,
  REGULAR_BUTTONS,
  SCORE_LABELS,
} from '../domain/constants';
import { Button, Card, Checkbox, Space, Typography } from 'antd';
import { useMatch } from '../context/MatchContext';
import { hasGolden9Exclusive, isServingPlayer } from '../domain/validators';
import type { PlayerId, ScoreItemType } from '../domain/types';

interface PlayerScoreBarProps {
  player: PlayerId;
  playerOrder?: PlayerId[];
}

const LET_GAN_ALL_BUTTONS: ScoreItemType[] = [
  'let_foul',
  'split',
  'normal_win',
  'small_gold',
];
const LET_GAN_HEI_JIN_BUTTONS: ScoreItemType[] = ['normal_win', 'small_gold'];

export function PlayerScoreBar({ player, playerOrder }: PlayerScoreBarProps) {
  const {
    session,
    activeSession,
    tagFormReadOnly,
    addScoreTag,
    addGolden9Tag,
    setLetGan,
    setHeiJin,
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
  const golden9Locked = hasGolden9Exclusive(activeSession.pendingTags);
  const scoreButtonsDisabled = tagFormReadOnly || golden9Locked;
  const isServingPosition = isServingPlayer(player, playerOrder);

  const buttons: ScoreItemType[] = letGanChecked
    ? heiJinChecked
      ? LET_GAN_HEI_JIN_BUTTONS
      : LET_GAN_ALL_BUTTONS
    : heiJinChecked
      ? HEI_JIN_BUTTONS
      : REGULAR_BUTTONS;
  const visibleButtons = buttons.filter(
    (type) => isServingPosition || type !== 'break_foul',
  );

  const showGolden9Button = !letGanChecked && isServingPosition;

  return (
    <Card size="small" className="mb-2 rounded-2xl border-slate-200 shadow-sm last:mb-0">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Typography.Text className="text-base font-semibold" style={{ color }}>
          {name}
        </Typography.Text>
        <Checkbox
          checked={letGanChecked}
          disabled={tagFormReadOnly}
          onChange={(e) => setLetGan(player, e.target.checked)}
        >
          让杆得分
        </Checkbox>
        <Checkbox
          checked={heiJinChecked}
          disabled={tagFormReadOnly}
          onChange={(e) => setHeiJin(player, e.target.checked)}
        >
          黑金
        </Checkbox>
        <Space className="ml-auto" size={8} wrap>
          {showGolden9Button && (
            <Button disabled={scoreButtonsDisabled} onClick={() => addGolden9Tag(player, playerOrder)}>
              {SCORE_LABELS.golden_9}
            </Button>
          )}
          <Button disabled={scoreButtonsDisabled} onClick={() => addScoreTag(player, 'big_gold', playerOrder)}>
            {SCORE_LABELS.big_gold}
          </Button>
        </Space>
      </div>
      <div className="flex w-full flex-nowrap gap-1 overflow-hidden">
        {visibleButtons.map((type) => (
          <Button
            key={type}
            disabled={scoreButtonsDisabled}
            onClick={() => addScoreTag(player, type, playerOrder)}
            className="min-w-0 flex-1 overflow-hidden px-1 text-[11px] leading-none"
          >
            <span className="block whitespace-nowrap">
              {type === 'let_foul' ? SCORE_LABELS.foul : SCORE_LABELS[type]}
            </span>
          </Button>
        ))}
      </div>
    </Card>
  );
}
