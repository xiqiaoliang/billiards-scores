import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { PlayerId } from '../domain/types';
import { PlayerScoreBar } from './PlayerScoreBar';

interface PlayerScoreBarListProps {
  players: PlayerId[];
  canReorder: boolean;
  onReorder: (order: PlayerId[]) => void;
}

const LONG_PRESS_DELAY_MS = 400;

function movePlayer(order: PlayerId[], from: PlayerId, to: PlayerId): PlayerId[] {
  if (from === to) return order;
  const fromIndex = order.indexOf(from);
  const toIndex = order.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) return order;
  const next = [...order];
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, from);
  return next;
}

function sameOrder(a: PlayerId[], b: PlayerId[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function PlayerScoreBarList({
  players,
  canReorder,
  onReorder,
}: PlayerScoreBarListProps) {
  const [visualOrder, setVisualOrder] = useState<PlayerId[]>(players);
  const [draggingPlayer, setDraggingPlayer] = useState<PlayerId | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const itemRefs = useRef<Partial<Record<PlayerId, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (draggingPlayer !== null) return;
    setVisualOrder(players);
  }, [players, draggingPlayer]);

  const clearPressTimer = useCallback(() => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const commitDrag = useCallback(() => {
    if (draggingPlayer === null) return;
    if (!sameOrder(visualOrder, players)) {
      onReorder(visualOrder);
    }
    setDraggingPlayer(null);
  }, [draggingPlayer, visualOrder, players, onReorder]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, player: PlayerId) => {
      if (!canReorder || draggingPlayer !== null) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      clearPressTimer();
      pressTimerRef.current = window.setTimeout(() => {
        setDraggingPlayer(player);
      }, LONG_PRESS_DELAY_MS);
    },
    [canReorder, draggingPlayer, clearPressTimer],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (draggingPlayer === null) return;
      event.preventDefault();

      const hovered = visualOrder.find((player) => {
        const el = itemRefs.current[player];
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return event.clientY >= rect.top && event.clientY <= rect.bottom;
      });
      if (!hovered || hovered === draggingPlayer) return;

      setVisualOrder((current) => movePlayer(current, draggingPlayer, hovered));
    },
    [draggingPlayer, visualOrder],
  );

  const handlePointerUp = useCallback(() => {
    clearPressTimer();
    commitDrag();
  }, [clearPressTimer, commitDrag]);

  const handlePointerCancel = useCallback(() => {
    clearPressTimer();
    if (draggingPlayer !== null) {
      setDraggingPlayer(null);
      setVisualOrder(players);
    }
  }, [clearPressTimer, draggingPlayer, players]);

  useEffect(() => {
    if (draggingPlayer === null) return;
    const handleGlobalPointerUp = () => {
      clearPressTimer();
      commitDrag();
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [draggingPlayer, clearPressTimer, commitDrag]);

  return (
    <section className="section">
      {canReorder && (
        <p className="player-score-bar-list__tip">首局提交前可长按并拖动卡片调整顺序</p>
      )}
      {visualOrder.map((player) => {
        const isDragging = draggingPlayer === player;
        return (
          <div
            key={player}
            ref={(el) => {
              itemRefs.current[player] = el;
            }}
            className={`player-score-bar-wrapper${
              canReorder ? ' player-score-bar-wrapper--sortable' : ''
            }${isDragging ? ' player-score-bar-wrapper--dragging' : ''}`}
            onPointerDown={(event) => handlePointerDown(event, player)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <PlayerScoreBar player={player} />
          </div>
        );
      })}
    </section>
  );
}


