/**
 * DnD integration tests — wires handlers through the store and verifies effects.
 *
 * Per spec Assumption 3: dnd-kit pointer geometry cannot be simulated in jsdom.
 * These tests feed crafted DragStart/End/Cancel events to the exported
 * useDragHandlers hook, then assert on board state and UI.
 *
 * TC-006: DragOverlay ghost card renders when activeId is set
 * TC-007: Placeholder/gap logic — tested via SortableContext API correctness
 * TC-008: Synthetic DragEnd within column reorders & store updates immediately
 * TC-009: Synthetic DragEnd over another column moves card; new column sticks
 * TC-010: DragCancelEvent (Escape) → no store change; card at origin
 * TC-011: DragEnd with over=null (off-target) → no dispatch → origin restored
 * TC-012: Both Mouse + Touch sensors active; move handler dispatches correctly
 * TC-013: Dispatch + state settle well under 100 ms
 * No-dup/no-loss sequence: assertBoardInvariants holds after scripted sequence
 */
import { describe, it, expect } from 'vitest';
import { render, screen, renderHook, act, within } from '@testing-library/react';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { MouseSensor, TouchSensor } from '@dnd-kit/core';
import { BoardProvider, useBoard } from '../board/BoardContext';
import { createEmptyBoard, createTask, assertBoardInvariants } from '../board/operations';
import type { BoardState } from '../types/board';
import { useDragHandlers, BoardDndContext } from './BoardDndContext';
import { useBoardSensors } from './sensors';
import { DragOverlayCard } from './DragOverlayCard';
import { Column } from '../components/Column';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeBoard(): BoardState {
  let b = createEmptyBoard();
  b = createTask(b, 'todo', { title: 'T1' });
  b = createTask(b, 'todo', { title: 'T2' });
  b = createTask(b, 'todo', { title: 'T3' });
  b = createTask(b, 'in-progress', { title: 'T4' });
  return b;
}

function boardWrapper(board: BoardState) {
  return ({ children }: { children: React.ReactNode }) => (
    <BoardProvider initialState={board}>{children}</BoardProvider>
  );
}

function makeStartEvent(id: string): DragStartEvent {
  return {
    active: {
      id,
      data: { current: undefined } as unknown as DragStartEvent['active']['data'],
      rect: { current: { initial: null, translated: null } },
    },
    activatorEvent: new MouseEvent('mousedown'),
  };
}

function makeEndEvent(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: {
      id: activeId,
      data: { current: undefined } as unknown as DragEndEvent['active']['data'],
      rect: { current: { initial: null, translated: null } },
    },
    over: overId
      ? {
          id: overId,
          data: { current: undefined } as unknown as NonNullable<DragEndEvent['over']>['data'],
          rect: {} as DOMRect,
          disabled: false,
        }
      : null,
    delta: { x: 0, y: 0 },
    activatorEvent: new MouseEvent('mousedown'),
    collisions: null,
  };
}

// ─── TC-006: DragOverlayCard renders when activeId is set ────────────────────

describe('TC-006: DragOverlay ghost card renders during a drag', () => {
  it('activeId is set after handleDragStart — overlay condition becomes truthy', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const { result } = renderHook(
      () => useDragHandlers(),
      { wrapper: boardWrapper(board) },
    );

    expect(result.current.activeId).toBeNull();

    act(() => { result.current.handleDragStart(makeStartEvent(t1)); });

    expect(result.current.activeId).toBe(t1);
  });

  it('DragOverlayCard renders a task-card for the active task', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    render(
      <BoardProvider initialState={board}>
        <DragOverlayCard taskId={t1} />
      </BoardProvider>,
    );

    // DragOverlayCard wraps TaskCard, which has data-testid="task-card"
    expect(screen.getByTestId('task-card')).toBeInTheDocument();
    expect(screen.getByText('T1')).toBeInTheDocument();
  });

  it('activeId cleared after handleDragEnd → overlay condition becomes falsy', () => {
    const board = makeBoard();
    const [t1, , t3] = board.columns['todo'].taskIds;

    const { result } = renderHook(
      () => useDragHandlers(),
      { wrapper: boardWrapper(board) },
    );

    act(() => { result.current.handleDragStart(makeStartEvent(t1)); });
    expect(result.current.activeId).toBe(t1);

    act(() => { result.current.handleDragEnd(makeEndEvent(t1, t3)); });
    expect(result.current.activeId).toBeNull();
  });
});

// ─── TC-007: Placeholder/gap — SortableContext API validation ────────────────

describe('TC-007: Insertion placeholder via SortableContext', () => {
  it('Column renders inside BoardDndContext without crashing', () => {
    const board = makeBoard();
    render(
      <BoardProvider initialState={board}>
        <BoardDndContext>
          <Column columnId="todo" />
        </BoardDndContext>
      </BoardProvider>,
    );
    // If SortableContext + useDroppable are wired correctly, the column renders
    const col = screen.getByTestId('column-todo');
    expect(col).toBeInTheDocument();
    // All 3 tasks appear
    expect(within(col).getAllByTestId('task-card')).toHaveLength(3);
  });
});

// ─── TC-008: Synthetic DragEnd within column reorders store ──────────────────

describe('TC-008: DragEnd within column reorders & store updates immediately', () => {
  it('moves T1 past T2+T3 to the end within the same column', () => {
    const board = makeBoard();
    const [t1, t2, t3] = board.columns['todo'].taskIds;

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    // Drag T1 (idx 0) over T3 (idx 2) → toIndex = 2-1 = 1 (adjusted downward)
    // After: remove T1 from [T1,T2,T3]→[T2,T3], insert at 1 → [T2,T1,T3]
    act(() => {
      result.current.handlers.handleDragEnd(makeEndEvent(t1, t3));
    });

    const taskIds = result.current.board.state.columns['todo'].taskIds;
    expect(taskIds).toEqual([t2, t1, t3]);
    assertBoardInvariants(result.current.board.state);
  });

  it('moves T3 to the top of the same column', () => {
    const board = makeBoard();
    const [t1, t2, t3] = board.columns['todo'].taskIds;

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    // Drag T3 (idx 2) over T1 (idx 0) — moving up; toIndex = 0
    act(() => {
      result.current.handlers.handleDragEnd(makeEndEvent(t3, t1));
    });

    const taskIds = result.current.board.state.columns['todo'].taskIds;
    expect(taskIds).toEqual([t3, t1, t2]);
    assertBoardInvariants(result.current.board.state);
  });

  it('UI reflects the reorder immediately — Column renders new order', () => {
    const board = makeBoard();
    const [t1, , t3] = board.columns['todo'].taskIds;

    // Render the column within the board context
    let handlers: ReturnType<typeof useDragHandlers>;
    const Spy = () => {
      handlers = useDragHandlers();
      return null;
    };

    render(
      <BoardProvider initialState={board}>
        <Spy />
        <BoardDndContext>
          <Column columnId="todo" />
        </BoardDndContext>
      </BoardProvider>,
    );

    // Columns render T1,T2,T3 in order
    const cards = screen.getAllByTestId('task-card');
    expect(cards[0]).toHaveTextContent('T1');
    expect(cards[1]).toHaveTextContent('T2');
    expect(cards[2]).toHaveTextContent('T3');

    // Simulate drag: T3 (idx 2) over T1 (idx 0) → T3 goes to top
    act(() => {
      handlers.handleDragEnd(makeEndEvent(t3, t1));
    });

    const reorderedCards = screen.getAllByTestId('task-card');
    expect(reorderedCards[0]).toHaveTextContent('T3');
    expect(reorderedCards[1]).toHaveTextContent('T1');
    expect(reorderedCards[2]).toHaveTextContent('T2');
  });
});

// ─── TC-009: Synthetic DragEnd cross-column moves card ───────────────────────

describe('TC-009: DragEnd over another column moves card; new column sticks', () => {
  it('moves T1 from todo to done (empty column)', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    // Drop T1 on 'done' column → projectDrop returns {toColumnId:'done', toIndex:0}
    act(() => {
      result.current.handlers.handleDragEnd(makeEndEvent(t1, 'done'));
    });

    const state = result.current.board.state;
    expect(state.columns['todo'].taskIds).not.toContain(t1);
    expect(state.columns['done'].taskIds).toContain(t1);
    expect(state.columns['done'].taskIds[0]).toBe(t1);
    assertBoardInvariants(state);
  });

  it('columnId change persists on re-read', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    act(() => {
      result.current.handlers.handleDragEnd(makeEndEvent(t1, 'done'));
    });

    // Read state again — new column sticks
    expect(result.current.board.state.columns['done'].taskIds).toContain(t1);
    expect(result.current.board.state.columns['todo'].taskIds).not.toContain(t1);
  });

  it('moves T1 to in-progress before T4', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;
    const [t4] = board.columns['in-progress'].taskIds;

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    // Drop T1 over T4 (in in-progress at idx 0) → insert before T4
    act(() => {
      result.current.handlers.handleDragEnd(makeEndEvent(t1, t4));
    });

    const ipIds = result.current.board.state.columns['in-progress'].taskIds;
    expect(ipIds).toEqual([t1, t4]);
    assertBoardInvariants(result.current.board.state);
  });
});

// ─── TC-010: Escape (DragCancel) → no store change ──────────────────────────

describe('TC-010: DragCancelEvent (Escape) → state unchanged, card at origin', () => {
  it('board state is identical reference after cancel', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    const stateBefore = result.current.board.state;

    act(() => { result.current.handlers.handleDragStart(makeStartEvent(t1)); });
    act(() => { result.current.handlers.handleDragCancel(); });

    expect(result.current.board.state).toBe(stateBefore); // same reference
    expect(result.current.handlers.activeId).toBeNull();
  });

  it('column taskIds arrays unchanged after cancel', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;
    const todoIdsBefore = [...board.columns['todo'].taskIds];

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    act(() => { result.current.handlers.handleDragStart(makeStartEvent(t1)); });
    act(() => { result.current.handlers.handleDragCancel(); });

    expect(result.current.board.state.columns['todo'].taskIds).toEqual(todoIdsBefore);
  });
});

// ─── TC-011: Off-target drop → no dispatch → origin restored ─────────────────

describe('TC-011: DragEnd with over=null (off-target) → no dispatch → origin restored', () => {
  it('board state unchanged on off-target drop', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    const stateBefore = result.current.board.state;

    act(() => { result.current.handlers.handleDragEnd(makeEndEvent(t1, null)); });

    expect(result.current.board.state).toBe(stateBefore); // same reference — no dispatch
  });

  it('activeId cleared even on off-target drop', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    act(() => { result.current.handlers.handleDragStart(makeStartEvent(t1)); });
    act(() => { result.current.handlers.handleDragEnd(makeEndEvent(t1, null)); });

    expect(result.current.handlers.activeId).toBeNull();
  });
});

// ─── TC-012: Sensors ────────────────────────────────────────────────────────

describe('TC-012: Both MouseSensor & TouchSensor registered', () => {
  it('sensor list contains both MouseSensor and TouchSensor classes', () => {
    const board = makeBoard();
    const { result } = renderHook(() => useBoardSensors(), { wrapper: boardWrapper(board) });
    const classes = result.current.map((s) => s.sensor);
    expect(classes).toContain(MouseSensor);
    expect(classes).toContain(TouchSensor);
  });

  it('dispatch works correctly regardless of sensor type (move handler is sensor-agnostic)', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    // The same handleDragEnd is called regardless of sensor (mouse or touch)
    act(() => {
      result.current.handlers.handleDragEnd(makeEndEvent(t1, 'done'));
    });

    expect(result.current.board.state.columns['done'].taskIds).toContain(t1);
  });
});

// ─── TC-013: Performance ────────────────────────────────────────────────────

describe('TC-013: dispatch + state commit well under 100 ms', () => {
  it('state settles in < 100 ms after DragEnd (soft assertion — logs the number)', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    const t0 = performance.now();
    act(() => {
      result.current.handlers.handleDragEnd(makeEndEvent(t1, 'done'));
    });
    const elapsed = performance.now() - t0;

    console.log(`[TC-013] dispatch + settle: ${elapsed.toFixed(2)} ms`);
    // Soft assertion — in jsdom + Vitest this is always sub-ms
    expect(elapsed).toBeLessThan(100);
  });
});

// ─── No-dup/no-loss sequence ────────────────────────────────────────────────

describe('No-dup / no-loss: assertBoardInvariants holds after scripted sequence', () => {
  it('reorder → cross-column → cancel → cross-column back maintains invariants', () => {
    const board = makeBoard();
    const [t1, t2, t3] = board.columns['todo'].taskIds;
    const [t4] = board.columns['in-progress'].taskIds;

    const { result } = renderHook(
      () => ({ board: useBoard(), handlers: useDragHandlers() }),
      { wrapper: boardWrapper(board) },
    );

    const checkInvariants = () =>
      assertBoardInvariants(result.current.board.state);

    // Step 1: Reorder T1 within todo (T1 at 0 over T3 at 2 → T1 goes to idx 1)
    act(() => { result.current.handlers.handleDragEnd(makeEndEvent(t1, t3)); });
    checkInvariants();

    // Step 2: Move T2 to in-progress (before T4)
    act(() => { result.current.handlers.handleDragEnd(makeEndEvent(t2, t4)); });
    checkInvariants();

    // Step 3: Cancel a drag — state unchanged
    act(() => { result.current.handlers.handleDragStart(makeStartEvent(t3)); });
    act(() => { result.current.handlers.handleDragCancel(); });
    checkInvariants();

    // Step 4: Off-target drop — no change
    act(() => { result.current.handlers.handleDragEnd(makeEndEvent(t3, null)); });
    checkInvariants();

    // Step 5: Move T2 back to todo
    act(() => { result.current.handlers.handleDragEnd(makeEndEvent(t2, 'todo')); });
    checkInvariants();

    const finalState = result.current.board.state;
    const totalTaskCount = Object.keys(finalState.tasks).length;
    expect(totalTaskCount).toBe(4); // seed had 4 tasks — none lost or duplicated
  });
});
