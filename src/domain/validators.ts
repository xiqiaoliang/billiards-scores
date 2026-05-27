import { VALIDATION_MESSAGES, WIN_TYPES } from './constants';
import type { PendingTag, PlayerId, ScoreItemType, ValidationResult } from './types';

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

export function resolveScoreTagAction(
  pendingTags: PendingTag[],
  player: PlayerId,
  type: ScoreItemType,
  isLetGan: boolean,
  isHeiJin: boolean,
): ScoreTagAction {
  const tag: ScoreTagPayload = { player, type, isLetGan, isHeiJin };

  if (hasGolden9Exclusive(pendingTags)) {
    return { kind: 'error', message: VALIDATION_MESSAGES.golden9Exclusive };
  }

  if (type === 'foul') {
    const result = validateAddTag(pendingTags, player, type);
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
): ValidationResult {
  if (hasGolden9Exclusive(pendingTags)) {
    return { ok: false, message: VALIDATION_MESSAGES.golden9Exclusive };
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

export function validateSubmit(pendingTags: PendingTag[]): ValidationResult {
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

  return { ok: true };
}
