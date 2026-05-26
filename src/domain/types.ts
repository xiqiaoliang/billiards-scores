export type MatchStatus = 'in_progress' | 'archived';

export type SyncStatus = 'local' | 'pending' | 'synced';

export type ScoreItemType =
  | 'foul'
  | 'break_foul'
  | 'split'
  | 'normal_win'
  | 'small_gold'
  | 'big_gold';

export type PlayerId = 1 | 2;

export interface PendingTag {
  id: string;
  player: PlayerId;
  type: ScoreItemType;
  isLetGan: boolean;
}

export interface RoundPlayerStats {
  baseScore: number;
  extraScore: number;
  roundTotal: number;
}

export interface RoundRecord {
  roundNumber: number;
  startTime: number;
  endTime: number;
  durationMs: number;
  tags: PendingTag[];
  player1: RoundPlayerStats;
  player2: RoundPlayerStats;
}

export interface MatchRecord {
  id: string;
  status: MatchStatus;
  createdAt: number;
  player1Name: string;
  player2Name: string;
  rounds: RoundRecord[];
  currentRoundNumber: number;
  currentRoundStartTime: number;
  syncStatus?: SyncStatus;
}

export interface PlayerOverviewStats {
  foulCount: number;
  splitCount: number;
  normalWinCount: number;
  smallGoldCount: number;
  bigGoldCount: number;
  extraScore: number;
  totalScore: number;
}

export interface MatchOverview {
  player1: PlayerOverviewStats;
  player2: PlayerOverviewStats;
  netScore: number;
}

export interface LetGanState {
  player1: boolean;
  player2: boolean;
}

export interface SessionState {
  pendingTags: PendingTag[];
  letGan: LetGanState;
  player1Name: string;
  player2Name: string;
  submitError: string | null;
  toastMessage: string | null;
}

export type AppView = 'scoring' | 'history';

export type ConfirmModalType =
  | 'archive'
  | 'newMatch'
  | 'deleteHistory'
  | null;

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };
