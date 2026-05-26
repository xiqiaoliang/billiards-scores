import { buildRoundRecord } from './scoring';
import type { LetGanState, MatchRecord, PendingTag, RoundRecord } from './types';

export function applyPlayerNames(
  match: MatchRecord,
  player1Name: string,
  player2Name: string,
): MatchRecord {
  const name1 = player1Name.trim() || match.player1Name;
  const name2 = player2Name.trim() || match.player2Name;
  return { ...match, player1Name: name1, player2Name: name2 };
}

export function inferLetGanFromTags(tags: PendingTag[]): LetGanState {
  return {
    player1: tags.some((t) => t.player === 1 && t.isLetGan),
    player2: tags.some((t) => t.player === 2 && t.isLetGan),
  };
}

export function inferHeiJinFromTags(tags: PendingTag[]): LetGanState {
  return {
    player1: tags.some((t) => t.player === 1 && t.isHeiJin),
    player2: tags.some((t) => t.player === 2 && t.isHeiJin),
  };
}

export function rebuildRoundRecord(
  existing: RoundRecord,
  tags: PendingTag[],
): RoundRecord {
  return buildRoundRecord(
    existing.roundNumber,
    existing.startTime,
    existing.endTime,
    tags,
  );
}
