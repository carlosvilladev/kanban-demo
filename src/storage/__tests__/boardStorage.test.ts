import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readBoard, writeBoard, clearBoard, isValidBoardState } from '../boardStorage'
import { SCHEMA_VERSION, STORAGE_KEYS } from '../keys'
import type { BoardState } from '../../types/board'

// ─── Fixtures ────────────────────────────────────────────────────────────────
//
// validBoard uses the canonical ColumnId union ('todo' | 'in-progress' | 'done').
// Task objects have no columnId field — membership lives in Column.taskIds only.

const validBoard: BoardState = {
  columnOrder: ['todo', 'in-progress', 'done'],
  columns: {
    'todo': { id: 'todo', title: 'To Do', taskIds: ['task-1'] },
    'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
    'done': { id: 'done', title: 'Done', taskIds: [] },
  },
  tasks: {
    'task-1': { id: 'task-1', title: 'Test task', description: 'A test' },
  },
}

// ─── TC-001: Round-trip restore ───────────────────────────────────────────────

describe('writeBoard / readBoard round-trip (TC-001)', () => {
  beforeEach(() => localStorage.clear())

  it('returns a value deeply equal to what was written', () => {
    writeBoard(validBoard)
    expect(readBoard()).toEqual(validBoard)
  })
})

// ─── TC-002: Versioned, namespaced envelope ───────────────────────────────────

describe('envelope shape (TC-002)', () => {
  beforeEach(() => localStorage.clear())

  it('stores { version: SCHEMA_VERSION, data: board } at kanban-demo:board', () => {
    writeBoard(validBoard)
    const raw = localStorage.getItem(STORAGE_KEYS.board)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!) as unknown
    expect(parsed).toEqual({ version: SCHEMA_VERSION, data: validBoard })
  })
})

// ─── TC-003: Missing key → null ───────────────────────────────────────────────

describe('readBoard — missing key (TC-003)', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when no key is stored', () => {
    expect(readBoard()).toBeNull()
  })
})

// ─── TC-004: Unparseable JSON → null ─────────────────────────────────────────

describe('readBoard — bad JSON (TC-004)', () => {
  beforeEach(() => localStorage.clear())

  it('returns null and does not throw', () => {
    localStorage.setItem(STORAGE_KEYS.board, '{not json')
    expect(readBoard()).toBeNull()
  })
})

// ─── TC-005: Version mismatch → null ─────────────────────────────────────────

describe('readBoard — version mismatch (TC-005)', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when stored version !== SCHEMA_VERSION', () => {
    localStorage.setItem(
      STORAGE_KEYS.board,
      JSON.stringify({ version: 999, data: validBoard }),
    )
    expect(readBoard()).toBeNull()
  })
})

// ─── TC-006: Structurally invalid → null ─────────────────────────────────────

describe('readBoard — structurally invalid data (TC-006)', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when columnOrder references a missing column', () => {
    // Spread validBoard but override columnOrder to include a column not in columns
    const bad = { ...validBoard, columnOrder: ['todo', 'nonexistent-column'] as string[] }
    localStorage.setItem(STORAGE_KEYS.board, JSON.stringify({ version: SCHEMA_VERSION, data: bad }))
    expect(readBoard()).toBeNull()
  })

  it('returns null when a column taskId has no matching task', () => {
    const bad: BoardState = {
      columnOrder: ['todo', 'in-progress', 'done'],
      columns: {
        'todo': { id: 'todo', title: 'To Do', taskIds: ['task-1', 'task-ghost'] },
        'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
        'done': { id: 'done', title: 'Done', taskIds: [] },
      },
      tasks: {
        'task-1': { id: 'task-1', title: 'Test', description: 'ok' },
      },
    }
    localStorage.setItem(STORAGE_KEYS.board, JSON.stringify({ version: SCHEMA_VERSION, data: bad }))
    expect(readBoard()).toBeNull()
  })
})

// ─── TC-007: isValidBoardState guard ─────────────────────────────────────────

describe('isValidBoardState (TC-007)', () => {
  it('returns true for a well-formed board', () => {
    expect(isValidBoardState(validBoard)).toBe(true)
  })

  it('returns false for null', () => {
    expect(isValidBoardState(null)).toBe(false)
  })

  it('returns false for a non-object', () => {
    expect(isValidBoardState('string')).toBe(false)
  })

  it('returns false when a task appears in two columns (duplicate)', () => {
    const dupBoard = {
      columnOrder: ['col-1', 'col-2'],
      columns: {
        'col-1': { id: 'col-1', title: 'To Do', taskIds: ['task-1'] },
        'col-2': { id: 'col-2', title: 'Done', taskIds: ['task-1'] },
      },
      tasks: {
        'task-1': { id: 'task-1', title: 'Test', description: 'ok' },
      },
    }
    expect(isValidBoardState(dupBoard)).toBe(false)
  })

  it('returns false when a task is in tasks but in zero columns (orphan)', () => {
    const orphanBoard = {
      columnOrder: ['col-1'],
      columns: {
        'col-1': { id: 'col-1', title: 'To Do', taskIds: [] },
      },
      tasks: {
        'task-1': { id: 'task-1', title: 'Orphan', description: 'ok' },
      },
    }
    expect(isValidBoardState(orphanBoard)).toBe(false)
  })

  it('returns false when columnOrder references a missing column', () => {
    const bad = {
      columnOrder: ['col-missing'],
      columns: {},
      tasks: {},
    }
    expect(isValidBoardState(bad)).toBe(false)
  })
})

// ─── clearBoard — direct tests ────────────────────────────────────────────────

describe('clearBoard', () => {
  beforeEach(() => localStorage.clear())

  it('removes the board key so readBoard returns null afterwards', () => {
    writeBoard(validBoard)
    expect(readBoard()).not.toBeNull()
    clearBoard()
    expect(readBoard()).toBeNull()
  })

  it('does not throw when localStorage.removeItem throws (catch branch)', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(() => clearBoard()).not.toThrow()
    vi.restoreAllMocks()
  })
})

// ─── readBoard — additional edge-case branches ────────────────────────────────

describe('readBoard — additional edge cases', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when stored value is JSON-serialised null', () => {
    // Triggers the `parsed === null` branch inside readBoard
    localStorage.setItem(STORAGE_KEYS.board, 'null')
    expect(readBoard()).toBeNull()
  })
})

// ─── isValidBoardState — defensive type-check branches ───────────────────────

describe('isValidBoardState — defensive type checks', () => {
  it('returns false when columnOrder is not an array', () => {
    expect(isValidBoardState({ columnOrder: 'not-array', columns: {}, tasks: {} })).toBe(false)
  })

  it('returns false when columnOrder contains a non-string entry (line 50)', () => {
    // Triggers `typeof id !== 'string'` inside the columnOrder loop
    expect(isValidBoardState({ columnOrder: [42], columns: {}, tasks: {} })).toBe(false)
  })

  it('returns false when columns is null', () => {
    expect(isValidBoardState({ columnOrder: [], columns: null, tasks: {} })).toBe(false)
  })

  it('returns false when tasks is null', () => {
    expect(isValidBoardState({ columnOrder: [], columns: {}, tasks: null })).toBe(false)
  })

  it('returns false when a column value is not an object', () => {
    expect(
      isValidBoardState({
        columnOrder: ['col-1'],
        columns: { 'col-1': 'not-an-object' },
        tasks: {},
      }),
    ).toBe(false)
  })

  it('returns false when a column has no taskIds array', () => {
    expect(
      isValidBoardState({
        columnOrder: ['col-1'],
        columns: { 'col-1': { id: 'col-1', title: 'To Do' /* taskIds missing */ } },
        tasks: {},
      }),
    ).toBe(false)
  })

  it('returns false when a task value is not an object', () => {
    expect(
      isValidBoardState({
        columnOrder: ['col-1'],
        columns: { 'col-1': { id: 'col-1', title: 'To Do', taskIds: ['t1'] } },
        tasks: { t1: 'not-an-object' },
      }),
    ).toBe(false)
  })

  it('returns false when a column has a non-string id (line 62)', () => {
    expect(
      isValidBoardState({
        columnOrder: ['col-1'],
        columns: { 'col-1': { id: 999 /* not string */, title: 'To Do', taskIds: [] } },
        tasks: {},
      }),
    ).toBe(false)
  })

  it('returns false when a column has a non-string title (line 63)', () => {
    expect(
      isValidBoardState({
        columnOrder: ['col-1'],
        columns: { 'col-1': { id: 'col-1', title: 42 /* not a string */, taskIds: [] } },
        tasks: {},
      }),
    ).toBe(false)
  })

  it('returns false when a column taskIds entry is not a string (line 69)', () => {
    expect(
      isValidBoardState({
        columnOrder: ['col-1'],
        columns: { 'col-1': { id: 'col-1', title: 'To Do', taskIds: [123] /* non-string id */ } },
        tasks: {},
      }),
    ).toBe(false)
  })

  it('returns false when a task has a non-string id (line 81)', () => {
    expect(
      isValidBoardState({
        columnOrder: ['col-1'],
        columns: { 'col-1': { id: 'col-1', title: 'To Do', taskIds: ['t1'] } },
        tasks: { t1: { id: 99 /* not string */, title: 'T', description: 'ok' } },
      }),
    ).toBe(false)
  })

  it('returns false when a task has a missing title', () => {
    expect(
      isValidBoardState({
        columnOrder: ['col-1'],
        columns: { 'col-1': { id: 'col-1', title: 'To Do', taskIds: ['t1'] } },
        tasks: { t1: { id: 't1', description: 'ok' /* title missing */ } },
      }),
    ).toBe(false)
  })

  it('returns false when a task has a non-string description (line 83)', () => {
    expect(
      isValidBoardState({
        columnOrder: ['col-1'],
        columns: { 'col-1': { id: 'col-1', title: 'To Do', taskIds: ['t1'] } },
        tasks: { t1: { id: 't1', title: 'T', description: null /* not string */ } },
      }),
    ).toBe(false)
  })

  // Rewritten from the former "non-string columnId" test (canonical Task has no columnId).
  // Asserts column-membership invariant: the same task id appearing twice in the same
  // column's taskIds violates the "exactly once" rule (taskAppearanceCount === 2 !== 1).
  it('returns false when the same task id appears twice in the same column taskIds', () => {
    expect(
      isValidBoardState({
        columnOrder: ['col-1'],
        columns: { 'col-1': { id: 'col-1', title: 'To Do', taskIds: ['t1', 't1'] } },
        tasks: { t1: { id: 't1', title: 'T', description: 'ok' } },
      }),
    ).toBe(false)
  })
})

// ─── TC-016: Quota / throwing storage degrades silently ──────────────────────

describe('quota / throwing storage degrades silently (TC-016)', () => {
  beforeEach(() => localStorage.clear())

  it('writeBoard does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => writeBoard(validBoard)).not.toThrow()
    vi.restoreAllMocks()
  })
})
