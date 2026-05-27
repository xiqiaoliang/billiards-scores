import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  applyPlayerNames,
  inferHeiJinFromTags,
  inferLetGanFromTags,
  rebuildRoundRecord,
} from '../domain/matchUtils';
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
import { validateSubmit, resolveScoreTagAction } from '../domain/validators';
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
    heiJin: { player1: false, player2: false },
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
  editingRoundNumber: number | null;
  editSession: SessionState;
}

type MatchAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'INIT_MATCH'; match: MatchRecord }
  | { type: 'SET_MATCH'; match: MatchRecord }
  | { type: 'SET_LET_GAN'; player: PlayerId; checked: boolean }
  | { type: 'SET_HEI_JIN'; player: PlayerId; checked: boolean }
  | { type: 'SET_PLAYER_NAME'; player: PlayerId; name: string }
  | { type: 'ADD_TAG'; tag: PendingTag }
  | { type: 'SET_PENDING_TAGS'; tags: PendingTag[] }
  | { type: 'REMOVE_TAG'; id: string }
  | { type: 'SET_SUBMIT_ERROR'; message: string | null }
  | { type: 'SET_TOAST'; message: string | null }
  | { type: 'CLEAR_PENDING' }
  | { type: 'RESET_LET_GAN' }
  | { type: 'RESET_HEI_JIN' }
  | { type: 'SET_CONFIRM_MODAL'; modal: ConfirmModalType }
  | { type: 'SET_PENDING_DELETE_IDS'; ids: string[] }
  | { type: 'SET_VIEW'; view: AppView }
  | { type: 'SET_HISTORY_MATCHES'; matches: MatchRecord[] }
  | { type: 'SET_HISTORY_LOADING'; loading: boolean }
  | { type: 'START_EDIT_ROUND'; roundNumber: number }
  | { type: 'CANCEL_EDIT_ROUND' };

const initialSession: SessionState = {
  pendingTags: [],
  letGan: { player1: false, player2: false },
  heiJin: { player1: false, player2: false },
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
  editingRoundNumber: null,
  editSession: initialSession,
};

function updateTagSession(
  state: MatchState,
  updater: (session: SessionState) => SessionState,
): MatchState {
  if (state.editingRoundNumber !== null) {
    return { ...state, editSession: updater(state.editSession) };
  }
  return { ...state, session: updater(state.session) };
}

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
        editingRoundNumber: null,
        editSession: createSessionFromMatch(action.match),
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
      const heiJinKey = action.player === 1 ? 'player1' : 'player2';
      return updateTagSession(state, (session) => ({
        ...session,
        letGan: { ...session.letGan, [key]: action.checked },
        heiJin: action.checked
          ? { ...session.heiJin, [heiJinKey]: false }
          : session.heiJin,
      }));
    }
    case 'SET_HEI_JIN': {
      const key = action.player === 1 ? 'player1' : 'player2';
      const letGanKey = action.player === 1 ? 'player1' : 'player2';
      return updateTagSession(state, (session) => ({
        ...session,
        heiJin: { ...session.heiJin, [key]: action.checked },
        letGan: action.checked
          ? { ...session.letGan, [letGanKey]: false }
          : session.letGan,
      }));
    }
    case 'SET_PLAYER_NAME': {
      const nameKey = action.player === 1 ? 'player1Name' : 'player2Name';
      return {
        ...state,
        session: { ...state.session, [nameKey]: action.name },
      };
    }
    case 'ADD_TAG':
      return updateTagSession(state, (session) => ({
        ...session,
        pendingTags: [...session.pendingTags, action.tag],
        submitError: null,
      }));
    case 'SET_PENDING_TAGS':
      return updateTagSession(state, (session) => ({
        ...session,
        pendingTags: action.tags,
        submitError: null,
      }));
    case 'REMOVE_TAG':
      return updateTagSession(state, (session) => ({
        ...session,
        pendingTags: session.pendingTags.filter((t) => t.id !== action.id),
        submitError: null,
      }));
    case 'SET_SUBMIT_ERROR':
      return updateTagSession(state, (session) => ({
        ...session,
        submitError: action.message,
      }));
    case 'SET_TOAST':
      return updateTagSession(state, (session) => ({
        ...session,
        toastMessage: action.message,
      }));
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
    case 'RESET_HEI_JIN':
      return {
        ...state,
        session: {
          ...state.session,
          heiJin: { player1: false, player2: false },
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
    case 'START_EDIT_ROUND': {
      if (!state.match) return state;
      const round = state.match.rounds.find(
        (r) => r.roundNumber === action.roundNumber,
      );
      if (!round) return state;
      const tags = round.tags.map((t) => ({
        ...t,
        isLetGan: t.isLetGan ?? false,
        isHeiJin: t.isHeiJin ?? false,
      }));
      return {
        ...state,
        editingRoundNumber: action.roundNumber,
        editSession: {
          pendingTags: tags,
          letGan: inferLetGanFromTags(tags),
          heiJin: inferHeiJinFromTags(tags),
          player1Name: state.session.player1Name,
          player2Name: state.session.player2Name,
          submitError: null,
          toastMessage: null,
        },
      };
    }
    case 'CANCEL_EDIT_ROUND':
      return {
        ...state,
        editingRoundNumber: null,
        editSession: {
          ...initialSession,
          player1Name: state.session.player1Name,
          player2Name: state.session.player2Name,
        },
      };
    default:
      return state;
  }
}

interface MatchContextValue {
  loading: boolean;
  match: MatchRecord | null;
  session: SessionState;
  activeSession: SessionState;
  editingRoundNumber: number | null;
  isEditingRound: boolean;
  tagFormReadOnly: boolean;
  confirmModal: ConfirmModalType;
  pendingDeleteIds: string[];
  view: AppView;
  historyMatches: MatchRecord[];
  historyLoading: boolean;
  isReadOnly: boolean;
  addScoreTag: (player: PlayerId, type: ScoreItemType) => void;
  addGolden9Tag: (player: PlayerId) => void;
  removePendingTag: (id: string) => void;
  setLetGan: (player: PlayerId, checked: boolean) => void;
  setHeiJin: (player: PlayerId, checked: boolean) => void;
  setPlayerName: (player: PlayerId, name: string) => void;
  submitRound: () => Promise<void>;
  beginEditRound: (roundNumber: number) => void;
  cancelEditRound: () => void;
  saveEditRound: () => Promise<void>;
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

  const activeSession =
    state.editingRoundNumber !== null ? state.editSession : state.session;

  useEffect(() => {
    if (!activeSession.toastMessage) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_TOAST', message: null });
    }, 2500);
    return () => clearTimeout(timer);
  }, [activeSession.toastMessage]);

  const isReadOnly = state.match?.status === 'archived';
  const isEditingRound = state.editingRoundNumber !== null;
  const tagFormReadOnly = isReadOnly && !isEditingRound;

  const addScoreTag = useCallback(
    (player: PlayerId, type: ScoreItemType) => {
      if (!state.match || tagFormReadOnly) return;

      const tagSession =
        state.editingRoundNumber !== null
          ? state.editSession
          : state.session;

      const isLetGan =
        player === 1 ? tagSession.letGan.player1 : tagSession.letGan.player2;
      const isHeiJin =
        player === 1 ? tagSession.heiJin.player1 : tagSession.heiJin.player2;

      const resolved = resolveScoreTagAction(
        tagSession.pendingTags,
        player,
        type,
        isLetGan,
        isHeiJin,
      );

      if (resolved.kind === 'noop') {
        return;
      }

      if (resolved.kind === 'error') {
        dispatch({ type: 'SET_TOAST', message: resolved.message });
        return;
      }

      if (resolved.kind === 'replace') {
        const remaining = tagSession.pendingTags.filter(
          (t) => !resolved.removeIds.includes(t.id),
        );
        dispatch({
          type: 'SET_PENDING_TAGS',
          tags: [
            ...remaining,
            { id: generateTagId(), ...resolved.tag },
          ],
        });
        return;
      }

      dispatch({
        type: 'ADD_TAG',
        tag: {
          id: generateTagId(),
          ...resolved.tag,
        },
      });
    },
    [state.match, state.session, state.editSession, state.editingRoundNumber, tagFormReadOnly],
  );

  const addGolden9Tag = useCallback(
    (player: PlayerId) => {
      if (!state.match || tagFormReadOnly) return;

      const tagSession =
        state.editingRoundNumber !== null
          ? state.editSession
          : state.session;

      const isLetGan =
        player === 1 ? tagSession.letGan.player1 : tagSession.letGan.player2;
      const isHeiJin =
        player === 1 ? tagSession.heiJin.player1 : tagSession.heiJin.player2;

      const existingGolden9 = tagSession.pendingTags.find(
        (t) => t.type === 'golden_9',
      );
      if (existingGolden9?.player === player) {
        return;
      }

      const preservedFouls = tagSession.pendingTags.filter(
        (t) => t.type === 'foul',
      );

      dispatch({
        type: 'SET_PENDING_TAGS',
        tags: [
          ...preservedFouls,
          {
            id: generateTagId(),
            player,
            type: 'golden_9',
            isLetGan,
            isHeiJin,
          },
        ],
      });
    },
    [state.match, state.session, state.editSession, state.editingRoundNumber, tagFormReadOnly],
  );

  const removePendingTag = useCallback(
    (id: string) => {
      if (tagFormReadOnly) return;
      dispatch({ type: 'REMOVE_TAG', id });
    },
    [tagFormReadOnly],
  );

  const setHeiJin = useCallback(
    (player: PlayerId, checked: boolean) => {
      if (tagFormReadOnly) return;
      dispatch({ type: 'SET_HEI_JIN', player, checked });
    },
    [tagFormReadOnly],
  );

  const setLetGan = useCallback(
    (player: PlayerId, checked: boolean) => {
      if (tagFormReadOnly) return;
      dispatch({ type: 'SET_LET_GAN', player, checked });
    },
    [tagFormReadOnly],
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
    dispatch({ type: 'RESET_HEI_JIN' });
  }, [state.match, state.session, isReadOnly]);

  const beginEditRound = useCallback(
    (roundNumber: number) => {
      if (!state.match || isReadOnly) return;
      dispatch({ type: 'START_EDIT_ROUND', roundNumber });
    },
    [state.match, isReadOnly],
  );

  const cancelEditRound = useCallback(() => {
    dispatch({ type: 'CANCEL_EDIT_ROUND' });
  }, []);

  const saveEditRound = useCallback(async () => {
    if (!state.match || state.editingRoundNumber === null) return;

    const validation = validateSubmit(state.editSession.pendingTags);
    if (!validation.ok) {
      if (validation.message) {
        dispatch({ type: 'SET_SUBMIT_ERROR', message: validation.message });
      }
      return;
    }

    const existing = state.match.rounds.find(
      (r) => r.roundNumber === state.editingRoundNumber,
    );
    if (!existing) return;

    const updatedRound = rebuildRoundRecord(
      existing,
      state.editSession.pendingTags,
    );
    const rounds = state.match.rounds.map((r) =>
      r.roundNumber === state.editingRoundNumber ? updatedRound : r,
    );

    const updated = applyPlayerNames(
      { ...state.match, rounds },
      state.session.player1Name,
      state.session.player2Name,
    );

    await saveMatch(updated);
    dispatch({ type: 'SET_MATCH', match: updated });
    dispatch({ type: 'CANCEL_EDIT_ROUND' });
  }, [state.match, state.editingRoundNumber, state.editSession, state.session]);

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
      activeSession,
      editingRoundNumber: state.editingRoundNumber,
      isEditingRound,
      tagFormReadOnly,
      isReadOnly,
      addScoreTag,
      addGolden9Tag,
      removePendingTag,
      setLetGan,
      setHeiJin,
      setPlayerName,
      submitRound,
      beginEditRound,
      cancelEditRound,
      saveEditRound,
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
      state.editingRoundNumber,
      state.editSession,
      activeSession,
      isEditingRound,
      tagFormReadOnly,
      isReadOnly,
      addScoreTag,
      addGolden9Tag,
      removePendingTag,
      setLetGan,
      setHeiJin,
      setPlayerName,
      submitRound,
      beginEditRound,
      cancelEditRound,
      saveEditRound,
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
