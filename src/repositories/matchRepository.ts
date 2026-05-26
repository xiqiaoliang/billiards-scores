import { db } from '../db/database';
import {
  DEFAULT_PLAYER1_NAME,
  DEFAULT_PLAYER2_NAME,
} from '../domain/constants';
import type { MatchRecord } from '../domain/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createMatchRecord(now = Date.now()): MatchRecord {
  return {
    id: generateId(),
    status: 'in_progress',
    createdAt: now,
    player1Name: DEFAULT_PLAYER1_NAME,
    player2Name: DEFAULT_PLAYER2_NAME,
    rounds: [],
    currentRoundNumber: 1,
    currentRoundStartTime: now,
    syncStatus: 'local',
  };
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

export async function createAndSaveMatch(): Promise<MatchRecord> {
  const match = createMatchRecord();
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

export async function deleteMatch(id: string): Promise<void> {
  await db.matches.delete(id);
}

export async function deleteMatches(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.matches.bulkDelete(ids);
}
