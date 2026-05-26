import {
  FOUL_OPPONENT_BONUS,
  FOUL_TYPES,
  HEI_JIN_LABELS,
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

export function isFoulType(type: ScoreItemType): boolean {
  return FOUL_TYPES.includes(type);
}

export function isHeiJinWinType(
  type: ScoreItemType,
): type is 'normal_win' | 'small_gold' | 'big_gold' | 'golden_9' {
  return (
    type === 'normal_win' ||
    type === 'golden_9' ||
    type === 'small_gold' ||
    type === 'big_gold'
  );
}

export function getHeiJinLabel(type: ScoreItemType): string | null {
  if (!isHeiJinWinType(type)) return null;
  return HEI_JIN_LABELS[type];
}

export function sortScoreTags(tags: PendingTag[]): PendingTag[] {
  return [...tags].sort(
    (a, b) => TAG_DISPLAY_ORDER[a.type] - TAG_DISPLAY_ORDER[b.type],
  );
}

export function formatNetScore(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function getTagScoreForPlayer(
  tag: PendingTag,
  player: PlayerId,
): { base: number; extra: number; total: number } {
  if (tag.isHeiJin && isHeiJinWinType(tag.type)) {
    if (tag.player === player) {
      return { base: 0, extra: 0, total: 0 };
    }
    const base = getBaseScore(tag.type) + FOUL_OPPONENT_BONUS;
    return { base, extra: 0, total: base };
  }

  if (isFoulType(tag.type)) {
    if (tag.player === player) {
      return { base: 0, extra: 0, total: 0 };
    }
    const base = FOUL_OPPONENT_BONUS;
    if (tag.isLetGan) {
      return { base, extra: base, total: base * 2 };
    }
    return { base, extra: 0, total: base };
  }

  if (tag.player !== player) {
    return { base: 0, extra: 0, total: 0 };
  }

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
    const delta = getTagScoreForPlayer(tag, player);
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
      const opponent: PlayerId = player === 1 ? 2 : 1;

      if (tag.player === player && tag.isHeiJin) {
        foulCount += 1;
        continue;
      }

      if (tag.player === opponent && tag.isHeiJin && isHeiJinWinType(tag.type)) {
        switch (tag.type) {
          case 'normal_win':
          case 'golden_9':
            normalWinCount += 1;
            break;
          case 'small_gold':
            smallGoldCount += 1;
            break;
          case 'big_gold':
            bigGoldCount += 1;
            break;
        }
        continue;
      }

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
        case 'golden_9':
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
  if (tag.isHeiJin) {
    const heiJinLabel = getHeiJinLabel(tag.type);
    if (heiJinLabel) {
      return `${playerName} ${heiJinLabel}`;
    }
  }
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
  'golden_9',
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
  const opponent: PlayerId = player === 1 ? 2 : 1;
  const playerTags = tags.filter((t) => t.player === player);
  const opponentTags = tags.filter((t) => t.player === opponent);
  const parts: string[] = [];

  for (const type of ROUND_SUMMARY_TYPES) {
    if (isFoulType(type)) {
      const sourceTags = opponentTags.filter((t) => t.type === type && !t.isHeiJin);
      if (sourceTags.length === 0) continue;
      const score = sourceTags.reduce(
        (sum, t) => sum + getTagScoreForPlayer(t, player).total,
        0,
      );
      if (score === 0) continue;
      parts.push(`对方${SCORE_LABELS[type]}${formatScoreValue(score)}`);
      continue;
    }

    if (type === 'golden_9') {
      const ownWins = playerTags.filter((t) => t.type === 'golden_9' && !t.isHeiJin);
      const oppHeiJin = opponentTags.filter(
        (t) => t.type === 'golden_9' && t.isHeiJin,
      );

      if (ownWins.length > 0) {
        const score = ownWins.reduce(
          (sum, t) => sum + getTagScoreForPlayer(t, player).total,
          0,
        );
        if (score !== 0) {
          const prefix = ownWins.some((t) => t.isLetGan) ? '让杆' : '';
          parts.push(`${prefix}${SCORE_LABELS.golden_9}${formatScoreValue(score)}`);
        }
      }

      if (oppHeiJin.length > 0) {
        const score = oppHeiJin.reduce(
          (sum, t) => sum + getTagScoreForPlayer(t, player).total,
          0,
        );
        if (score !== 0) {
          parts.push(
            `对方${HEI_JIN_LABELS.golden_9}${formatScoreValue(score)}`,
          );
        }
      }
      continue;
    }

    if (isHeiJinWinType(type)) {
      const ownWins = playerTags.filter((t) => t.type === type && !t.isHeiJin);
      const oppHeiJin = opponentTags.filter(
        (t) => t.type === type && t.isHeiJin,
      );

      if (ownWins.length > 0) {
        const score = ownWins.reduce(
          (sum, t) => sum + getTagScoreForPlayer(t, player).total,
          0,
        );
        if (score !== 0) {
          const prefix = ownWins.some((t) => t.isLetGan) ? '让杆' : '';
          parts.push(`${prefix}${SCORE_LABELS[type]}${formatScoreValue(score)}`);
        }
      }

      if (oppHeiJin.length > 0) {
        const score = oppHeiJin.reduce(
          (sum, t) => sum + getTagScoreForPlayer(t, player).total,
          0,
        );
        if (score !== 0) {
          parts.push(
            `对方${HEI_JIN_LABELS[type]}${formatScoreValue(score)}`,
          );
        }
      }
      continue;
    }

    const ofType = playerTags.filter((t) => t.type === type);
    if (ofType.length === 0) continue;
    const score = ofType.reduce(
      (sum, t) => sum + getTagScoreForPlayer(t, player).total,
      0,
    );
    if (score === 0) continue;
    const prefix = ofType.some((t) => t.isLetGan) ? '让杆' : '';
    parts.push(`${prefix}${SCORE_LABELS[type]}${formatScoreValue(score)}`);
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

/** 本局胜方选手（黑金时胜方为提交黑金者的对手） */
export function getRoundWinnerPlayer(tags: PendingTag[]): PlayerId | null {
  const winTag = getRoundWinTag(tags);
  if (!winTag) return null;
  if (winTag.isHeiJin) {
    return winTag.player === 1 ? 2 : 1;
  }
  return winTag.player;
}

export function getRoundWinnerLabel(
  tags: PendingTag[],
  match: MatchRecord,
): string | null {
  const winTag = getRoundWinTag(tags);
  const winnerPlayer = getRoundWinnerPlayer(tags);
  if (!winTag || winnerPlayer === null) return null;

  if (winTag.isHeiJin) {
    const heiJinLabel = getHeiJinLabel(winTag.type);
    if (heiJinLabel) {
      return `${getPlayerName(match, winnerPlayer)} 对方${heiJinLabel}`;
    }
  }

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
