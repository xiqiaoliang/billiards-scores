import type { ScoreItemType } from './types';

export const PLAYER1_COLOR = '#1677FF';
export const PLAYER2_COLOR = '#F53F3F';
export const PLAYER3_COLOR = '#D48806';

export const DEFAULT_PLAYER1_NAME = '吴';
export const DEFAULT_PLAYER2_NAME = '席';
export const DEFAULT_PLAYER3_NAME = '王';

/** 犯规类标签给对手加分，犯规者本人不计分 */
export const FOUL_OPPONENT_BONUS = 1;

export const FOUL_TYPES: ScoreItemType[] = ['foul', 'break_foul'];

export const SCORE_VALUES: Record<ScoreItemType, number> = {
  foul: 0,
  let_foul: 0,
  break_foul: 0,
  split: 2,
  normal_win: 4,
  golden_9: 4,
  small_gold: 7,
  big_gold: 10,
};

export const SCORE_LABELS: Record<ScoreItemType, string> = {
  foul: '犯规',
  let_foul: '让杆犯规',
  break_foul: '开球犯规',
  split: '分球',
  normal_win: '普胜',
  golden_9: '黄金9',
  small_gold: '小金',
  big_gold: '大金',
};

export const REGULAR_BUTTONS: ScoreItemType[] = [
  'break_foul',
  'foul',
  'split',
  'normal_win',
  'small_gold',
];

export const LET_GAN_BUTTONS: ScoreItemType[] = [
  'let_foul',
  'split',
  'normal_win',
  'small_gold',
];

export const HEI_JIN_BUTTONS: ScoreItemType[] = [
  'normal_win',
  'small_gold',
];

export const HEI_JIN_LABELS: Record<
  'normal_win' | 'small_gold' | 'big_gold' | 'golden_9',
  string
> = {
  normal_win: '黑金',
  golden_9: '黑黄金9',
  small_gold: '黑小金',
  big_gold: '黑大金',
};

export const WIN_TYPES: ScoreItemType[] = [
  'normal_win',
  'golden_9',
  'small_gold',
  'big_gold',
];

/** 标签展示/存储顺序：开球犯规最前，取胜项最后 */
export const TAG_DISPLAY_ORDER: Record<ScoreItemType, number> = {
  break_foul: 0,
  foul: 1,
  let_foul: 2,
  split: 3,
  normal_win: 4,
  golden_9: 5,
  small_gold: 6,
  big_gold: 7,
};

export const LIMITED_ONCE_TYPES: ScoreItemType[] = ['break_foul', 'split'];

export const VALIDATION_MESSAGES = {
  breakFoulLimit: '本局开球犯规仅可选择1次',
  splitLimit: '本局分球仅可选择1次',
  winExclusive: '胜负类选项只能选择一项',
  breakFoulGlobal: '本局开球犯规只能有一名选手获得',
  splitGlobal: '本局分球只能有一名选手获得',
  winGlobal: '本局取胜项只能有一名选手获得',
  winRequired: '本局须选择取胜项（普胜、黄金9、小金或大金）',
  golden9Exclusive: '黄金9为独占得分，不可再添加其他计分项',
} as const;

export const ARCHIVE_CONFIRM_TEXT =
  '确定要结束本场比赛并封存记录吗？封存后将无法继续新增对局、无法修改数据';

export const NEW_MATCH_CONFIRM_TEXT =
  '确定要开始新比赛吗？当前进行中的对局将保留在历史记录中，界面将重置为全新对局。';

export function deleteHistoryConfirmText(count: number): string {
  if (count === 1) {
    return '确定删除该场比赛记录吗？删除后无法恢复。';
  }
  return `确定删除选中的 ${count} 场比赛记录吗？删除后无法恢复。`;
}
