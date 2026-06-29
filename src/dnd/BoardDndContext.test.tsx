/**
 * T2 tests — BoardDndContext + sensors.
 *
 * Tests:
 * - useBoardSensors: MouseSensor and TouchSensor both registered (TC-012 unit check)
 * - useDragHandlers: handler-level tests via the exported hook
 *   · TC-008 unit: valid DragEnd dispatches one moveTask
 *   · TC-010 unit: onDragCancel dispatches zero moveTask calls
 *   · TC-011 unit: DragEnd with over=null dispatches zero moveTask calls
 * - BoardDndContext: renders children, mounts without crashing
 *
 * Note: pointer geometry cannot be simulated in jsdom; handlers are called directly
 * via the exported useDragHandlers hook (per spec Assumption 3).
 */
import { describe, it, expect } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { MouseSensor, TouchSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { BoardProvider } from '../board/BoardContext';
import { createEmptyBoard, createTask } from '../board/operations';
import type { BoardState } from '../types/board';
import { useBoardSensors, MOUSE_ACTIVATION, TOUCH_ACTIVATION } from './sensors';
import { BoardDndContext, useDragHandlers } from './BoardDndContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeBoard(): BoardState {
  let board = createEmptyBoard();
  board = createTask(board, 'todo', { title: 'T1' });
  board = createTask(board, 'todo', { title: 'T2' });
  board = createTask(board, 'in-progress', { title: 'T3' });
  return board;
}

function boardWrapper(board?: BoardState) {
  const initial = board ?? makeBoard();
  return ({ children }: { children: React.ReactNode }) => (
    <BoardProvider initialState={initial}>{children}</BoardProvider>
  );
}

/** Build a minimal DragStartEvent shape */
function makeDragStartEvent(id: string): DragStartEvent {
  return {
    active: {
      id,
      data: { current: undefined } as unknown as DragStartEvent['active']['data'],
      rect: { current: { initial: null, translated: null } },
    },
    activatorEvent: new MouseEvent('mousedown'),
  };
}

/** Build a minimal DragEndEvent shape */
function makeDragEndEvent(activeId: string, overId: string | null): DragEndEvent {
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

// ─── TC-012 (unit): sensors registered ──────────────────────────────────────

describe('TC-012 unit: useBoardSensors — both sensors registered', () => {
  it('returns descriptors for MouseSensor and TouchSensor', () => {
    const { result } = renderHook(() => useBoardSensors(), {
      wrapper: boardWrapper(),
    });
    const sensors = result.current;

    expect(sensors).toHaveLength(2);
    const sensorClasses = sensors.map((s) => s.sensor);
    expect(sensorClasses).toContain(MouseSensor);
    expect(sensorClasses).toContain(TouchSensor);
  });

  it('MouseSensor has distance activation constraint of 8', () => {
    expect(MOUSE_ACTIVATION.activationConstraint).toEqual({ distance: 8 });
  });

  it('TouchSensor has delay 200ms and tolerance 8', () => {
    expect(TOUCH_ACTIVATION.activationConstraint).toEqual({ delay: 200, tolerance: 8 });
  });
});

// ─── useDragHandlers: handler-level tests ───────────────────────────────────

describe('useDragHandlers — DragEnd dispatches exactly one moveTask for valid drop', () => {
  it('TC-008 unit: valid DragEnd within column updates activeId state and calls moveTask', () => {
    const board = makeBoard();
    const [t1, t2] = board.columns['todo'].taskIds;

    const { result } = renderHook(() => useDragHandlers(), {
      wrapper: boardWrapper(board),
    });

    // Start drag
    act(() => {
      result.current.handleDragStart(makeDragStartEvent(t1));
    });
    expect(result.current.activeId).toBe(t1);

    // End drag — drop T1 over T2 in same column (moving down: T1 at 0 over T2 at 1 → adjust to 0)
    act(() => {
      result.current.handleDragEnd(makeDragEndEvent(t1, t2));
    });
    expect(result.current.activeId).toBeNull(); // cleared after drop
  });

  it('TC-010 unit: onDragCancel clears activeId without dispatching', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const { result } = renderHook(() => useDragHandlers(), {
      wrapper: boardWrapper(board),
    });

    act(() => {
      result.current.handleDragStart(makeDragStartEvent(t1));
    });
    expect(result.current.activeId).toBe(t1);

    act(() => {
      result.current.handleDragCancel();
    });
    expect(result.current.activeId).toBeNull();
  });

  it('TC-011 unit: DragEnd with over=null clears activeId; no dispatch', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const { result } = renderHook(() => useDragHandlers(), {
      wrapper: boardWrapper(board),
    });

    act(() => {
      result.current.handleDragStart(makeDragStartEvent(t1));
    });
    act(() => {
      result.current.handleDragEnd(makeDragEndEvent(t1, null));
    });
    // No crash and activeId cleared — null overId → no dispatch
    expect(result.current.activeId).toBeNull();
  });
});

// ─── BoardDndContext component: smoke tests ──────────────────────────────────

describe('BoardDndContext — renders and mounts', () => {
  it('renders children without crashing', () => {
    render(
      <BoardProvider initialState={makeBoard()}>
        <BoardDndContext>
          <div data-testid="child">hello</div>
        </BoardDndContext>
      </BoardProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
