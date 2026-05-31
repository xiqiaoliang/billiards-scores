import dayjs from 'dayjs';

export function formatDateTime(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
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
