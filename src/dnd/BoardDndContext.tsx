/**
 * BoardDndContext — wires dnd-kit to the board store.
 *
 * Mounts <DndContext> with board-specific sensors and collision detection.
 * Renders <DragOverlay> for the ghost card.
 *
 * Data flow:
 *   dnd-kit event → projectDrop(board, active, over) → DropTarget | null
 *     → store.moveTask(taskId, toColumnId, toIndex) → applyMove → new state
 *
 * Cancel semantics:
 *   onDragCancel (Escape) and null projection (off-target) both clear activeId
 *   without dispatching any action — origin is left untouched.
 */
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useBoard } from '../board/BoardContext';
import { projectDrop } from './projectDrop';
import { useBoardSensors } from './sensors';
import { DragOverlayCard } from './DragOverlayCard';

// ─── Exported hook for testing and overlay rendering ────────────────────────

/**
 * Extracts and exposes drag handler functions that wire dnd-kit to the store.
 * Exported so T2 handler-level tests and the integration test harness can
 * call handlers directly without going through pointer simulation.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useDragHandlers() {
  const { state, moveTask } = useBoard();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Use a ref to avoid stale closure over `state` in handleDragEnd
  const stateRef = useRef(state);
  stateRef.current = state;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(() => {
    // Track over-id for live placeholder — no board state dispatch here.
    // verticalListSortingStrategy drives the visual gap automatically.
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeTaskId = String(event.active.id);
      const overId = event.over ? String(event.over.id) : null;

      const target = projectDrop(stateRef.current, activeTaskId, overId);
      if (target) {
        // Single atomic dispatch — one MOVE_TASK, one applyMove call
        moveTask(activeTaskId, target.toColumnId, target.toIndex);
      }
      // null target (off-target) → no dispatch → origin untouched (FR-D6)
      setActiveId(null);
    },
    [moveTask],
  );

  const handleDragCancel = useCallback(() => {
    // Escape key → dnd-kit calls onDragCancel automatically
    // No dispatch → state untouched, card snaps back to origin (FR-D6)
    setActiveId(null);
  }, []);

  return {
    activeId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}

// ─── Provider component ──────────────────────────────────────────────────────

interface BoardDndContextProps {
  children: ReactNode;
}

export function BoardDndContext({ children }: BoardDndContextProps) {
  const sensors = useBoardSensors();
  const { activeId, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel } =
    useDragHandlers();

  const { state } = useBoard();
  const activeTask = activeId ? state.tasks[activeId] ?? null : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeTask && activeId ? <DragOverlayCard taskId={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
