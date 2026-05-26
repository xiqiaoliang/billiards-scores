import type { MatchRecord } from './types';

export function applyPlayerNames(
  match: MatchRecord,
  player1Name: string,
  player2Name: string,
): MatchRecord {
  const name1 = player1Name.trim() || match.player1Name;
  const name2 = player2Name.trim() || match.player2Name;
  return { ...match, player1Name: name1, player2Name: name2 };
}
