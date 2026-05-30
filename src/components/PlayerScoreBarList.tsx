import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
const CANCEL_PRESS_MOVE_PX = 40;
const MOUSE_DRAG_START_MOVE_PX = 4;

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
  const [dropTargetPlayer, setDropTargetPlayer] = useState<PlayerId | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const itemRefs = useRef<Partial<Record<PlayerId, HTMLDivElement | null>>>({});
  const pointerIdRef = useRef<number | null>(null);
  const pointerTypeRef = useRef<string | null>(null);
  const pressedPlayerRef = useRef<PlayerId | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTopPositionsRef = useRef<Partial<Record<PlayerId, number>>>({});

  useLayoutEffect(() => {
    const nextTopPositions: Partial<Record<PlayerId, number>> = {};

    visualOrder.forEach((player) => {
      const el = itemRefs.current[player];
      if (!el) return;
      const prevTop = lastTopPositionsRef.current[player];
      const nextTop = el.getBoundingClientRect().top;
      nextTopPositions[player] = nextTop;

      // Keep the actively dragged card stable; only animate other cards.
      if (player === draggingPlayer) {
        el.style.transition = '';
        el.style.transform = '';
        return;
      }

      if (prevTop === undefined) return;
      const deltaY = prevTop - nextTop;
      if (Math.abs(deltaY) < 1) return;

      el.style.transition = 'none';
      el.style.transform = `translateY(${deltaY}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 160ms ease';
        el.style.transform = '';
      });
    });

    lastTopPositionsRef.current = nextTopPositions;
  }, [visualOrder, draggingPlayer]);

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
    setDropTargetPlayer(null);
  }, [draggingPlayer, visualOrder, players, onReorder]);

  const resetGesture = useCallback(() => {
    clearPressTimer();
    pointerIdRef.current = null;
    pointerTypeRef.current = null;
    pressedPlayerRef.current = null;
    pressStartRef.current = null;
  }, [clearPressTimer]);

  const beginDragging = useCallback((player: PlayerId) => {
    setDraggingPlayer(player);
    setDropTargetPlayer(player);
  }, []);

  const applyMoveByClientY = useCallback(
    (clientY: number) => {
      if (draggingPlayer === null) return;
      const nearest = visualOrder.reduce<{ player: PlayerId | null; distance: number }>(
        (acc, player) => {
          const el = itemRefs.current[player];
          if (!el) return acc;
          const rect = el.getBoundingClientRect();
          const centerY = rect.top + rect.height / 2;
          const distance = Math.abs(clientY - centerY);
          if (distance < acc.distance) {
            return { player, distance };
          }
          return acc;
        },
        { player: null, distance: Number.POSITIVE_INFINITY },
      ).player;

      // Avoid reordering repeatedly against the same target, which can cause oscillation/jitter.
      if (!nearest || nearest === draggingPlayer || nearest === dropTargetPlayer) return;
      setDropTargetPlayer(nearest);
      setVisualOrder((current) => movePlayer(current, draggingPlayer, nearest));
    },
    [draggingPlayer, dropTargetPlayer, visualOrder],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, player: PlayerId) => {
      if (!canReorder || draggingPlayer !== null) return;
      if (event.pointerType === 'mouse') {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      resetGesture();
      pointerIdRef.current = event.pointerId;
      pointerTypeRef.current = event.pointerType;
      pressedPlayerRef.current = player;
      pressStartRef.current = { x: event.clientX, y: event.clientY };
      pressTimerRef.current = window.setTimeout(() => {
        const activePlayer = pressedPlayerRef.current;
        if (activePlayer === null) return;
        beginDragging(activePlayer);
      }, LONG_PRESS_DELAY_MS);
    },
    [canReorder, draggingPlayer, resetGesture, beginDragging],
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, player: PlayerId) => {
      if (!canReorder || draggingPlayer !== null) return;
      if (event.button !== 0) return;
      resetGesture();
      pointerTypeRef.current = 'mouse';
      pressedPlayerRef.current = player;
      pressStartRef.current = { x: event.clientX, y: event.clientY };
    },
    [canReorder, draggingPlayer, resetGesture],
  );

  const handlePointerUp = useCallback(() => {
    if (draggingPlayer !== null) {
      commitDrag();
    }
    resetGesture();
  }, [draggingPlayer, commitDrag, resetGesture]);

  const handlePointerCancel = useCallback(() => {
    if (draggingPlayer !== null) {
      setDraggingPlayer(null);
      setDropTargetPlayer(null);
      setVisualOrder(players);
    }
    resetGesture();
  }, [draggingPlayer, players, resetGesture]);

  const handlePointerMoveOnItem = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      if (draggingPlayer === null) {
        if (pointerTypeRef.current !== 'mouse') return;
        const start = pressStartRef.current;
        const activePlayer = pressedPlayerRef.current;
        if (!start || activePlayer === null) return;
        const moved =
          Math.hypot(event.clientX - start.x, event.clientY - start.y) >
          MOUSE_DRAG_START_MOVE_PX;
        if (!moved) return;
        beginDragging(activePlayer);
        return;
      }
      event.preventDefault();
      applyMoveByClientY(event.clientY);
    },
    [draggingPlayer, beginDragging, applyMoveByClientY],
  );

  useEffect(() => {
    const handleGlobalPointerMove = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return;

      if (draggingPlayer === null) {
        const start = pressStartRef.current;
        const activePlayer = pressedPlayerRef.current;
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        const movedDistance = Math.hypot(dx, dy);
        if (pointerTypeRef.current === 'mouse') {
          if (activePlayer !== null && movedDistance > MOUSE_DRAG_START_MOVE_PX) {
            beginDragging(activePlayer);
          }
          return;
        }

        if (movedDistance > CANCEL_PRESS_MOVE_PX) {
          resetGesture();
        }
        return;
      }

      event.preventDefault();
      applyMoveByClientY(event.clientY);
    };

    const handleGlobalPointerUp = (event: PointerEvent) => {
      if (pointerIdRef.current !== null && pointerIdRef.current !== event.pointerId) {
        return;
      }
      if (draggingPlayer !== null) {
        commitDrag();
      }
      resetGesture();
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: false });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [draggingPlayer, beginDragging, commitDrag, resetGesture, applyMoveByClientY]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (pointerTypeRef.current !== 'mouse') return;
      const start = pressStartRef.current;
      const activePlayer = pressedPlayerRef.current;
      if (!start || activePlayer === null) return;

      const movedDistance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (draggingPlayer === null) {
        if (movedDistance <= MOUSE_DRAG_START_MOVE_PX) return;
        beginDragging(activePlayer);
        return;
      }

      event.preventDefault();
      applyMoveByClientY(event.clientY);
    };

    const handleMouseUp = () => {
      if (pointerTypeRef.current !== 'mouse') return;
      if (draggingPlayer !== null) {
        commitDrag();
      }
      resetGesture();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingPlayer, beginDragging, commitDrag, resetGesture, applyMoveByClientY]);

  return (
    <section className="section">
      {canReorder && (
        <p className="player-score-bar-list__tip">首局提交前可拖动卡片调整顺序（手机长按，电脑按住拖动）</p>
      )}
      <div className="player-score-bar-list">
        {visualOrder.map((player) => {
          const isDragging = draggingPlayer === player;
          const isDropTarget =
            draggingPlayer !== null && !isDragging && dropTargetPlayer === player;
          return (
            <div
              key={player}
              ref={(el) => {
                itemRefs.current[player] = el;
              }}
              className={`player-score-bar-wrapper${
                canReorder ? ' player-score-bar-wrapper--sortable' : ''
              }${isDragging ? ' player-score-bar-wrapper--dragging' : ''}${
                isDropTarget ? ' player-score-bar-wrapper--drop-target' : ''
              }`}
              onPointerDown={(event) => handlePointerDown(event, player)}
              onMouseDown={(event) => handleMouseDown(event, player)}
              onPointerMove={handlePointerMoveOnItem}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onDragStart={(event) => {
                if (canReorder) {
                  event.preventDefault();
                }
              }}
              onContextMenu={(event) => {
                if (canReorder) {
                  event.preventDefault();
                }
              }}
            >
              <PlayerScoreBar player={player} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
