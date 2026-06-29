/**
 * Unit tests for boardStorage — the single localStorage gateway for board data.
 *
 * Covers TC-001 through TC-007 and TC-016 from persistence-seed spec.
 * jsdom provides localStorage in the Vitest environment.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readBoard, writeBoard, clearBoard, isValidBoardState } from '../boardStorage';
import { STORAGE_KEYS, SCHEMA_VERSION } from '../keys';
import type { BoardState } from '../../types/board';

// Minimal valid board for reuse across tests
function makeValidBoard(): BoardState {
  return {
    tasks: {
      't1': { id: 't1', title: 'Task One', description: 'Desc one' },
    },
    columns: {
      'todo': { id: 'todo', title: 'To Do', taskIds: ['t1'] },
      'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
      'done': { id: 'done', title: 'Done', taskIds: [] },
    },
    columnOrder: ['todo', 'in-progress', 'done'],
  };
}

beforeEach(() => {
  localStorage.clear();
});

// ─── TC-001: Round-trip restore ─────────────────────────────────────────────

describe('writeBoard + readBoard round-trip', () => {
  it('TC-001: restores a deeply-equal board', () => {
    const board = makeValidBoard();
    writeBoard(board);
    expect(readBoard()).toEqual(board);
  });

  it('round-trip with multiple tasks across columns', () => {
    const board: BoardState = {
      tasks: {
        'a': { id: 'a', title: 'Alpha', description: '' },
        'b': { id: 'b', title: 'Beta', description: 'desc' },
      },
      columns: {
        'todo': { id: 'todo', title: 'To Do', taskIds: ['a'] },
        'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: ['b'] },
        'done': { id: 'done', title: 'Done', taskIds: [] },
      },
      columnOrder: ['todo', 'in-progress', 'done'],
    };
    writeBoard(board);
    expect(readBoard()).toEqual(board);
  });
});

// ─── TC-002: Versioned envelope ──────────────────────────────────────────────

describe('envelope shape', () => {
  it('TC-002: raw stored value is { version, data } at kanban-demo:board', () => {
    const board = makeValidBoard();
    writeBoard(board);
    const raw = localStorage.getItem(STORAGE_KEYS.board);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual({ version: SCHEMA_VERSION, data: board });
  });
});

// ─── TC-003: Missing key → null ──────────────────────────────────────────────

describe('readBoard — missing / corrupt → null', () => {
  it('TC-003: returns null when no key exists', () => {
    expect(readBoard()).toBeNull();
  });

  it('TC-004: returns null for unparseable JSON', () => {
    localStorage.setItem(STORAGE_KEYS.board, '{not json');
    expect(readBoard()).toBeNull();
  });

  it('TC-005: returns null for version mismatch', () => {
    const envelope = { version: 999, data: makeValidBoard() };
    localStorage.setItem(STORAGE_KEYS.board, JSON.stringify(envelope));
    expect(readBoard()).toBeNull();
  });

  it('TC-006a: returns null when columnOrder id missing from columns', () => {
    const board = makeValidBoard();
    // Corrupt: columnOrder references a column not in columns
    const corrupt = {
      ...board,
      columnOrder: ['todo', 'in-progress', 'done', 'nonexistent'],
    };
    const envelope = { version: SCHEMA_VERSION, data: corrupt };
    localStorage.setItem(STORAGE_KEYS.board, JSON.stringify(envelope));
    expect(readBoard()).toBeNull();
  });

  it('TC-006b: returns null when taskId in column has no matching task', () => {
    const board = makeValidBoard();
    // Corrupt: column references a task that doesn't exist
    const corrupt = {
      ...board,
      columns: {
        ...board.columns,
        'todo': { ...board.columns['todo'], taskIds: ['t1', 'ghost'] },
      },
    };
    const envelope = { version: SCHEMA_VERSION, data: corrupt };
    localStorage.setItem(STORAGE_KEYS.board, JSON.stringify(envelope));
    expect(readBoard()).toBeNull();
  });

  it('never throws on any corrupt input', () => {
    localStorage.setItem(STORAGE_KEYS.board, 'null');
    expect(() => readBoard()).not.toThrow();
    localStorage.setItem(STORAGE_KEYS.board, '42');
    expect(() => readBoard()).not.toThrow();
    localStorage.setItem(STORAGE_KEYS.board, '{"version":1}'); // missing data
    expect(() => readBoard()).not.toThrow();
  });
});

// ─── TC-007: isValidBoardState ───────────────────────────────────────────────

describe('isValidBoardState', () => {
  it('TC-007a: accepts a well-formed board', () => {
    expect(isValidBoardState(makeValidBoard())).toBe(true);
  });

  it('TC-007b: accepts a board with multiple tasks in multiple columns', () => {
    const board: BoardState = {
      tasks: {
        'a': { id: 'a', title: 'A', description: '' },
        'b': { id: 'b', title: 'B', description: '' },
      },
      columns: {
        'todo': { id: 'todo', title: 'To Do', taskIds: ['a'] },
        'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: ['b'] },
        'done': { id: 'done', title: 'Done', taskIds: [] },
      },
      columnOrder: ['todo', 'in-progress', 'done'],
    };
    expect(isValidBoardState(board)).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidBoardState(null)).toBe(false);
  });

  it('rejects a string', () => {
    expect(isValidBoardState('board')).toBe(false);
  });

  it('rejects missing tasks map', () => {
    const board = makeValidBoard();
    const noTasks = { columns: board.columns, columnOrder: board.columnOrder };
    expect(isValidBoardState(noTasks)).toBe(false);
  });

  it('rejects missing columns map', () => {
    const board = makeValidBoard();
    const noCols = { tasks: board.tasks, columnOrder: board.columnOrder };
    expect(isValidBoardState(noCols)).toBe(false);
  });

  it('rejects missing columnOrder', () => {
    const board = makeValidBoard();
    const noCo = { tasks: board.tasks, columns: board.columns };
    expect(isValidBoardState(noCo)).toBe(false);
  });

  it('rejects columnOrder referencing a missing column', () => {
    const board = makeValidBoard();
    expect(isValidBoardState({ ...board, columnOrder: ['todo', 'in-progress', 'done', 'extra'] })).toBe(false);
  });

  it('rejects a column taskId with no matching task', () => {
    const board = makeValidBoard();
    const corrupt = {
      ...board,
      columns: {
        ...board.columns,
        'todo': { ...board.columns['todo'], taskIds: ['t1', 'missing'] },
      },
    };
    expect(isValidBoardState(corrupt)).toBe(false);
  });

  it('rejects a task that appears in two columns (duplicate)', () => {
    const board = makeValidBoard();
    const corrupt = {
      ...board,
      columns: {
        ...board.columns,
        'in-progress': { ...board.columns['in-progress'], taskIds: ['t1'] }, // t1 also in todo
      },
    };
    expect(isValidBoardState(corrupt)).toBe(false);
  });

  it('rejects a task in tasks map that appears in no column', () => {
    const board = makeValidBoard();
    const corrupt = {
      ...board,
      tasks: {
        ...board.tasks,
        'orphan': { id: 'orphan', title: 'Orphan', description: '' },
      },
    };
    expect(isValidBoardState(corrupt)).toBe(false);
  });
});

// ─── clearBoard ──────────────────────────────────────────────────────────────

describe('clearBoard', () => {
  it('removes the board key from localStorage', () => {
    writeBoard(makeValidBoard());
    expect(localStorage.getItem(STORAGE_KEYS.board)).not.toBeNull();
    clearBoard();
    expect(localStorage.getItem(STORAGE_KEYS.board)).toBeNull();
  });

  it('does not throw when key is already absent', () => {
    expect(() => clearBoard()).not.toThrow();
  });
});

// ─── TC-016: Quota / throwing storage degrades silently ─────────────────────

describe('TC-016: storage write never crashes the app', () => {
  it('swallows localStorage.setItem throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => writeBoard(makeValidBoard())).not.toThrow();
    vi.restoreAllMocks();
  });
});
