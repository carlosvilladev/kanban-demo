/**
 * Unit tests for useAutoPersist — write-through persist hook.
 *
 * Covers TC-015 (auto-persist on state change).
 * TC-016 (storage error swallowed) is covered via boardStorage.test.ts (T1).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoPersist } from '../useAutoPersist';
import * as boardStorage from '../boardStorage';
import type { BoardState } from '../../types/board';

function makeBoard(id: string): BoardState {
  return {
    tasks: { [id]: { id, title: `Task ${id}`, description: 'desc' } },
    columns: {
      'todo': { id: 'todo', title: 'To Do', taskIds: [id] },
      'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
      'done': { id: 'done', title: 'Done', taskIds: [] },
    },
    columnOrder: ['todo', 'in-progress', 'done'],
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ─── TC-015: Auto-persist on change ──────────────────────────────────────────

describe('useAutoPersist', () => {
  it('TC-015: calls writeBoard with the initial state on mount', () => {
    const spy = vi.spyOn(boardStorage, 'writeBoard');
    const boardA = makeBoard('a');
    renderHook(() => useAutoPersist(boardA));
    expect(spy).toHaveBeenCalledWith(boardA);
  });

  it('TC-015: calls writeBoard again when state changes', () => {
    const spy = vi.spyOn(boardStorage, 'writeBoard');
    const boardA = makeBoard('a');
    const boardB = makeBoard('b');

    const { rerender } = renderHook(({ s }: { s: BoardState }) => useAutoPersist(s), {
      initialProps: { s: boardA },
    });

    spy.mockClear(); // clear mount call
    rerender({ s: boardB });

    expect(spy).toHaveBeenCalledWith(boardB);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not call writeBoard again when same state reference is passed', () => {
    const spy = vi.spyOn(boardStorage, 'writeBoard');
    const boardA = makeBoard('a');

    const { rerender } = renderHook(({ s }: { s: BoardState }) => useAutoPersist(s), {
      initialProps: { s: boardA },
    });

    spy.mockClear();
    rerender({ s: boardA }); // same reference

    expect(spy).not.toHaveBeenCalled();
  });

  it('returns void (no return value)', () => {
    const boardA = makeBoard('a');
    let returnVal: unknown = 'sentinel';
    renderHook(() => {
      returnVal = useAutoPersist(boardA);
    });
    expect(returnVal).toBeUndefined();
  });
});
