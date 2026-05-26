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
