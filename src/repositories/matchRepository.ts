import { db } from '../db/database';
import {
  DEFAULT_PLAYER3_NAME,
  DEFAULT_PLAYER1_NAME,
  DEFAULT_PLAYER2_NAME,
} from '../domain/constants';
import type { MatchMode, MatchRecord } from '../domain/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getDefaultPlayerNames(mode: MatchMode, match?: MatchRecord): Pick<MatchRecord, 'player1Name' | 'player2Name' | 'player3Name'> {
  return {
    player1Name: match?.player1Name || DEFAULT_PLAYER1_NAME,
    player2Name: match?.player2Name || DEFAULT_PLAYER2_NAME,
    player3Name: mode === 'trio' ? match?.player3Name || DEFAULT_PLAYER3_NAME : undefined,
  };
}

export function createMatchRecord(
  now = Date.now(),
  mode: MatchMode = 'duel',
  match?: MatchRecord,
): MatchRecord {
  const playerNames = getDefaultPlayerNames(mode, match);

  return {
    id: generateId(),
    mode,
    status: 'in_progress',
    createdAt: now,
    ...playerNames,
    currentPlayerOrder: mode === 'trio' ? [1, 2, 3] : [1, 2],
    rounds: [],
    currentRoundNumber: 1,
    currentRoundStartTime: now,
    syncStatus: 'local',
  };
}

export async function getLatestMatchByMode(mode: MatchMode): Promise<MatchRecord | undefined> {
  const matches = await getAllMatches();
  return matches.find((match) => match.mode === mode);
}

export async function getLatestInProgressMatch(): Promise<MatchRecord | undefined> {
  const matches = await db.matches
    .where('status')
    .equals('in_progress')
    .toArray();
  matches.sort((a, b) => b.createdAt - a.createdAt);
  return matches[0];
}

export async function saveMatch(match: MatchRecord): Promise<void> {
  await db.matches.put(match);
}

export async function createAndSaveMatch(mode: MatchMode = 'duel'): Promise<MatchRecord> {
  const previousMatch = await getLatestMatchByMode(mode);
  const match = createMatchRecord(Date.now(), mode, previousMatch);
  await saveMatch(match);
  return match;
}

export async function archiveMatch(match: MatchRecord): Promise<MatchRecord> {
  const archived: MatchRecord = { ...match, status: 'archived' };
  await saveMatch(archived);
  return archived;
}

export async function getAllMatches(): Promise<MatchRecord[]> {
  const matches = await db.matches.toArray();
  matches.sort((a, b) => b.createdAt - a.createdAt);
  return matches;
}

export async function getMatchById(id: string): Promise<MatchRecord | undefined> {
  return db.matches.get(id);
}

export async function findMatchBySignature(candidate: MatchRecord): Promise<MatchRecord | undefined> {
  // Try to detect an existing match by matching createdAt, mode and player names.
  // This is used for imported matches to avoid duplicate imports.
  const matches = await getAllMatches();
  return matches.find((m) =>
    m.mode === candidate.mode &&
    m.createdAt === candidate.createdAt &&
    m.player1Name === candidate.player1Name &&
    m.player2Name === candidate.player2Name &&
    (m.mode === 'trio' ? m.player3Name === candidate.player3Name : true),
  );
}


export async function deleteMatches(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.matches.bulkDelete(ids);
}
