import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { applyPlayerNames } from '../domain/matchUtils';
import { buildRoundRecord } from '../domain/scoring';
import type {
  AppView,
  ConfirmModalType,
  MatchRecord,
  PendingTag,
  PlayerId,
  ScoreItemType,
  SessionState,
} from '../domain/types';
import { validateAddTag, validateSubmit } from '../domain/validators';
import {
  archiveMatch,
  createAndSaveMatch,
  deleteMatches,
  getAllMatches,
  getLatestInProgressMatch,
  getMatchById,
  saveMatch,
} from '../repositories/matchRepository';

function createSessionFromMatch(match: MatchRecord): SessionState {
  return {
    pendingTags: [],
    letGan: { player1: false, player2: false },
    player1Name: match.player1Name,
    player2Name: match.player2Name,
    submitError: null,
    toastMessage: null,
  };
}

interface MatchState {
  loading: boolean;
  match: MatchRecord | null;
  session: SessionState;
  confirmModal: ConfirmModalType;
  pendingDeleteIds: string[];
  view: AppView;
  historyMatches: MatchRecord[];
  historyLoading: boolean;
}

type MatchAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'INIT_MATCH'; match: MatchRecord }
  | { type: 'SET_MATCH'; match: MatchRecord }
  | { type: 'SET_LET_GAN'; player: PlayerId; checked: boolean }
  | { type: 'SET_PLAYER_NAME'; player: PlayerId; name: string }
  | { type: 'ADD_TAG'; tag: PendingTag }
  | { type: 'REMOVE_TAG'; id: string }
  | { type: 'SET_SUBMIT_ERROR'; message: string | null }
  | { type: 'SET_TOAST'; message: string | null }
  | { type: 'CLEAR_PENDING' }
  | { type: 'RESET_LET_GAN' }
  | { type: 'SET_CONFIRM_MODAL'; modal: ConfirmModalType }
  | { type: 'SET_PENDING_DELETE_IDS'; ids: string[] }
  | { type: 'SET_VIEW'; view: AppView }
  | { type: 'SET_HISTORY_MATCHES'; matches: MatchRecord[] }
  | { type: 'SET_HISTORY_LOADING'; loading: boolean };

const initialSession: SessionState = {
  pendingTags: [],
  letGan: { player1: false, player2: false },
  player1Name: '',
  player2Name: '',
  submitError: null,
  toastMessage: null,
};

const initialState: MatchState = {
  loading: true,
  match: null,
  session: initialSession,
  confirmModal: null,
  pendingDeleteIds: [],
  view: 'scoring',
  historyMatches: [],
  historyLoading: false,
};

function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'INIT_MATCH':
      return {
        ...state,
        loading: false,
        match: action.match,
        session: createSessionFromMatch(action.match),
        confirmModal: null,
        view: 'scoring',
      };
    case 'SET_MATCH':
      return {
        ...state,
        match: action.match,
        session: {
          ...state.session,
          player1Name: action.match.player1Name,
          player2Name: action.match.player2Name,
        },
      };
    case 'SET_LET_GAN': {
      const key = action.player === 1 ? 'player1' : 'player2';
      return {
        ...state,
        session: {
          ...state.session,
          letGan: { ...state.session.letGan, [key]: action.checked },
        },
      };
    }
    case 'SET_PLAYER_NAME': {
      const nameKey = action.player === 1 ? 'player1Name' : 'player2Name';
      return {
        ...state,
        session: { ...state.session, [nameKey]: action.name },
      };
    }
    case 'ADD_TAG':
      return {
        ...state,
        session: {
          ...state.session,
          pendingTags: [...state.session.pendingTags, action.tag],
          submitError: null,
        },
      };
    case 'REMOVE_TAG':
      return {
        ...state,
        session: {
          ...state.session,
          pendingTags: state.session.pendingTags.filter((t) => t.id !== action.id),
          submitError: null,
        },
      };
    case 'SET_SUBMIT_ERROR':
      return {
        ...state,
        session: { ...state.session, submitError: action.message },
      };
    case 'SET_TOAST':
      return {
        ...state,
        session: { ...state.session, toastMessage: action.message },
      };
    case 'CLEAR_PENDING':
      return {
        ...state,
        session: {
          ...state.session,
          pendingTags: [],
          submitError: null,
        },
      };
    case 'RESET_LET_GAN':
      return {
        ...state,
        session: {
          ...state.session,
          letGan: { player1: false, player2: false },
        },
      };
    case 'SET_CONFIRM_MODAL':
      return { ...state, confirmModal: action.modal };
    case 'SET_PENDING_DELETE_IDS':
      return { ...state, pendingDeleteIds: action.ids };
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SET_HISTORY_MATCHES':
      return { ...state, historyMatches: action.matches };
    case 'SET_HISTORY_LOADING':
      return { ...state, historyLoading: action.loading };
    default:
      return state;
  }
}

interface MatchContextValue {
  loading: boolean;
  match: MatchRecord | null;
  session: SessionState;
  confirmModal: ConfirmModalType;
  pendingDeleteIds: string[];
  view: AppView;
  historyMatches: MatchRecord[];
  historyLoading: boolean;
  isReadOnly: boolean;
  addScoreTag: (player: PlayerId, type: ScoreItemType) => void;
  removePendingTag: (id: string) => void;
  setLetGan: (player: PlayerId, checked: boolean) => void;
  setPlayerName: (player: PlayerId, name: string) => void;
  submitRound: () => Promise<void>;
  openNewMatchModal: () => void;
  confirmNewMatch: () => Promise<void>;
  openArchiveModal: () => void;
  closeConfirmModal: () => void;
  confirmArchive: () => Promise<void>;
  openHistory: () => Promise<void>;
  closeHistory: () => void;
  loadMatchFromHistory: (id: string) => Promise<void>;
  refreshHistoryMatches: () => Promise<void>;
  requestDeleteHistory: (ids: string[]) => void;
  confirmDeleteHistory: () => Promise<void>;
}

const MatchContext = createContext<MatchContextValue | null>(null);

function generateTagId(): string {
  return `tag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function MatchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(matchReducer, initialState);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        let match = await getLatestInProgressMatch();
        if (!match) {
          match = await createAndSaveMatch();
        }
        if (!cancelled) {
          dispatch({ type: 'INIT_MATCH', match });
        }
      } catch {
        if (!cancelled) {
          dispatch({ type: 'SET_LOADING', loading: false });
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.session.toastMessage) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_TOAST', message: null });
    }, 2500);
    return () => clearTimeout(timer);
  }, [state.session.toastMessage]);

  const isReadOnly = state.match?.status === 'archived';

  const addScoreTag = useCallback(
    (player: PlayerId, type: ScoreItemType) => {
      if (!state.match || isReadOnly) return;

      const isLetGan =
        player === 1
          ? state.session.letGan.player1
          : state.session.letGan.player2;

      const result = validateAddTag(state.session.pendingTags, player, type);
      if (!result.ok) {
        dispatch({ type: 'SET_TOAST', message: result.message });
        return;
      }

      dispatch({
        type: 'ADD_TAG',
        tag: {
          id: generateTagId(),
          player,
          type,
          isLetGan,
        },
      });
    },
    [state.match, state.session, isReadOnly],
  );

  const removePendingTag = useCallback(
    (id: string) => {
      if (isReadOnly) return;
      dispatch({ type: 'REMOVE_TAG', id });
    },
    [isReadOnly],
  );

  const setLetGan = useCallback(
    (player: PlayerId, checked: boolean) => {
      if (isReadOnly) return;
      dispatch({ type: 'SET_LET_GAN', player, checked });
    },
    [isReadOnly],
  );

  const setPlayerName = useCallback(
    (player: PlayerId, name: string) => {
      if (isReadOnly) return;
      dispatch({ type: 'SET_PLAYER_NAME', player, name });
    },
    [isReadOnly],
  );

  const submitRound = useCallback(async () => {
    if (!state.match || isReadOnly) return;

    const validation = validateSubmit(state.session.pendingTags);
    if (!validation.ok) {
      if (validation.message) {
        dispatch({ type: 'SET_SUBMIT_ERROR', message: validation.message });
      }
      return;
    }

    const endTime = Date.now();
    const round = buildRoundRecord(
      state.match.currentRoundNumber,
      state.match.currentRoundStartTime,
      endTime,
      state.session.pendingTags,
    );

    const updated = applyPlayerNames(
      {
        ...state.match,
        rounds: [...state.match.rounds, round],
        currentRoundNumber: state.match.currentRoundNumber + 1,
        currentRoundStartTime: endTime,
      },
      state.session.player1Name,
      state.session.player2Name,
    );

    await saveMatch(updated);
    dispatch({ type: 'SET_MATCH', match: updated });
    dispatch({ type: 'CLEAR_PENDING' });
    dispatch({ type: 'RESET_LET_GAN' });
  }, [state.match, state.session, isReadOnly]);

  const openNewMatchModal = useCallback(() => {
    dispatch({ type: 'SET_CONFIRM_MODAL', modal: 'newMatch' });
  }, []);

  const confirmNewMatch = useCallback(async () => {
    const match = await createAndSaveMatch();
    dispatch({ type: 'INIT_MATCH', match });
    dispatch({ type: 'SET_CONFIRM_MODAL', modal: null });
  }, []);

  const openArchiveModal = useCallback(() => {
    if (!state.match || isReadOnly) return;
    dispatch({ type: 'SET_CONFIRM_MODAL', modal: 'archive' });
  }, [state.match, isReadOnly]);

  const closeConfirmModal = useCallback(() => {
    dispatch({ type: 'SET_CONFIRM_MODAL', modal: null });
    dispatch({ type: 'SET_PENDING_DELETE_IDS', ids: [] });
  }, []);

  const confirmArchive = useCallback(async () => {
    if (!state.match) return;
    const withNames = applyPlayerNames(
      state.match,
      state.session.player1Name,
      state.session.player2Name,
    );
    const archived = await archiveMatch(withNames);
    dispatch({ type: 'SET_MATCH', match: archived });
    dispatch({ type: 'SET_CONFIRM_MODAL', modal: null });
  }, [state.match, state.session.player1Name, state.session.player2Name]);

  const openHistory = useCallback(async () => {
    dispatch({ type: 'SET_VIEW', view: 'history' });
    dispatch({ type: 'SET_HISTORY_LOADING', loading: true });
    const matches = await getAllMatches();
    dispatch({ type: 'SET_HISTORY_MATCHES', matches });
    dispatch({ type: 'SET_HISTORY_LOADING', loading: false });
  }, []);

  const closeHistory = useCallback(() => {
    dispatch({ type: 'SET_VIEW', view: 'scoring' });
  }, []);

  const loadMatchFromHistory = useCallback(async (id: string) => {
    const match = await getMatchById(id);
    if (!match) return;
    dispatch({ type: 'INIT_MATCH', match });
  }, []);

  const refreshHistoryMatches = useCallback(async () => {
    const matches = await getAllMatches();
    dispatch({ type: 'SET_HISTORY_MATCHES', matches });
  }, []);

  const requestDeleteHistory = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    dispatch({ type: 'SET_PENDING_DELETE_IDS', ids });
    dispatch({ type: 'SET_CONFIRM_MODAL', modal: 'deleteHistory' });
  }, []);

  const confirmDeleteHistory = useCallback(async () => {
    const ids = state.pendingDeleteIds;
    if (ids.length === 0) return;

    const deletedCurrent =
      state.match !== null && ids.includes(state.match.id);

    await deleteMatches(ids);
    const matches = await getAllMatches();
    dispatch({ type: 'SET_HISTORY_MATCHES', matches });
    dispatch({ type: 'SET_CONFIRM_MODAL', modal: null });
    dispatch({ type: 'SET_PENDING_DELETE_IDS', ids: [] });

    if (deletedCurrent) {
      let match = await getLatestInProgressMatch();
      if (!match) {
        match = await createAndSaveMatch();
      }
      dispatch({ type: 'INIT_MATCH', match });
    }
  }, [state.pendingDeleteIds, state.match]);

  const value = useMemo<MatchContextValue>(
    () => ({
      loading: state.loading,
      match: state.match,
      session: state.session,
      confirmModal: state.confirmModal,
      pendingDeleteIds: state.pendingDeleteIds,
      view: state.view,
      historyMatches: state.historyMatches,
      historyLoading: state.historyLoading,
      isReadOnly,
      addScoreTag,
      removePendingTag,
      setLetGan,
      setPlayerName,
      submitRound,
      openNewMatchModal,
      confirmNewMatch,
      openArchiveModal,
      closeConfirmModal,
      confirmArchive,
      openHistory,
      closeHistory,
      loadMatchFromHistory,
      refreshHistoryMatches,
      requestDeleteHistory,
      confirmDeleteHistory,
    }),
    [
      state.loading,
      state.match,
      state.session,
      state.confirmModal,
      state.pendingDeleteIds,
      state.view,
      state.historyMatches,
      state.historyLoading,
      isReadOnly,
      addScoreTag,
      removePendingTag,
      setLetGan,
      setPlayerName,
      submitRound,
      openNewMatchModal,
      confirmNewMatch,
      openArchiveModal,
      closeConfirmModal,
      confirmArchive,
      openHistory,
      closeHistory,
      loadMatchFromHistory,
      refreshHistoryMatches,
      requestDeleteHistory,
      confirmDeleteHistory,
    ],
  );

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
}

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext);
  if (!ctx) {
    throw new Error('useMatch must be used within MatchProvider');
  }
  return ctx;
}
