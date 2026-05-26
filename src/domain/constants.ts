import type { ScoreItemType } from './types';

export const PLAYER1_COLOR = '#1677FF';
export const PLAYER2_COLOR = '#F53F3F';

export const DEFAULT_PLAYER1_NAME = '吴';
export const DEFAULT_PLAYER2_NAME = '席';

/** 犯规类标签给对手加分，犯规者本人不计分 */
export const FOUL_OPPONENT_BONUS = 1;

export const FOUL_TYPES: ScoreItemType[] = ['foul', 'break_foul'];

export const SCORE_VALUES: Record<ScoreItemType, number> = {
  foul: 0,
  break_foul: 0,
  split: 2,
  normal_win: 4,
  small_gold: 7,
  big_gold: 10,
};

export const SCORE_LABELS: Record<ScoreItemType, string> = {
  foul: '犯规',
  break_foul: '开球犯规',
  split: '分球',
  normal_win: '普胜',
  small_gold: '小金',
  big_gold: '大金',
};

export const REGULAR_BUTTONS: ScoreItemType[] = [
  'break_foul',
  'foul',
  'split',
  'normal_win',
  'small_gold',
  'big_gold',
];

export const LET_GAN_BUTTONS: ScoreItemType[] = [
  'split',
  'normal_win',
  'small_gold',
  'big_gold',
];

export const WIN_TYPES: ScoreItemType[] = ['normal_win', 'small_gold', 'big_gold'];

/** 标签展示/存储顺序：开球犯规最前，取胜项最后 */
export const TAG_DISPLAY_ORDER: Record<ScoreItemType, number> = {
  break_foul: 0,
  foul: 1,
  split: 2,
  normal_win: 3,
  small_gold: 4,
  big_gold: 5,
};

export const LIMITED_ONCE_TYPES: ScoreItemType[] = ['break_foul', 'split'];

export const VALIDATION_MESSAGES = {
  breakFoulLimit: '本局开球犯规仅可选择1次',
  splitLimit: '本局分球仅可选择1次',
  winExclusive: '胜负类选项只能选择一项',
  breakFoulGlobal: '本局开球犯规只能有一名选手获得',
  splitGlobal: '本局分球只能有一名选手获得',
  winGlobal: '本局取胜项只能有一名选手获得',
  winRequired: '本局须选择取胜项（普胜、小金或大金）',
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
