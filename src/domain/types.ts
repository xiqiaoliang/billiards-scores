export type MatchStatus = 'in_progress' | 'archived';

export type MatchMode = 'duel' | 'trio';

export type SyncStatus = 'local' | 'pending' | 'synced';

export type ScoreItemType =
  | 'foul'
  | 'let_foul'
  | 'break_foul'
  | 'split'
  | 'normal_win'
  | 'golden_9'
  | 'small_gold'
  | 'big_gold';

export type PlayerId = 1 | 2 | 3;

export interface PendingTag {
  id: string;
  player: PlayerId;
  type: ScoreItemType;
  isLetGan: boolean;
  isHeiJin: boolean;
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
  playerOrder: PlayerId[];
  tags: PendingTag[];
  player1: RoundPlayerStats;
  player2: RoundPlayerStats;
  player3?: RoundPlayerStats;
}

export interface MatchRecord {
  id: string;
  mode: MatchMode;
  status: MatchStatus;
  createdAt: number;
  player1Name: string;
  player2Name: string;
  player3Name?: string;
  currentPlayerOrder?: PlayerId[];
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
  player3?: PlayerOverviewStats;
  netScore: number;
}

export interface LetGanState {
  player1: boolean;
  player2: boolean;
  player3: boolean;
}

export interface SessionState {
  pendingTags: PendingTag[];
  letGan: LetGanState;
  heiJin: LetGanState;
  player1Name: string;
  player2Name: string;
  player3Name: string;
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
