import {
  useEffect,
  useState,
} from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Typography } from 'antd';
import type { PlayerId } from '../domain/types';
import { PlayerScoreBar } from './PlayerScoreBar';

interface PlayerScoreBarListProps {
  players: PlayerId[];
  canReorder: boolean;
  onReorder: (order: PlayerId[]) => void;
}

const LONG_PRESS_DELAY_MS = 400;

function sameOrder(a: PlayerId[], b: PlayerId[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function SortablePlayerScoreCard({
  player,
  playerOrder,
  canReorder,
}: {
  player: PlayerId;
  playerOrder: PlayerId[];
  canReorder: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: player, disabled: !canReorder });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`${canReorder ? 'touch-none select-none cursor-grab' : ''} ${
        isDragging ? 'z-10 opacity-80 cursor-grabbing' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <PlayerScoreBar player={player} playerOrder={playerOrder} />
    </div>
  );
}

export function PlayerScoreBarList({
  players,
  canReorder,
  onReorder,
}: PlayerScoreBarListProps) {
  const [visualOrder, setVisualOrder] = useState<PlayerId[]>(players);
  const [activePlayer, setActivePlayer] = useState<PlayerId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: LONG_PRESS_DELAY_MS, tolerance: 8 },
    }),
  );

  useEffect(() => {
    if (activePlayer !== null) return;
    setVisualOrder(players);
  }, [players, activePlayer]);

  const handleDragStart = (event: DragStartEvent) => {
    setActivePlayer(event.active.id as PlayerId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayer(null);
    if (!over || active.id === over.id) return;

    const activeIndex = visualOrder.indexOf(active.id as PlayerId);
    const overIndex = visualOrder.indexOf(over.id as PlayerId);
    if (activeIndex === -1 || overIndex === -1) return;

    const nextOrder = arrayMove(visualOrder, activeIndex, overIndex);
    if (!sameOrder(nextOrder, players)) {
      setVisualOrder(nextOrder);
      onReorder(nextOrder);
    }
  };

  const handleDragCancel = () => {
    setActivePlayer(null);
    setVisualOrder(players);
  };

  return (
    <section className="px-4 py-3">
      {canReorder && (
        <Typography.Paragraph className="!mb-2 text-xs text-slate-500">
          首局提交前可拖动卡片调整顺序（手机长按，电脑按住拖动）
        </Typography.Paragraph>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={visualOrder} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {visualOrder.map((player) => (
              <SortablePlayerScoreCard
                key={player}
                player={player}
                playerOrder={visualOrder}
                canReorder={canReorder}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
