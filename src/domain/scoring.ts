import {
  SCORE_LABELS,
  SCORE_VALUES,
  TAG_DISPLAY_ORDER,
  WIN_TYPES,
} from './constants';
import type {
  MatchOverview,
  MatchRecord,
  PendingTag,
  PlayerId,
  PlayerOverviewStats,
  RoundPlayerStats,
  RoundRecord,
  ScoreItemType,
} from './types';

export function getBaseScore(type: ScoreItemType): number {
  return SCORE_VALUES[type];
}

export function sortScoreTags(tags: PendingTag[]): PendingTag[] {
  return [...tags].sort(
    (a, b) => TAG_DISPLAY_ORDER[a.type] - TAG_DISPLAY_ORDER[b.type],
  );
}

export function formatNetScore(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function getTagScoreDelta(tag: PendingTag): {
  base: number;
  extra: number;
  total: number;
} {
  const base = getBaseScore(tag.type);
  if (tag.isLetGan) {
    return { base, extra: base, total: base * 2 };
  }
  return { base, extra: 0, total: base };
}

export function calcRoundPlayerStats(
  tags: PendingTag[],
  player: PlayerId,
): RoundPlayerStats {
  let baseScore = 0;
  let extraScore = 0;
  let roundTotal = 0;

  for (const tag of tags) {
    if (tag.player !== player) continue;
    const delta = getTagScoreDelta(tag);
    baseScore += delta.base;
    extraScore += delta.extra;
    roundTotal += delta.total;
  }

  return { baseScore, extraScore, roundTotal };
}

export function buildRoundRecord(
  roundNumber: number,
  startTime: number,
  endTime: number,
  tags: PendingTag[],
): RoundRecord {
  return {
    roundNumber,
    startTime,
    endTime,
    durationMs: endTime - startTime,
    tags: sortScoreTags(tags).map((t) => ({ ...t })),
    player1: calcRoundPlayerStats(tags, 1),
    player2: calcRoundPlayerStats(tags, 2),
  };
}

function aggregatePlayerFromRounds(
  rounds: RoundRecord[],
  player: PlayerId,
): PlayerOverviewStats {
  let foulCount = 0;
  let splitCount = 0;
  let normalWinCount = 0;
  let smallGoldCount = 0;
  let bigGoldCount = 0;
  let extraScore = 0;
  let totalScore = 0;

  for (const round of rounds) {
    const stats = player === 1 ? round.player1 : round.player2;
    extraScore += stats.extraScore;
    totalScore += stats.roundTotal;

    for (const tag of round.tags) {
      if (tag.player !== player) continue;
      switch (tag.type) {
        case 'foul':
        case 'break_foul':
          foulCount += 1;
          break;
        case 'split':
          splitCount += 1;
          break;
        case 'normal_win':
          normalWinCount += 1;
          break;
        case 'small_gold':
          smallGoldCount += 1;
          break;
        case 'big_gold':
          bigGoldCount += 1;
          break;
      }
    }
  }

  return {
    foulCount,
    splitCount,
    normalWinCount,
    smallGoldCount,
    bigGoldCount,
    extraScore,
    totalScore,
  };
}

export function calcMatchOverview(match: MatchRecord): MatchOverview {
  const player1 = aggregatePlayerFromRounds(match.rounds, 1);
  const player2 = aggregatePlayerFromRounds(match.rounds, 2);
  const netScore = player1.totalScore - player2.totalScore;

  return { player1, player2, netScore };
}

export function formatTagLabel(
  playerName: string,
  tag: PendingTag,
): string {
  const label = SCORE_LABELS[tag.type];
  if (tag.isLetGan) {
    return `${playerName} 让杆${label}`;
  }
  return `${playerName} ${label}`;
}

export function getPlayerName(match: MatchRecord, player: PlayerId): string {
  return player === 1 ? match.player1Name : match.player2Name;
}

const ROUND_SUMMARY_TYPES: ScoreItemType[] = [
  'break_foul',
  'foul',
  'split',
  'normal_win',
  'small_gold',
  'big_gold',
];

function formatScoreValue(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/** 单局某选手小计文案，为 0 的得分项不展示 */
export function formatPlayerRoundSummary(
  tags: PendingTag[],
  player: PlayerId,
): string {
  const playerTags = tags.filter((t) => t.player === player);
  const parts: string[] = [];

  for (const type of ROUND_SUMMARY_TYPES) {
    const ofType = playerTags.filter((t) => t.type === type);
    if (ofType.length === 0) continue;
    const score = ofType.reduce(
      (sum, t) => sum + getTagScoreDelta(t).total,
      0,
    );
    if (score === 0) continue;
    const label = SCORE_LABELS[type];
    const prefix = ofType.some((t) => t.isLetGan) ? '让杆' : '';
    parts.push(`${prefix}${label}${formatScoreValue(score)}`);
  }

  const total = calcRoundPlayerStats(tags, player).roundTotal;
  parts.push(`小计${formatScoreValue(total)}`);

  return parts.join(' ');
}

/** 本局取胜标签（排序后最后一项胜负类） */
export function getRoundWinTag(tags: PendingTag[]): PendingTag | null {
  const sorted = sortScoreTags(tags);
  return (
    [...sorted].reverse().find((t) => WIN_TYPES.includes(t.type)) ?? null
  );
}

export function getRoundWinnerLabel(
  tags: PendingTag[],
  match: MatchRecord,
): string | null {
  const winTag = getRoundWinTag(tags);
  if (!winTag) return null;
  return formatTagLabel(getPlayerName(match, winTag.player), winTag);
}

/** 单局净分（胜方视角：胜方小计 − 对方小计） */
export function calcRoundWinnerNet(
  round: RoundRecord,
  winnerPlayer: PlayerId,
): number {
  const { player1, player2 } = round;
  return winnerPlayer === 1
    ? player1.roundTotal - player2.roundTotal
    : player2.roundTotal - player1.roundTotal;
}
