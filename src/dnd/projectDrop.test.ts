/**
 * Unit tests for projectDrop.
 * TC-004: maps over-task and over-empty-column to correct (col, index)
 * TC-005: returns null for off-target drops
 */
import { describe, it, expect } from 'vitest';
import { createEmptyBoard, createTask } from '../board/operations';
import type { BoardState } from '../types/board';
import { projectDrop } from './projectDrop';

/** Build a board:
 *  todo:        [T1, T2, T3]
 *  in-progress: [T4]
 *  done:        []
 */
function makeBoard(): BoardState {
  let board = createEmptyBoard();
  board = createTask(board, 'todo', { title: 'T1' });
  board = createTask(board, 'todo', { title: 'T2' });
  board = createTask(board, 'todo', { title: 'T3' });
  board = createTask(board, 'in-progress', { title: 'T4' });
  return board;
}

// ─── TC-004: valid drop targets ──────────────────────────────────────────────

describe('TC-004: projectDrop — valid targets', () => {
  it('over an empty column → (columnId, 0)', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const result = projectDrop(board, t1, 'done');

    expect(result).toEqual({ toColumnId: 'done', toIndex: 0 });
  });

  it('over a non-empty column → (columnId, end)', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    // Drop T1 onto the 'in-progress' column (has T4)
    const result = projectDrop(board, t1, 'in-progress');

    expect(result).toEqual({ toColumnId: 'in-progress', toIndex: 1 });
  });

  it('over a task in another column → insert-before that task', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;
    const [t4] = board.columns['in-progress'].taskIds;

    // T1 dragged over T4 (index 0 in in-progress)
    const result = projectDrop(board, t1, t4);

    expect(result).toEqual({ toColumnId: 'in-progress', toIndex: 0 });
  });

  it('over a task in the same column, moving down → adjusts index', () => {
    const board = makeBoard();
    const [t1, , t3] = board.columns['todo'].taskIds;

    // Drag T1 (index 0) over T3 (index 2) — moving down
    // After removing T1, T3 is at index 1 → adjusted index = 2 - 1 = 1
    const result = projectDrop(board, t1, t3);

    expect(result).toEqual({ toColumnId: 'todo', toIndex: 1 });
  });

  it('over a task in the same column, moving up → insert-before semantics', () => {
    const board = makeBoard();
    const [t1, , t3] = board.columns['todo'].taskIds;

    // Drag T3 (index 2) over T1 (index 0) — moving up; no adjustment
    const result = projectDrop(board, t3, t1);

    expect(result).toEqual({ toColumnId: 'todo', toIndex: 0 });
  });

  it('over the next sibling within same column, moving down → index 0 after adjust', () => {
    const board = makeBoard();
    const [t1, t2] = board.columns['todo'].taskIds;

    // Drag T1 (index 0) over T2 (index 1) — moving down; adjust: 1 - 1 = 0
    const result = projectDrop(board, t1, t2);

    expect(result).toEqual({ toColumnId: 'todo', toIndex: 0 });
  });

  it('activeId over its own column id → insert at end (after self is removed)', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    // T1 dragged over column 'todo' itself — end = taskIds.length (3)
    const result = projectDrop(board, t1, 'todo');

    expect(result).toEqual({ toColumnId: 'todo', toIndex: 3 });
  });
});

// ─── TC-005: returns null for off-target / unknown ids ───────────────────────

describe('TC-005: projectDrop — returns null for off-target drops', () => {
  it('overId null → cancel (off-target)', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    expect(projectDrop(board, t1, null)).toBeNull();
  });

  it('overId unknown string → null', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    expect(projectDrop(board, t1, 'unknown-id-xyz')).toBeNull();
  });

  it('activeId unknown → null', () => {
    const board = makeBoard();

    expect(projectDrop(board, 'ghost-task', 'done')).toBeNull();
  });

  it('both activeId and overId unknown → null', () => {
    const board = makeBoard();

    expect(projectDrop(board, 'ghost-task', 'ghost-target')).toBeNull();
  });
});
