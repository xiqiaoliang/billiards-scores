import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import type {
  MatchRecord,
  MatchStatus,
  PendingTag,
  PlayerId,
  RoundRecord,
  ScoreItemType,
} from '../domain/types';

const QR_PREFIX = 'bs:v2:';
const FIELD_SEP = '|';
const LIST_SEP = '~';
const ROUND_SEP = '^';
const TAG_SEP = '!';
const STAT_SEP = ',';

const SCORE_TYPES: ScoreItemType[] = [
  'foul',
  'break_foul',
  'split',
  'normal_win',
  'golden_9',
  'small_gold',
  'big_gold',
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidMatchStatus(value: unknown): value is MatchStatus {
  return value === 'in_progress' || value === 'archived';
}

function isValidScoreType(value: unknown): value is ScoreItemType {
  return typeof value === 'string' && SCORE_TYPES.includes(value as ScoreItemType);
}

function normalizePendingTag(value: unknown): PendingTag | null {
  if (!isObject(value)) return null;
  if (typeof value.id !== 'string') return null;
  if (value.player !== 1 && value.player !== 2) return null;
  if (!isValidScoreType(value.type)) return null;

  return {
    id: value.id,
    player: value.player as PlayerId,
    type: value.type,
    isLetGan: value.isLetGan === true,
    isHeiJin: value.isHeiJin === true,
  };
}

function normalizeRoundRecord(value: unknown): RoundRecord | null {
  if (!isObject(value)) return null;
  if (typeof value.roundNumber !== 'number') return null;
  if (typeof value.startTime !== 'number') return null;
  if (typeof value.endTime !== 'number') return null;
  if (typeof value.durationMs !== 'number') return null;
  if (!Array.isArray(value.tags)) return null;

  const tags: PendingTag[] = [];
  for (const tag of value.tags) {
    const normalized = normalizePendingTag(tag);
    if (!normalized) return null;
    tags.push(normalized);
  }

  for (const key of ['player1', 'player2'] as const) {
    const stats = value[key];
    if (!isObject(stats)) return null;
    if (typeof stats.baseScore !== 'number') return null;
    if (typeof stats.extraScore !== 'number') return null;
    if (typeof stats.roundTotal !== 'number') return null;
  }

  return {
    roundNumber: value.roundNumber,
    startTime: value.startTime,
    endTime: value.endTime,
    durationMs: value.durationMs,
    tags,
    player1: value.player1 as RoundRecord['player1'],
    player2: value.player2 as RoundRecord['player2'],
  };
}

function normalizeMatchRecord(value: unknown): MatchRecord | null {
  if (!isObject(value)) return null;
  if (typeof value.id !== 'string') return null;
  if (!isValidMatchStatus(value.status)) return null;
  if (typeof value.createdAt !== 'number') return null;
  if (typeof value.player1Name !== 'string') return null;
  if (typeof value.player2Name !== 'string') return null;
  if (!Array.isArray(value.rounds)) return null;
  if (typeof value.currentRoundNumber !== 'number') return null;
  if (typeof value.currentRoundStartTime !== 'number') return null;

  const rounds: RoundRecord[] = [];
  for (const round of value.rounds) {
    const normalized = normalizeRoundRecord(round);
    if (!normalized) return null;
    rounds.push(normalized);
  }

  return {
    id: value.id,
    status: value.status,
    createdAt: value.createdAt,
    player1Name: value.player1Name,
    player2Name: value.player2Name,
    rounds,
    currentRoundNumber: value.currentRoundNumber,
    currentRoundStartTime: value.currentRoundStartTime,
    syncStatus:
      value.syncStatus === 'pending' || value.syncStatus === 'synced'
        ? value.syncStatus
        : 'local',
  };
}

export function validateMatchRecord(data: unknown): data is MatchRecord {
  return normalizeMatchRecord(data) !== null;
}

function encodePart(value: string | number | boolean): string {
  return encodeURIComponent(String(value));
}

function decodePart(value: string): string {
  return decodeURIComponent(value);
}

function encodeTag(tag: PendingTag): string {
  return [
    encodePart(tag.id),
    String(tag.player),
    String(SCORE_TYPES.indexOf(tag.type)),
    tag.isLetGan ? '1' : '0',
    tag.isHeiJin ? '1' : '0',
  ].join(STAT_SEP);
}

function decodeTag(raw: string): PendingTag | null {
  const parts = raw.split(STAT_SEP);
  if (parts.length !== 5) return null;
  const [idRaw, playerRaw, typeRaw, letGanRaw, heiJinRaw] = parts;
  const player = Number(playerRaw);
  const typeIndex = Number(typeRaw);
  if ((player !== 1 && player !== 2) || !Number.isInteger(typeIndex)) return null;
  const type = SCORE_TYPES[typeIndex];
  if (!type) return null;
  try {
    return {
      id: decodePart(idRaw),
      player: player as PlayerId,
      type,
      isLetGan: letGanRaw === '1',
      isHeiJin: heiJinRaw === '1',
    };
  } catch {
    return null;
  }
}

function encodeRound(round: RoundRecord): string {
  const tagText = round.tags.map(encodeTag).join(TAG_SEP);
  const p1 = [round.player1.baseScore, round.player1.extraScore, round.player1.roundTotal].join(STAT_SEP);
  const p2 = [round.player2.baseScore, round.player2.extraScore, round.player2.roundTotal].join(STAT_SEP);
  return [
    round.roundNumber,
    round.startTime,
    round.endTime,
    round.durationMs,
    tagText,
    p1,
    p2,
  ].map(encodePart).join(ROUND_SEP);
}

function decodeRound(raw: string): RoundRecord | null {
  let parts: string[];
  try {
    parts = raw.split(ROUND_SEP).map(decodePart);
  } catch {
    return null;
  }
  if (parts.length !== 7) return null;

  const [roundNumberRaw, startTimeRaw, endTimeRaw, durationRaw, tagText, p1Raw, p2Raw] = parts;
  const roundNumber = Number(roundNumberRaw);
  const startTime = Number(startTimeRaw);
  const endTime = Number(endTimeRaw);
  const durationMs = Number(durationRaw);
  if (![roundNumber, startTime, endTime, durationMs].every(Number.isFinite)) return null;

  const parseStat = (s: string) => {
    const nums = s.split(STAT_SEP).map(Number);
    if (nums.length !== 3 || !nums.every(Number.isFinite)) return null;
    return { baseScore: nums[0], extraScore: nums[1], roundTotal: nums[2] };
  };

  const player1 = parseStat(p1Raw);
  const player2 = parseStat(p2Raw);
  if (!player1 || !player2) return null;

  const tags = tagText
    ? tagText.split(TAG_SEP).map(decodeTag)
    : [];
  if (tags.some((t) => !t)) return null;

  return {
    roundNumber,
    startTime,
    endTime,
    durationMs,
    tags: tags as PendingTag[],
    player1,
    player2,
  };
}

function encodeMatchCompact(match: MatchRecord): string {
  const statusCode = match.status === 'archived' ? '1' : '0';
  const syncCode = match.syncStatus === 'pending' ? '1' : match.syncStatus === 'synced' ? '2' : '0';
  const roundsText = match.rounds.map(encodeRound).join(LIST_SEP);

  return [
    encodePart(match.id),
    statusCode,
    String(match.createdAt),
    encodePart(match.player1Name),
    encodePart(match.player2Name),
    encodePart(roundsText),
    String(match.currentRoundNumber),
    String(match.currentRoundStartTime),
    syncCode,
  ].join(FIELD_SEP);
}

function decodeMatchCompact(raw: string): MatchRecord | null {
  const fields = raw.split(FIELD_SEP);
  if (fields.length !== 9) return null;

  let id: string;
  let player1Name: string;
  let player2Name: string;
  let roundsText: string;
  try {
    id = decodePart(fields[0]);
    player1Name = decodePart(fields[3]);
    player2Name = decodePart(fields[4]);
    roundsText = decodePart(fields[5]);
  } catch {
    return null;
  }

  const status = fields[1] === '1' ? 'archived' : 'in_progress';
  const createdAt = Number(fields[2]);
  const currentRoundNumber = Number(fields[6]);
  const currentRoundStartTime = Number(fields[7]);
  const syncStatus = fields[8] === '1' ? 'pending' : fields[8] === '2' ? 'synced' : 'local';

  if (![createdAt, currentRoundNumber, currentRoundStartTime].every(Number.isFinite)) return null;

  const rounds = roundsText
    ? roundsText.split(LIST_SEP).map(decodeRound)
    : [];
  if (rounds.some((r) => !r)) return null;

  return normalizeMatchRecord({
    id,
    status,
    createdAt,
    player1Name,
    player2Name,
    rounds: rounds as RoundRecord[],
    currentRoundNumber,
    currentRoundStartTime,
    syncStatus,
  });
}

export function encodeMatchToQrPayload(match: MatchRecord): string {
  const normalized = normalizeMatchRecord(match) ?? match;
  return `${QR_PREFIX}${encodeMatchCompact(normalized)}`;
}

export function decodeMatchFromQrPayload(payload: string): MatchRecord | null {
  const normalized = payload.trim().replace(/\s/g, '');
  if (!normalized.startsWith(QR_PREFIX)) return null;

  const raw = normalized.slice(QR_PREFIX.length);
  return decodeMatchCompact(raw);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function prepareImportedMatch(match: MatchRecord): MatchRecord {
  return {
    ...match,
    id: generateId(),
    syncStatus: 'local',
  };
}

export async function generateMatchQrDataUrl(
  match: MatchRecord,
  size = 640,
): Promise<string> {
  const payload = encodeMatchToQrPayload(match);
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 4,
    errorCorrectionLevel: 'L',
  });
}

export async function generateMatchQrShareImage(
  match: MatchRecord,
): Promise<string> {
  const qrDataUrl = await generateMatchQrDataUrl(match, 640);
  const qrImg = await loadImage(qrDataUrl);

  const padding = 32;
  const titleHeight = 56;
  const subtitleHeight = 28;
  const gap = 24;
  const canvasWidth = qrImg.width + padding * 2;
  const canvasHeight =
    padding + titleHeight + subtitleHeight + gap + qrImg.height + padding;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${match.player1Name} vs ${match.player2Name}`,
    canvasWidth / 2,
    padding + 24,
  );

  ctx.fillStyle = '#666666';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(
    `共 ${match.rounds.length} 局 · 扫码导入比赛记录`,
    canvasWidth / 2,
    padding + titleHeight + 18,
  );

  ctx.drawImage(
    qrImg,
    padding,
    padding + titleHeight + subtitleHeight + gap,
  );

  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function decodeQrFromImageData(imageData: ImageData): string | null {
  const { data, width, height } = imageData;
  const result = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
  return result?.data ?? null;
}

function decodeWithJsQRMultiScale(img: HTMLImageElement): string | null {
  const baseScale = img.width > 0 ? 640 / Math.min(img.width, img.height) : 1;
  const scales = [1, baseScale, 2, 0.5, 1.5, 3, 4].filter(
    (s, i, arr) => arr.indexOf(s) === i && s > 0,
  );

  for (const scale of scales) {
    let width = Math.max(1, Math.round(img.width * scale));
    let height = Math.max(1, Math.round(img.height * scale));
    const maxDim = 2400;
    const shrink = Math.min(1, maxDim / Math.max(width, height));
    width = Math.round(width * shrink);
    height = Math.round(height * shrink);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const payload = decodeQrFromImageData(
      ctx.getImageData(0, 0, width, height),
    );
    if (payload) return payload;
  }

  return null;
}

let html5FileScanner: Html5Qrcode | null = null;

function getHtml5FileScanner(): Html5Qrcode {
  if (!html5FileScanner) {
    const id = 'html5-qrcode-file-scanner';
    if (!document.getElementById(id)) {
      const el = document.createElement('div');
      el.id = id;
      el.style.display = 'none';
      document.body.appendChild(el);
    }
    html5FileScanner = new Html5Qrcode(id);
  }
  return html5FileScanner;
}

async function decodeWithHtml5Qrcode(file: File): Promise<string | null> {
  const scanner = getHtml5FileScanner();
  try {
    return await scanner.scanFile(file, false);
  } catch {
    return null;
  }
}

function isTextImportFile(file: File): boolean {
  if (file.type.startsWith('text/')) return true;
  const name = file.name.toLowerCase();
  return name.endsWith('.txt') || name.endsWith('.text');
}

async function readFileAsText(file: File): Promise<string> {
  return file.text();
}

export async function decodeQrFromImageFile(file: File): Promise<string | null> {
  const html5Result = await decodeWithHtml5Qrcode(file);
  if (html5Result) return html5Result;

  const img = await loadImageFromFile(file);
  return decodeWithJsQRMultiScale(img);
}

export async function decodeFromImportFile(file: File): Promise<string | null> {
  if (isTextImportFile(file)) {
    const text = await readFileAsText(file);
    if (text.trim().replace(/\s/g, '').startsWith(QR_PREFIX)) {
      return text;
    }
  }

  if (file.type.startsWith('image/') || !file.type) {
    return decodeQrFromImageFile(file);
  }

  return null;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取图片'));
    };
    img.src = url;
  });
}

export function buildMatchQrFilename(
  player1Name: string,
  player2Name: string,
  createdAt: number,
): string {
  const datePart = formatDateForFilename(createdAt);
  return sanitizeFilename(
    `台球记分二维码-${player1Name}vs${player2Name}-${datePart}.png`,
  );
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim();
}

function formatDateForFilename(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}
