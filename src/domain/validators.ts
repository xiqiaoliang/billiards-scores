import { VALIDATION_MESSAGES, WIN_TYPES } from './constants';
import type {
  MatchMode,
  PendingTag,
  PlayerId,
  ScoreItemType,
  ValidationResult,
} from './types';

function countTypeGlobal(tags: PendingTag[], type: ScoreItemType): number {
  return tags.filter((t) => t.type === type).length;
}

function hasWinTypeGlobal(tags: PendingTag[]): boolean {
  return tags.some((t) => WIN_TYPES.includes(t.type));
}

export function hasGolden9Exclusive(tags: PendingTag[]): boolean {
  return tags.some((t) => t.type === 'golden_9');
}

type ScoreTagPayload = Omit<PendingTag, 'id'>;

export type ScoreTagAction =
  | { kind: 'add'; tag: ScoreTagPayload }
  | { kind: 'replace'; removeIds: string[]; tag: ScoreTagPayload }
  | { kind: 'noop' }
  | { kind: 'error'; message: string };

function validateTrioAddTag(
  _pendingTags: PendingTag[],
  _player: PlayerId,
  type: ScoreItemType,
  isLetGan: boolean,
): ValidationResult {
  if (isLetGan && type === 'break_foul') {
    return { ok: false, message: '让杆状态不可选择开球犯规' };
  }
  if (isLetGan && type === 'foul') {
    return { ok: false, message: '让杆状态请使用让杆犯规' };
  }
  if (!isLetGan && type === 'let_foul') {
    return { ok: false, message: '让杆犯规仅在让杆状态可选' };
  }
  if (isLetGan && type === 'golden_9') {
    return { ok: false, message: '黄金9不支持让杆' };
  }

  return { ok: true };
}

export function resolveScoreTagAction(
  pendingTags: PendingTag[],
  player: PlayerId,
  type: ScoreItemType,
  isLetGan: boolean,
  isHeiJin: boolean,
  mode: MatchMode = 'duel',
): ScoreTagAction {
  const tag: ScoreTagPayload = { player, type, isLetGan, isHeiJin };

  if (hasGolden9Exclusive(pendingTags) && type !== 'golden_9') {
    return { kind: 'error', message: VALIDATION_MESSAGES.golden9Exclusive };
  }

  if (mode === 'trio') {
    const trioValidation = validateTrioAddTag(
      pendingTags,
      player,
      type,
      isLetGan,
    );
    if (!trioValidation.ok) {
      return { kind: 'error', message: trioValidation.message };
    }
  }

  if (type === 'foul' || type === 'let_foul') {
    const result = validateAddTag(pendingTags, player, type, mode, isLetGan);
    if (!result.ok) {
      return { kind: 'error', message: result.message };
    }
    return { kind: 'add', tag };
  }

  if (type === 'break_foul' || type === 'split') {
    const existing = pendingTags.find((t) => t.type === type);
    if (existing) {
      if (existing.player === player) {
        return { kind: 'noop' };
      }
      return { kind: 'replace', removeIds: [existing.id], tag };
    }
    return { kind: 'add', tag };
  }

  if (WIN_TYPES.includes(type)) {
    const existingWin = pendingTags.find((t) => WIN_TYPES.includes(t.type));
    if (existingWin) {
      if (existingWin.player === player && existingWin.type === type) {
        return { kind: 'noop' };
      }
      return { kind: 'replace', removeIds: [existingWin.id], tag };
    }
    return { kind: 'add', tag };
  }

  return { kind: 'add', tag };
}

export function validateAddTag(
  pendingTags: PendingTag[],
  _player: PlayerId,
  type: ScoreItemType,
  mode: MatchMode = 'duel',
  isLetGan = false,
): ValidationResult {
  if (hasGolden9Exclusive(pendingTags) && type !== 'golden_9') {
    return { ok: false, message: VALIDATION_MESSAGES.golden9Exclusive };
  }

  if (!isLetGan && type === 'let_foul') {
    return { ok: false, message: '让杆犯规仅在让杆状态可选' };
  }

  if (mode === 'trio') {
    return validateTrioAddTag(pendingTags, _player, type, isLetGan);
  }

  if (type === 'break_foul') {
    if (countTypeGlobal(pendingTags, 'break_foul') >= 1) {
      return { ok: false, message: VALIDATION_MESSAGES.breakFoulGlobal };
    }
  }

  if (type === 'split') {
    if (countTypeGlobal(pendingTags, 'split') >= 1) {
      return { ok: false, message: VALIDATION_MESSAGES.splitGlobal };
    }
  }

  if (WIN_TYPES.includes(type)) {
    if (hasWinTypeGlobal(pendingTags)) {
      return { ok: false, message: VALIDATION_MESSAGES.winGlobal };
    }
  }

  return { ok: true };
}

export function validateSubmit(
  pendingTags: PendingTag[],
  mode: MatchMode = 'duel',
): ValidationResult {
  if (pendingTags.length === 0) {
    return { ok: false, message: '' };
  }

  if (!hasWinTypeGlobal(pendingTags)) {
    return { ok: false, message: VALIDATION_MESSAGES.winRequired };
  }

  if (countTypeGlobal(pendingTags, 'break_foul') > 1) {
    return { ok: false, message: VALIDATION_MESSAGES.breakFoulGlobal };
  }

  if (countTypeGlobal(pendingTags, 'split') > 1) {
    return { ok: false, message: VALIDATION_MESSAGES.splitGlobal };
  }

  const winCount = pendingTags.filter((t) => WIN_TYPES.includes(t.type)).length;
  if (winCount > 1) {
    return { ok: false, message: VALIDATION_MESSAGES.winGlobal };
  }

  if (mode === 'trio') {
    for (const tag of pendingTags) {
      if (tag.isLetGan && tag.type === 'break_foul') {
        return { ok: false, message: '让杆状态不可选择开球犯规' };
      }
      if (tag.isLetGan && tag.type === 'golden_9') {
        return { ok: false, message: '黄金9不支持让杆' };
      }
      if (!tag.isLetGan && tag.type === 'let_foul') {
        return { ok: false, message: '让杆犯规仅在让杆状态可选' };
      }
    }
  }

  return { ok: true };
}
