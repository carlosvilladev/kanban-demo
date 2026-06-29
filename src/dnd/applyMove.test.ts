/**
 * Unit tests for applyMove (delegates to operations.moveTask).
 * TC-001: reorder within column
 * TC-002: cross-column move
 * TC-003: property — 1000 random moves keep count constant and invariants hold
 */
import { describe, it, expect } from 'vitest';
import { createEmptyBoard, createTask, assertBoardInvariants } from '../board/operations';
import type { BoardState, ColumnId } from '../types/board';
import { applyMove } from './applyMove';

/** Build a board with 3 tasks in 'todo' and 1 in 'in-progress'. */
function makeBoard(): BoardState {
  let board = createEmptyBoard();
  board = createTask(board, 'todo', { title: 'T1' });
  board = createTask(board, 'todo', { title: 'T2' });
  board = createTask(board, 'todo', { title: 'T3' });
  board = createTask(board, 'in-progress', { title: 'T4' });
  return board;
}

// ─── TC-001: Reorder within column ──────────────────────────────────────────

describe('TC-001: applyMove — reorder within column', () => {
  it('moves first task to last position', () => {
    const board = makeBoard();
    const [t1, t2, t3] = board.columns['todo'].taskIds;

    const result = applyMove(board, { taskId: t1, toColumnId: 'todo', toIndex: 2 });

    expect(result.columns['todo'].taskIds).toEqual([t2, t3, t1]);
    assertBoardInvariants(result);
  });

  it('moves last task to first position', () => {
    const board = makeBoard();
    const [t1, t2, t3] = board.columns['todo'].taskIds;

    const result = applyMove(board, { taskId: t3, toColumnId: 'todo', toIndex: 0 });

    expect(result.columns['todo'].taskIds).toEqual([t3, t1, t2]);
    assertBoardInvariants(result);
  });

  it('moves task to middle position', () => {
    const board = makeBoard();
    const [t1, t2, t3] = board.columns['todo'].taskIds;

    const result = applyMove(board, { taskId: t3, toColumnId: 'todo', toIndex: 1 });

    expect(result.columns['todo'].taskIds).toEqual([t1, t3, t2]);
    assertBoardInvariants(result);
  });

  it('no-op fast path: same position returns identical reference', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const result = applyMove(board, { taskId: t1, toColumnId: 'todo', toIndex: 0 });

    expect(result).toBe(board); // reference equality — no mutation
  });

  it('returns a new immutable object (not same reference) when position changes', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const result = applyMove(board, { taskId: t1, toColumnId: 'todo', toIndex: 1 });

    expect(result).not.toBe(board);
    expect(result.columns['todo']).not.toBe(board.columns['todo']);
    // Other columns not touched → same reference
    expect(result.columns['in-progress']).toBe(board.columns['in-progress']);
  });

  it('clamps out-of-bounds toIndex to the end', () => {
    const board = makeBoard();
    const [t1, t2, t3] = board.columns['todo'].taskIds;

    const result = applyMove(board, { taskId: t1, toColumnId: 'todo', toIndex: 999 });

    expect(result.columns['todo'].taskIds).toEqual([t2, t3, t1]);
    assertBoardInvariants(result);
  });
});

// ─── TC-002: Cross-column move ───────────────────────────────────────────────

describe('TC-002: applyMove — cross-column move', () => {
  it('moves a task from todo to done at index 0', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;
    const prevTodoLen = board.columns['todo'].taskIds.length;

    const result = applyMove(board, { taskId: t1, toColumnId: 'done', toIndex: 0 });

    expect(result.columns['todo'].taskIds).not.toContain(t1);
    expect(result.columns['done'].taskIds).toContain(t1);
    expect(result.columns['done'].taskIds[0]).toBe(t1);
    expect(result.columns['todo'].taskIds).toHaveLength(prevTodoLen - 1);
    assertBoardInvariants(result);
  });

  it('total task count is unchanged after cross-column move', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const result = applyMove(board, { taskId: t1, toColumnId: 'in-progress', toIndex: 0 });

    expect(Object.keys(result.tasks)).toHaveLength(Object.keys(board.tasks).length);
    assertBoardInvariants(result);
  });

  it('moves task to the correct position in target column', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;
    // 'in-progress' already has T4; move T1 at index 1 (after T4)
    const [t4] = board.columns['in-progress'].taskIds;

    const result = applyMove(board, { taskId: t1, toColumnId: 'in-progress', toIndex: 1 });

    expect(result.columns['in-progress'].taskIds).toEqual([t4, t1]);
    assertBoardInvariants(result);
  });

  it('drops onto an empty column at index 0', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const result = applyMove(board, { taskId: t1, toColumnId: 'done', toIndex: 0 });

    expect(result.columns['done'].taskIds).toEqual([t1]);
    assertBoardInvariants(result);
  });

  it('source column reference changes; unrelated column stays same reference', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const result = applyMove(board, { taskId: t1, toColumnId: 'done', toIndex: 0 });

    expect(result.columns['todo']).not.toBe(board.columns['todo']);
    expect(result.columns['done']).not.toBe(board.columns['done']);
    expect(result.columns['in-progress']).toBe(board.columns['in-progress']);
  });

  it('tasks map is unchanged (task itself is not mutated)', () => {
    const board = makeBoard();
    const [t1] = board.columns['todo'].taskIds;

    const result = applyMove(board, { taskId: t1, toColumnId: 'done', toIndex: 0 });

    expect(result.tasks[t1]).toBe(board.tasks[t1]); // same task object reference
  });
});

// ─── TC-003: Property — N random moves, invariants hold throughout ───────────

describe('TC-003: property — 1000 random moves keep task count constant', () => {
  it('over 1000 random moves, no task is duplicated or lost', () => {
    let board = makeBoard();
    const columns: ColumnId[] = ['todo', 'in-progress', 'done'];
    const expectedTaskCount = Object.keys(board.tasks).length; // 4

    for (let i = 0; i < 1000; i++) {
      const allTaskIds = Object.keys(board.tasks);
      const taskId = allTaskIds[Math.floor(Math.random() * allTaskIds.length)];
      const toColumnId = columns[Math.floor(Math.random() * columns.length)];
      const colLen = board.columns[toColumnId].taskIds.length;
      const toIndex = Math.floor(Math.random() * (colLen + 1));

      board = applyMove(board, { taskId, toColumnId, toIndex });
      assertBoardInvariants(board); // throws on any violation
    }

    expect(Object.keys(board.tasks)).toHaveLength(expectedTaskCount);
  });
});
