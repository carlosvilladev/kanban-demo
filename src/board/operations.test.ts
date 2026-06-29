/**
 * Unit tests for pure board operations and selectors.
 * Covers TC-001 through TC-006.
 */
import {
  createEmptyBoard,
  createTask,
  updateTask,
  deleteTask,
  selectColumnTaskCount,
  selectTasksForColumn,
  getTaskColumn,
  assertBoardInvariants,
} from './operations';
import type { BoardState } from '../types/board';

// ─── TC-001: createEmptyBoard ────────────────────────────────────────────────

describe('createEmptyBoard', () => {
  it('TC-001: returns 3 columns in fixed order, all empty', () => {
    const board = createEmptyBoard();
    expect(board.columnOrder).toEqual(['todo', 'in-progress', 'done']);
    expect(board.columns['todo'].taskIds).toHaveLength(0);
    expect(board.columns['in-progress'].taskIds).toHaveLength(0);
    expect(board.columns['done'].taskIds).toHaveLength(0);
    expect(Object.keys(board.tasks)).toHaveLength(0);
  });

  it('has correct display titles', () => {
    const board = createEmptyBoard();
    expect(board.columns['todo'].title).toBe('To Do');
    expect(board.columns['in-progress'].title).toBe('In Progress');
    expect(board.columns['done'].title).toBe('Done');
  });

  it('satisfies board invariants', () => {
    expect(() => assertBoardInvariants(createEmptyBoard())).not.toThrow();
  });
});

// ─── TC-002 / TC-003: createTask ────────────────────────────────────────────

describe('createTask', () => {
  it('TC-002: appends task to target column, count +1, in exactly one column', () => {
    const board = createEmptyBoard();
    const next = createTask(board, 'todo', { title: 'My Task' });

    expect(Object.keys(next.tasks)).toHaveLength(1);
    expect(next.columns['todo'].taskIds).toHaveLength(1);
    expect(next.columns['in-progress'].taskIds).toHaveLength(0);
    expect(next.columns['done'].taskIds).toHaveLength(0);

    const taskId = next.columns['todo'].taskIds[0];
    expect(next.tasks[taskId]).toBeDefined();
    expect(next.tasks[taskId].title).toBe('My Task');
    assertBoardInvariants(next);
  });

  it('TC-003: rejects empty title — no-op (returns same reference)', () => {
    const board = createEmptyBoard();
    const next = createTask(board, 'todo', { title: '' });
    expect(next).toBe(board);
  });

  it('TC-003: rejects whitespace-only title — no-op', () => {
    const board = createEmptyBoard();
    const next = createTask(board, 'todo', { title: '   ' });
    expect(next).toBe(board);
  });

  it('trims title', () => {
    const board = createEmptyBoard();
    const next = createTask(board, 'todo', { title: '  Hello World  ' });
    const taskId = next.columns['todo'].taskIds[0];
    expect(next.tasks[taskId].title).toBe('Hello World');
  });

  it('defaults description to empty string when not provided', () => {
    const board = createEmptyBoard();
    const next = createTask(board, 'todo', { title: 'Task' });
    const taskId = next.columns['todo'].taskIds[0];
    expect(next.tasks[taskId].description).toBe('');
  });

  it('stores provided description', () => {
    const board = createEmptyBoard();
    const next = createTask(board, 'todo', { title: 'Task', description: 'Some desc' });
    const taskId = next.columns['todo'].taskIds[0];
    expect(next.tasks[taskId].description).toBe('Some desc');
  });

  it('does not mutate the input state', () => {
    const board = createEmptyBoard();
    const originalTaskCount = Object.keys(board.tasks).length;
    createTask(board, 'todo', { title: 'Task' });
    expect(Object.keys(board.tasks)).toHaveLength(originalTaskCount);
    expect(board.columns['todo'].taskIds).toHaveLength(0);
  });

  it('appends to bottom when multiple tasks exist', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'First' });
    board = createTask(board, 'todo', { title: 'Second' });
    expect(board.columns['todo'].taskIds).toHaveLength(2);
    const secondId = board.columns['todo'].taskIds[1];
    expect(board.tasks[secondId].title).toBe('Second');
  });

  it('can add tasks to different columns independently', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'Todo Task' });
    board = createTask(board, 'in-progress', { title: 'WIP Task' });
    board = createTask(board, 'done', { title: 'Done Task' });

    expect(board.columns['todo'].taskIds).toHaveLength(1);
    expect(board.columns['in-progress'].taskIds).toHaveLength(1);
    expect(board.columns['done'].taskIds).toHaveLength(1);
    assertBoardInvariants(board);
  });
});

// ─── TC-004: updateTask ─────────────────────────────────────────────────────

describe('updateTask', () => {
  it('TC-004: patches title and description; membership and position unchanged', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'in-progress', { title: 'Original', description: 'Old desc' });
    const taskId = board.columns['in-progress'].taskIds[0];

    const next = updateTask(board, taskId, { title: 'Updated', description: 'New desc' });

    expect(next.tasks[taskId].title).toBe('Updated');
    expect(next.tasks[taskId].description).toBe('New desc');
    expect(getTaskColumn(next, taskId)).toBe('in-progress');
    expect(next.columns['in-progress'].taskIds).toContain(taskId);
    assertBoardInvariants(next);
  });

  it('patches only title when description is not provided', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'Task', description: 'Keep me' });
    const taskId = board.columns['todo'].taskIds[0];

    const next = updateTask(board, taskId, { title: 'New Title' });

    expect(next.tasks[taskId].title).toBe('New Title');
    expect(next.tasks[taskId].description).toBe('Keep me');
  });

  it('patches only description when title is not provided', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'Title', description: 'Old' });
    const taskId = board.columns['todo'].taskIds[0];

    const next = updateTask(board, taskId, { description: 'New desc' });

    expect(next.tasks[taskId].title).toBe('Title');
    expect(next.tasks[taskId].description).toBe('New desc');
  });

  it('returns state unchanged for unknown taskId', () => {
    const board = createEmptyBoard();
    const next = updateTask(board, 'nonexistent', { title: 'X' });
    expect(next).toBe(board);
  });

  it('rejects empty title update — no-op', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'Task' });
    const taskId = board.columns['todo'].taskIds[0];

    const next = updateTask(board, taskId, { title: '' });
    expect(next).toBe(board);
  });

  it('rejects whitespace-only title update — no-op', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'Task' });
    const taskId = board.columns['todo'].taskIds[0];

    const next = updateTask(board, taskId, { title: '   ' });
    expect(next).toBe(board);
  });
});

// ─── TC-005: deleteTask ─────────────────────────────────────────────────────

describe('deleteTask', () => {
  it('TC-005: removes task from tasks map and from its column taskIds', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'Remove Me' });
    const taskId = board.columns['todo'].taskIds[0];

    const next = deleteTask(board, taskId);

    expect(next.tasks[taskId]).toBeUndefined();
    expect(next.columns['todo'].taskIds).not.toContain(taskId);
    expect(next.columns['in-progress'].taskIds).not.toContain(taskId);
    expect(next.columns['done'].taskIds).not.toContain(taskId);
  });

  it('does not affect other tasks in the same column', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'Keep' });
    board = createTask(board, 'todo', { title: 'Delete' });

    const keepId = board.columns['todo'].taskIds[0];
    const deleteId = board.columns['todo'].taskIds[1];

    const next = deleteTask(board, deleteId);

    expect(next.tasks[keepId]).toBeDefined();
    expect(next.columns['todo'].taskIds).toContain(keepId);
    expect(next.columns['todo'].taskIds).not.toContain(deleteId);
    assertBoardInvariants(next);
  });

  it('returns state unchanged for unknown taskId', () => {
    const board = createEmptyBoard();
    const next = deleteTask(board, 'nonexistent');
    expect(next).toBe(board);
  });

  it('does not mutate input state', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'Task' });
    const taskId = board.columns['todo'].taskIds[0];

    deleteTask(board, taskId);

    expect(board.tasks[taskId]).toBeDefined();
    expect(board.columns['todo'].taskIds).toContain(taskId);
  });
});

// ─── TC-006: selectors ──────────────────────────────────────────────────────

describe('selectColumnTaskCount', () => {
  it('TC-006: returns 0 for empty column', () => {
    const board = createEmptyBoard();
    expect(selectColumnTaskCount(board, 'todo')).toBe(0);
  });

  it('TC-006: returns correct count after adding tasks', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'A' });
    board = createTask(board, 'todo', { title: 'B' });
    board = createTask(board, 'in-progress', { title: 'C' });

    expect(selectColumnTaskCount(board, 'todo')).toBe(2);
    expect(selectColumnTaskCount(board, 'in-progress')).toBe(1);
    expect(selectColumnTaskCount(board, 'done')).toBe(0);
  });
});

describe('selectTasksForColumn', () => {
  it('returns tasks in insertion order', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'First' });
    board = createTask(board, 'todo', { title: 'Second' });
    board = createTask(board, 'todo', { title: 'Third' });

    const tasks = selectTasksForColumn(board, 'todo');
    expect(tasks).toHaveLength(3);
    expect(tasks[0].title).toBe('First');
    expect(tasks[1].title).toBe('Second');
    expect(tasks[2].title).toBe('Third');
  });

  it('returns empty array for empty column', () => {
    const board = createEmptyBoard();
    expect(selectTasksForColumn(board, 'done')).toEqual([]);
  });
});

describe('getTaskColumn', () => {
  it('TC-006: returns the owning column id', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'in-progress', { title: 'Task' });
    const taskId = board.columns['in-progress'].taskIds[0];

    expect(getTaskColumn(board, taskId)).toBe('in-progress');
  });

  it('TC-006: returns undefined for unknown taskId', () => {
    const board = createEmptyBoard();
    expect(getTaskColumn(board, 'nonexistent')).toBeUndefined();
  });
});

// ─── assertBoardInvariants ───────────────────────────────────────────────────

describe('assertBoardInvariants', () => {
  it('does not throw for a valid board with tasks', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'A' });
    board = createTask(board, 'in-progress', { title: 'B' });
    expect(() => assertBoardInvariants(board)).not.toThrow();
  });

  it('throws when a task exists in tasks map but not in any column', () => {
    const board = createEmptyBoard();
    const corrupt: BoardState = {
      ...board,
      tasks: { orphan: { id: 'orphan', title: 'Orphan', description: '' } },
      // columns have no taskIds entry for 'orphan'
    };
    expect(() => assertBoardInvariants(corrupt)).toThrow(/invariant violated/i);
  });

  it('throws when a task appears in two columns', () => {
    let board = createEmptyBoard();
    board = createTask(board, 'todo', { title: 'Task' });
    const taskId = board.columns['todo'].taskIds[0];

    const corrupt: BoardState = {
      ...board,
      columns: {
        ...board.columns,
        // Duplicate the task id in 'done' as well
        done: { ...board.columns['done'], taskIds: [taskId] },
      },
    };
    expect(() => assertBoardInvariants(corrupt)).toThrow(/invariant violated/i);
  });

  it('throws when a taskId in a column does not exist in the tasks map', () => {
    const board = createEmptyBoard();
    const corrupt: BoardState = {
      ...board,
      columns: {
        ...board.columns,
        todo: { ...board.columns['todo'], taskIds: ['ghost-id'] },
      },
      // tasks map does NOT contain 'ghost-id'
    };
    expect(() => assertBoardInvariants(corrupt)).toThrow(/invariant violated/i);
  });
});
