import dayjs from 'dayjs';
import type { MatchRecord } from '../domain/types';

export function formatDateTime(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDateOnly(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD');
}

export function formatMatchPlayersLabel(match: Pick<MatchRecord, 'mode' | 'player1Name' | 'player2Name' | 'player3Name'>): string {
  return match.mode === 'trio'
    ? `${match.player1Name} vs ${match.player2Name} vs ${match.player3Name ?? '选手3'}`
    : `${match.player1Name} vs ${match.player2Name}`;
}

export function formatArchivedMatchTitle(
  match: Pick<MatchRecord, 'createdAt' | 'mode' | 'player1Name' | 'player2Name' | 'player3Name'>,
): string {
  return `${formatDateOnly(match.createdAt)} ${formatMatchPlayersLabel(match)}`;
}


/** 仅时分秒，不含日期 */
export function formatClockTime(timestamp: number): string {
  return dayjs(timestamp).format('HH:mm:ss');
}

/** 时长仅分:秒，不含小时 */
export function formatDurationMinutesOnly(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatRoundTimeLine(
  startTime: number,
  endTime: number,
  durationMs: number,
): string {
  return `${formatClockTime(startTime)} — ${formatClockTime(endTime)}（${formatDurationMinutesOnly(durationMs)}）`;
}
