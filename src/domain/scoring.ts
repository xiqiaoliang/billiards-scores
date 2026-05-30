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
  MatchMode,
  MatchOverview,
  MatchRecord,
  PendingTag,
  PlayerId,
  PlayerOverviewStats,
  RoundPlayerStats,
  RoundRecord,
  ScoreItemType,
} from './types';

interface ScoreCalcContext {
  mode?: MatchMode;
  playerOrder?: PlayerId[];
  playerNames?: Partial<Record<PlayerId, string>>;
}

function getPlayersByMode(mode: MatchMode): PlayerId[] {
  return mode === 'trio' ? [1, 2, 3] : [1, 2];
}

function getRoundMode(round: RoundRecord): MatchMode {
  return round.player3 ? 'trio' : 'duel';
}

function getPlayerStatsFromRound(round: RoundRecord, player: PlayerId): RoundPlayerStats {
  if (player === 1) return round.player1;
  if (player === 2) return round.player2;
  return round.player3 ?? { baseScore: 0, extraScore: 0, roundTotal: 0 };
}

function getPlayerOrder(mode: MatchMode, playerOrder?: PlayerId[]): PlayerId[] {
  const defaults = getPlayersByMode(mode);
  if (!playerOrder || playerOrder.length === 0) {
    return defaults;
  }
  return defaults.filter((p) => playerOrder.includes(p));
}

function normalizeTrioOrder(playerOrder?: PlayerId[]): PlayerId[] {
  const resolved = getPlayerOrder('trio', playerOrder);
  return resolved.length === 3 ? resolved : [1, 2, 3];
}

export function calcNextTrioPlayerOrder(
  currentOrder: PlayerId[] | undefined,
  tags: PendingTag[],
): PlayerId[] {
  let nextOrder = [...normalizeTrioOrder(currentOrder)];
  const winTag = getRoundWinTag(tags);
  const winner = getRoundWinnerPlayer(tags, 'trio', nextOrder);
  const noSwap = Boolean(winTag && (winTag.isHeiJin || winTag.isLetGan));

  if (!noSwap && winner !== null) {
    const winnerIndex = nextOrder.indexOf(winner);
    if (winnerIndex >= 0) {
      const upstreamIndex = (winnerIndex - 1 + nextOrder.length) % nextOrder.length;
      const upstream = nextOrder[upstreamIndex];
      nextOrder = nextOrder.map((id) => {
        if (id === winner) return upstream;
        if (id === upstream) return winner;
        return id;
      });
    }
  }

  const opener = winTag?.isHeiJin ? winTag.player : winner;
  if (opener !== null && opener !== undefined) {
    const openerIndex = nextOrder.indexOf(opener);
    if (openerIndex > 0) {
      nextOrder = [...nextOrder.slice(openerIndex), ...nextOrder.slice(0, openerIndex)];
    }
  }

  return nextOrder;
}

export function buildComputedRoundOrders(match: MatchRecord): Record<number, PlayerId[]> {
  if (match.mode !== 'trio') {
    return Object.fromEntries(match.rounds.map((r) => [r.roundNumber, [1, 2] as PlayerId[]]));
  }

  const rounds = [...match.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const computed: Record<number, PlayerId[]> = {};
  let order = normalizeTrioOrder(rounds[0]?.playerOrder ?? match.currentPlayerOrder);

  for (const round of rounds) {
    computed[round.roundNumber] = [...order];
    order = calcNextTrioPlayerOrder(order, round.tags);
  }

  return computed;
}

function getRelativePlayers(
  actor: PlayerId,
  mode: MatchMode,
  playerOrder?: PlayerId[],
): { upstream: PlayerId; downstream: PlayerId } {
  const order = getPlayerOrder(mode, playerOrder);
  const index = order.indexOf(actor);
  if (index < 0 || order.length < 2) {
    const upstream = actor === 1 ? 2 : 1;
    const downstream = actor === 1 ? 2 : 1;
    return { upstream, downstream };
  }

  const upstream = order[(index - 1 + order.length) % order.length];
  const downstream = order[(index + 1) % order.length];
  return { upstream, downstream };
}

function addTransfer(
  balances: Record<number, number>,
  from: PlayerId,
  to: PlayerId,
  score: number,
): void {
  if (score <= 0 || from === to) return;
  balances[from] -= score;
  balances[to] += score;
}

function calcTrioRoundTotals(
  tags: PendingTag[],
  playerOrder?: PlayerId[],
): Record<number, number> {
  const totals: Record<number, number> = { 1: 0, 2: 0, 3: 0 };

  for (const tag of tags) {
    const score = getBaseScore(tag.type) || FOUL_OPPONENT_BONUS;
    const { upstream, downstream } = getRelativePlayers(tag.player, 'trio', playerOrder);

    if (tag.type === 'foul' || tag.type === 'break_foul') {
      addTransfer(totals, tag.player, upstream, FOUL_OPPONENT_BONUS);
      continue;
    }

    if (tag.type === 'let_foul') {
      addTransfer(totals, tag.player, downstream, FOUL_OPPONENT_BONUS);
      continue;
    }

    if (tag.type === 'split') {
      if (tag.isLetGan) {
        addTransfer(totals, downstream, tag.player, score);
      } else {
        addTransfer(totals, upstream, tag.player, score);
      }
      continue;
    }

    if (tag.type === 'normal_win') {
      if (tag.isHeiJin) {
        const target = tag.isLetGan ? downstream : upstream;
        addTransfer(totals, tag.player, target, score);
      } else {
        addTransfer(totals, upstream, tag.player, score);
      }
      continue;
    }

    if (tag.type === 'golden_9' || tag.type === 'small_gold' || tag.type === 'big_gold') {
      if (tag.isLetGan) {
        if (tag.isHeiJin) {
          addTransfer(totals, tag.player, downstream, score);
        } else {
          addTransfer(totals, downstream, tag.player, score);
        }
      } else if (tag.isHeiJin) {
        addTransfer(totals, tag.player, upstream, score);
        addTransfer(totals, tag.player, downstream, score);
      } else {
        addTransfer(totals, upstream, tag.player, score);
        addTransfer(totals, downstream, tag.player, score);
      }
    }
  }

  return totals;
}

export function getBaseScore(type: ScoreItemType): number {
  return SCORE_VALUES[type];
}

export function isFoulType(type: ScoreItemType): boolean {
  return FOUL_TYPES.includes(type) || type === 'let_foul';
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
  context: ScoreCalcContext = {},
): { base: number; extra: number; total: number } {
  const mode = context.mode ?? 'duel';

  if (mode === 'trio') {
    const totals = calcTrioRoundTotals([tag], context.playerOrder);
    const total = totals[player] ?? 0;
    return { base: total, extra: 0, total };
  }

  const opponent: PlayerId = tag.player === 1 ? 2 : 1;

  if (tag.isHeiJin && isHeiJinWinType(tag.type)) {
    const base = getBaseScore(tag.type) + FOUL_OPPONENT_BONUS;
    if (player === tag.player) {
      return { base: -base, extra: 0, total: -base };
    }
    if (player === opponent) {
      return { base, extra: 0, total: base };
    }
    return { base: 0, extra: 0, total: 0 };
  }

  if (isFoulType(tag.type)) {
    const base = FOUL_OPPONENT_BONUS;
    if (player === tag.player) {
      return { base: -base, extra: 0, total: -base };
    }
    if (player === opponent) {
      return { base, extra: 0, total: base };
    }
    return { base: 0, extra: 0, total: 0 };
  }

  const base = getBaseScore(tag.type);
  const total = tag.isLetGan ? base * 2 : base;

  if (player === tag.player) {
    const extra = tag.isLetGan ? base : 0;
    return { base, extra, total };
  }

  if (player === opponent) {
    return { base: -total, extra: 0, total: -total };
  }

  return { base: 0, extra: 0, total: 0 };
}

export function calcRoundPlayerStats(
  tags: PendingTag[],
  player: PlayerId,
  context: ScoreCalcContext = {},
): RoundPlayerStats {
  const mode = context.mode ?? 'duel';
  if (mode === 'trio') {
    const totals = calcTrioRoundTotals(tags, context.playerOrder);
    const total = totals[player] ?? 0;
    return { baseScore: total, extraScore: 0, roundTotal: total };
  }

  let baseScore = 0;
  let extraScore = 0;
  let roundTotal = 0;

  for (const tag of tags) {
    const delta = getTagScoreForPlayer(tag, player, context);
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
  mode: MatchMode = 'duel',
  playerOrder?: PlayerId[],
): RoundRecord {
  const record: RoundRecord = {
    roundNumber,
    startTime,
    endTime,
    durationMs: endTime - startTime,
    playerOrder: getPlayerOrder(mode, playerOrder),
    tags: sortScoreTags(tags).map((t) => ({ ...t })),
    player1: calcRoundPlayerStats(tags, 1, { mode, playerOrder }),
    player2: calcRoundPlayerStats(tags, 2, { mode, playerOrder }),
  };

  if (mode === 'trio') {
    record.player3 = calcRoundPlayerStats(tags, 3, { mode, playerOrder });
  }

  return record;
}

function aggregatePlayerFromRounds(
  rounds: RoundRecord[],
  player: PlayerId,
  mode: MatchMode,
): PlayerOverviewStats {
  let foulCount = 0;
  let splitCount = 0;
  let normalWinCount = 0;
  let smallGoldCount = 0;
  let bigGoldCount = 0;
  let extraScore = 0;
  let totalScore = 0;

  for (const round of rounds) {
    const stats = getPlayerStatsFromRound(round, player);
    extraScore += stats.extraScore;
    totalScore += stats.roundTotal;

    for (const tag of round.tags) {
      if (tag.player !== player) continue;
      switch (tag.type) {
        case 'foul':
        case 'break_foul':
        case 'let_foul':
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

    if (mode === 'duel') {
      const opponent: PlayerId = player === 1 ? 2 : 1;
      for (const tag of round.tags) {
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
        }
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
  const mode = match.mode ?? 'duel';
  const player1 = aggregatePlayerFromRounds(match.rounds, 1, mode);
  const player2 = aggregatePlayerFromRounds(match.rounds, 2, mode);
  const netScore = player1.totalScore - player2.totalScore;

  if (mode === 'trio') {
    const player3 = aggregatePlayerFromRounds(match.rounds, 3, mode);
    return { player1, player2, player3, netScore };
  }

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
  if (tag.isLetGan && tag.type !== 'let_foul') {
    return `${playerName} 让杆${label}`;
  }
  return `${playerName} ${label}`;
}

export function getPlayerName(match: MatchRecord, player: PlayerId): string {
  if (player === 1) return match.player1Name;
  if (player === 2) return match.player2Name;
  return match.player3Name ?? '选手3';
}

function formatScoreValue(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function getSummaryPlayerName(
  player: PlayerId,
  context: ScoreCalcContext,
): string {
  return context.playerNames?.[player] ?? `选手${player}`;
}

function formatOwnTagLabel(tag: PendingTag): string {
  if (tag.isLetGan && tag.type !== 'let_foul') {
    return `让杆${SCORE_LABELS[tag.type]}`;
  }
  return SCORE_LABELS[tag.type];
}

function formatOtherTagLabel(
  sourceName: string,
  tag: PendingTag,
): string {
  if (tag.isHeiJin) {
    const heiJinLabel = getHeiJinLabel(tag.type);
    if (heiJinLabel) {
      return `${sourceName}${heiJinLabel}`;
    }
  }
  return `${sourceName}${formatOwnTagLabel(tag)}`;
}

function aggregateTagParts(
  target: Record<string, number>,
  key: string,
  delta: number,
): void {
  if (delta <= 0) return;
  target[key] = (target[key] ?? 0) + delta;
}

function orderedParts(map: Record<string, number>): string[] {
  return Object.entries(map).map(([key, value]) => `${key}${formatScoreValue(value)}`);
}

export function formatPlayerRoundSummary(
  tags: PendingTag[],
  player: PlayerId,
  context: ScoreCalcContext = {},
): string {
  const mode = context.mode ?? 'duel';
  const order = getPlayerOrder(mode, context.playerOrder);
  const { upstream, downstream } = getRelativePlayers(player, mode, order);

  const ownPartsMap: Record<string, number> = {};
  const upstreamPartsMap: Record<string, number> = {};
  const downstreamPartsMap: Record<string, number> = {};
  let subtotal = 0;

  for (const tag of tags) {
    const delta = getTagScoreForPlayer(tag, player, context).total;
    if (delta <= 0) continue;
    subtotal += delta;
    if (tag.player === player) {
      aggregateTagParts(ownPartsMap, formatOwnTagLabel(tag), delta);
      continue;
    }
    if (tag.player === upstream) {
      aggregateTagParts(
        upstreamPartsMap,
        formatOtherTagLabel(getSummaryPlayerName(upstream, context), tag),
        delta,
      );
      continue;
    }
    if (tag.player === downstream) {
      aggregateTagParts(
        downstreamPartsMap,
        formatOtherTagLabel(getSummaryPlayerName(downstream, context), tag),
        delta,
      );
    }
  }

  const parts: string[] = [];
  const ownParts = orderedParts(ownPartsMap);
  const upstreamParts = orderedParts(upstreamPartsMap);
  const downstreamParts = orderedParts(downstreamPartsMap);
  parts.push(...ownParts);
  parts.push(...upstreamParts);
  parts.push(...downstreamParts);

  const net = calcRoundPlayerStats(tags, player, context).roundTotal;
  parts.push(`小计${formatScoreValue(subtotal)}`);
  parts.push(`净分${formatScoreValue(net)}`);
  return parts.join(' ');
}

export function getRoundWinTag(tags: PendingTag[]): PendingTag | null {
  const sorted = sortScoreTags(tags);
  return (
    [...sorted].reverse().find((t) => WIN_TYPES.includes(t.type)) ?? null
  );
}

export function getRoundWinnerPlayer(
  tags: PendingTag[],
  mode: MatchMode = 'duel',
  playerOrder?: PlayerId[],
): PlayerId | null {
  const winTag = getRoundWinTag(tags);
  if (!winTag) return null;

  if (mode === 'trio') {
    const { upstream, downstream } = getRelativePlayers(winTag.player, 'trio', playerOrder);
    if (winTag.isHeiJin) {
      return winTag.isLetGan ? downstream : upstream;
    }
    return winTag.player;
  }

  if (winTag.isHeiJin) {
    return winTag.player === 1 ? 2 : 1;
  }
  return winTag.player;
}

export function getRoundWinnerLabel(
  tags: PendingTag[],
  match: MatchRecord,
  playerOrder?: PlayerId[],
): string | null {
  const winTag = getRoundWinTag(tags);
  const winnerPlayer = getRoundWinnerPlayer(tags, match.mode ?? 'duel', playerOrder);
  if (!winTag || winnerPlayer === null) return null;

  if (winTag.isHeiJin) {
    const heiJinLabel = getHeiJinLabel(winTag.type);
    if (heiJinLabel) {
      return `${getPlayerName(match, winnerPlayer)} 对方${heiJinLabel}`;
    }
  }

  return formatTagLabel(getPlayerName(match, winTag.player), winTag);
}

export function calcRoundWinnerNet(
  round: RoundRecord,
  winnerPlayer: PlayerId,
): number {
  const mode = getRoundMode(round);
  if (mode === 'trio') {
    return getPlayerStatsFromRound(round, winnerPlayer).roundTotal;
  }

  const { player1, player2 } = round;
  return winnerPlayer === 1
    ? player1.roundTotal - player2.roundTotal
    : player2.roundTotal - player1.roundTotal;
}
