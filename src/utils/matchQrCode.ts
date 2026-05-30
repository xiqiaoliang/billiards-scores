import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { buildRoundRecord } from '../domain/scoring';
import type {
  MatchRecord,
  MatchStatus,
  PendingTag,
  PlayerId,
  RoundRecord,
  ScoreItemType,
} from '../domain/types';

const QR_PREFIX_V2 = 'bs:v2:';
const QR_PREFIX_V3 = 'bs:v3:';
const QR_PREFIX = QR_PREFIX_V3;
const FIELD_SEP = '|';
const LIST_SEP = '~';
const ROUND_SEP = '^';
const TAG_SEP = '!';
const STAT_SEP = ',';

const SCORE_TYPES: ScoreItemType[] = [
  'foul',
  'let_foul',
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
  if (value.player !== 1 && value.player !== 2 && value.player !== 3) return null;
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

  let player3: RoundRecord['player3'];
  if (isObject(value.player3)) {
    if (
      typeof value.player3.baseScore !== 'number'
      || typeof value.player3.extraScore !== 'number'
      || typeof value.player3.roundTotal !== 'number'
    ) {
      return null;
    }
    player3 = {
      baseScore: value.player3.baseScore,
      extraScore: value.player3.extraScore,
      roundTotal: value.player3.roundTotal,
    };
  }

  return {
    roundNumber: value.roundNumber,
    startTime: value.startTime,
    endTime: value.endTime,
    durationMs: value.durationMs,
    playerOrder:
      Array.isArray(value.playerOrder) && value.playerOrder.every((p) => p === 1 || p === 2 || p === 3)
        ? value.playerOrder
        : [1, 2],
    tags,
    player1: value.player1 as RoundRecord['player1'],
    player2: value.player2 as RoundRecord['player2'],
    player3,
  };
}

function normalizeMatchRecord(value: unknown): MatchRecord | null {
  if (!isObject(value)) return null;
  if (typeof value.id !== 'string') return null;
  if (!isValidMatchStatus(value.status)) return null;
  if (typeof value.createdAt !== 'number') return null;
  if (typeof value.player1Name !== 'string') return null;
  if (typeof value.player2Name !== 'string') return null;
  if (value.player3Name != null && typeof value.player3Name !== 'string') return null;
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
    mode: value.mode === 'trio' ? 'trio' : 'duel',
    status: value.status,
    createdAt: value.createdAt,
    player1Name: value.player1Name,
    player2Name: value.player2Name,
    player3Name: typeof value.player3Name === 'string' ? value.player3Name : undefined,
    currentPlayerOrder:
      Array.isArray(value.currentPlayerOrder) && value.currentPlayerOrder.every((p) => p === 1 || p === 2 || p === 3)
        ? value.currentPlayerOrder
        : value.mode === 'trio'
          ? [1, 2, 3]
          : [1, 2],
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

function decodePart(value: string): string {
  return decodeURIComponent(value);
}

function decodeTag(raw: string): PendingTag | null {
  const parts = raw.split(STAT_SEP);
  if (parts.length !== 5) return null;
  const [idRaw, playerRaw, typeRaw, letGanRaw, heiJinRaw] = parts;
  const player = Number(playerRaw);
  const typeIndex = Number(typeRaw);
  if ((player !== 1 && player !== 2 && player !== 3) || !Number.isInteger(typeIndex)) return null;
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
    playerOrder: [1, 2],
    tags: tags as PendingTag[],
    player1,
    player2,
  };
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

function toBase36(value: number): string {
  return Math.max(0, Math.round(value)).toString(36);
}

function fromBase36(value: string): number {
  if (!value || !/^[0-9a-z]+$/i.test(value)) return NaN;
  return Number.parseInt(value, 36);
}

function encodeText(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeText(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    Math.ceil(value.length / 4) * 4,
    '=',
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeTagV3(tag: PendingTag): string {
  const typeIndex = SCORE_TYPES.indexOf(tag.type);
  const flags = (tag.isLetGan ? 1 : 0) | (tag.isHeiJin ? 2 : 0);
  return `${tag.player}${typeIndex.toString(36)}${flags.toString(36)}`;
}

function decodeTagsV3(raw: string, roundNumber: number, mode: MatchRecord['mode']): PendingTag[] | null {
  if (raw.length % 3 !== 0) return null;

  const tags: PendingTag[] = [];
  for (let i = 0; i < raw.length; i += 3) {
    const player = Number(raw[i]);
    const typeIndex = fromBase36(raw[i + 1]);
    const flags = fromBase36(raw[i + 2]);
    const type = SCORE_TYPES[typeIndex];
    const validPlayer = mode === 'trio'
      ? (player === 1 || player === 2 || player === 3)
      : (player === 1 || player === 2);

    if (!validPlayer || !type || !Number.isFinite(flags)) {
      return null;
    }

    tags.push({
      id: `qr-${roundNumber}-${tags.length + 1}`,
      player: player as PlayerId,
      type,
      isLetGan: (flags & 1) !== 0,
      isHeiJin: (flags & 2) !== 0,
    });
  }

  return tags;
}

function encodePlayerOrderV3(playerOrder: PlayerId[]): string {
  return playerOrder.join('');
}

function decodePlayerOrderV3(raw: string, mode: MatchRecord['mode']): PlayerId[] | null {
  if (!raw) {
    return mode === 'trio' ? [1, 2, 3] : [1, 2];
  }

  const parsed = raw.split('').map((v) => Number(v));
  if (!parsed.every((p) => p === 1 || p === 2 || p === 3)) return null;
  const unique = Array.from(new Set(parsed)) as PlayerId[];

  if (mode === 'trio') {
    if (unique.length !== 3 || ![1, 2, 3].every((p) => unique.includes(p as PlayerId))) {
      return null;
    }
    return unique;
  }

  const duelOrder = unique.filter((p) => p === 1 || p === 2);
  if (duelOrder.length !== 2 || !duelOrder.includes(1) || !duelOrder.includes(2)) {
    return null;
  }
  return duelOrder;
}

function encodeRoundV3(round: RoundRecord, createdAt: number, mode: MatchRecord['mode']): string {
  const startOffsetSec = Math.max(0, (round.startTime - createdAt) / 1000);
  const durationSec = Math.max(0, (round.durationMs || round.endTime - round.startTime) / 1000);
  if (mode === 'trio') {
    return [
      toBase36(startOffsetSec),
      toBase36(durationSec),
      encodePlayerOrderV3(round.playerOrder ?? [1, 2, 3]),
      round.tags.map(encodeTagV3).join(''),
    ].join('.');
  }

  return [
    toBase36(startOffsetSec),
    toBase36(durationSec),
    round.tags.map(encodeTagV3).join(''),
  ].join('.');
}

function decodeRoundV3(
  raw: string,
  roundNumber: number,
  createdAt: number,
  mode: MatchRecord['mode'],
): RoundRecord | null {
  const parts = raw.split('.');
  if (parts.length !== 3 && parts.length !== 4) return null;

  const startOffsetSec = fromBase36(parts[0]);
  const durationSec = fromBase36(parts[1]);
  if (![startOffsetSec, durationSec].every(Number.isFinite)) return null;

  const defaultPlayerOrder: PlayerId[] = mode === 'trio' ? [1, 2, 3] : [1, 2];
  const playerOrder = parts.length === 4
    ? decodePlayerOrderV3(parts[2], mode)
    : defaultPlayerOrder;
  if (!playerOrder) return null;

  const tagsRaw = parts.length === 4 ? parts[3] : parts[2];
  const tags = decodeTagsV3(tagsRaw, roundNumber, mode);
  if (!tags) return null;

  const startTime = createdAt + startOffsetSec * 1000;
  const endTime = startTime + durationSec * 1000;
  return buildRoundRecord(roundNumber, startTime, endTime, tags, mode, playerOrder);
}

export function encodeMatchCompactV3(match: MatchRecord): string {
  const modeCode = match.mode === 'trio' ? '1' : '0';
  const statusCode = match.status === 'archived' ? '1' : '0';
  const syncCode = match.syncStatus === 'pending' ? '1' : match.syncStatus === 'synced' ? '2' : '0';
  const encodedNames = [encodeText(match.player1Name), encodeText(match.player2Name)];
  if (match.mode === 'trio') {
    encodedNames.push(encodeText(match.player3Name ?? '选手3'));
  }
  const names = encodedNames.join('.');
  const rounds = match.rounds
    .map((round) => encodeRoundV3(round, match.createdAt, match.mode))
    .join(';');
  const currentOrder = encodePlayerOrderV3(
    match.currentPlayerOrder ?? (match.mode === 'trio' ? [1, 2, 3] : [1, 2]),
  );

  return [
    `${statusCode}${syncCode}${modeCode}`,
    toBase36(match.createdAt),
    names,
    currentOrder,
    rounds,
  ].join('|');
}

function decodeMatchCompactV3(raw: string): MatchRecord | null {
  const fields = raw.split('|');
  if (fields.length !== 4 && fields.length !== 5) return null;

  const [meta, createdAtRaw, namesRaw, currentOrderRaw = '', roundsRaw = ''] =
    fields.length === 5
      ? fields
      : [fields[0], fields[1], fields[2], '', fields[3]];
  const createdAt = fromBase36(createdAtRaw);
  if (!Number.isFinite(createdAt)) return null;

  const names = namesRaw.split('.');
  if (names.length !== 2 && names.length !== 3) return null;

  const mode: MatchRecord['mode'] = meta[2] === '1' || names.length === 3 ? 'trio' : 'duel';

  let player1Name: string;
  let player2Name: string;
  let player3Name: string | undefined;
  try {
    player1Name = decodeText(names[0]);
    player2Name = decodeText(names[1]);
    if (mode === 'trio') {
      player3Name = names[2] ? decodeText(names[2]) : '选手3';
    }
  } catch {
    return null;
  }

  const currentPlayerOrder = decodePlayerOrderV3(currentOrderRaw, mode);
  if (!currentPlayerOrder) return null;

  const rounds = roundsRaw
    ? roundsRaw.split(';').map((round, index) => decodeRoundV3(round, index + 1, createdAt, mode))
    : [];
  if (rounds.some((round) => !round)) return null;

  const lastRound = rounds.length > 0 ? (rounds[rounds.length - 1] as RoundRecord) : null;
  const syncCode = meta[1] ?? '0';

  return normalizeMatchRecord({
    mode,
    id: `qr-${createdAtRaw}`,
    status: meta[0] === '1' ? 'archived' : 'in_progress',
    createdAt,
    player1Name,
    player2Name,
    player3Name,
    currentPlayerOrder,
    rounds: rounds as RoundRecord[],
    currentRoundNumber: rounds.length + 1,
    currentRoundStartTime: lastRound?.endTime ?? createdAt,
    syncStatus: syncCode === '1' ? 'pending' : syncCode === '2' ? 'synced' : 'local',
  });
}

function decodeMatchJson(raw: string): MatchRecord | null {
  try {
    const text = decodeText(raw);
    return normalizeMatchRecord(JSON.parse(text));
  } catch {
    return null;
  }
}

export function encodeMatchToQrPayload(match: MatchRecord): string {
  const normalized = normalizeMatchRecord(match) ?? match;
  return `${QR_PREFIX}${encodeMatchCompactV3(normalized)}`;
}

export function decodeMatchFromQrPayload(payload: string): MatchRecord | null {
  const normalized = payload.trim().replace(/\s/g, '');
  if (normalized.startsWith(QR_PREFIX_V3)) {
    const raw = normalized.slice(QR_PREFIX_V3.length);
    return decodeMatchJson(raw) ?? decodeMatchCompactV3(raw);
  }
  if (normalized.startsWith(QR_PREFIX_V2)) {
    return decodeMatchCompact(normalized.slice(QR_PREFIX_V2.length));
  }
  return null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isIOSSafariBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iP(ad|hone|od)/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIOS && /Safari/.test(ua) && !/(CriOS|FxiOS|EdgiOS|MicroMessenger)/.test(ua);
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function generateQrSvgDataUrl(payload: string, size: number): Promise<string> {
  const svg = await QRCode.toString(payload, {
    type: 'svg',
    width: size,
    margin: 4,
    errorCorrectionLevel: 'L',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
  return svgToDataUrl(svg);
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
  // iPhone Safari is prone to canvas/toDataURL failures in qrcode's PNG renderer.
  // SVG avoids the canvas path and keeps the same payload scannable.
  if (isIOSSafariBrowser()) {
    return generateQrSvgDataUrl(payload, size);
  }

  try {
    return await QRCode.toDataURL(payload, {
      width: size,
      margin: 4,
      errorCorrectionLevel: 'L',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      rendererOpts: {
        quality: 1,
      },
    });
  } catch {
    return generateQrSvgDataUrl(payload, size);
  }
}

export async function generateMatchQrShareImage(
  match: MatchRecord,
): Promise<string> {
  // iOS Safari may fail drawing CJK text/font fallback on canvas in some versions.
  // Return pure QR image for maximum compatibility.
  if (isIOSSafariBrowser()) {
    return generateMatchQrDataUrl(match, 640);
  }

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
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${match.player1Name}${match.mode === 'trio' ? `/${match.player2Name}/${match.player3Name ?? '选手3'}` : ` vs ${match.player2Name}`}`,
    canvasWidth / 2,
    padding + 24,
  );

  ctx.fillStyle = '#666666';
  ctx.font = '14px sans-serif';
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

function isQrPayloadText(text: string): boolean {
  const normalized = text.trim().replace(/\s/g, '');
  return normalized.startsWith(QR_PREFIX_V3)
    || normalized.startsWith(QR_PREFIX_V2);
}

export async function decodeFromImportFile(file: File): Promise<string | null> {
  if (isTextImportFile(file)) {
    const text = await readFileAsText(file);
    if (isQrPayloadText(text)) {
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
  player3Name?: string,
): string {
  const datePart = formatDateForFilename(createdAt);
  const names = player3Name
    ? `${player1Name}vs${player2Name}vs${player3Name}`
    : `${player1Name}vs${player2Name}`;
  return sanitizeFilename(
    `台球记分二维码-${names}-${datePart}.png`,
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
