/**
 * Board operations unit tests (TC-001 through TC-006).
 *
 * Pure functions only — no React, no localStorage.
 * Each test builds state from scratch using the exported ops.
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyBoard,
  createTask,
  updateTask,
  deleteTask,
  selectColumnTaskCount,
  selectTasksForColumn,
  getTaskColumn,
  assertBoardInvariants,
} from './operations'
import type { BoardState } from '../types/board'

// ─── TC-001: createEmptyBoard ─────────────────────────────────────────────────

describe('createEmptyBoard (TC-001)', () => {
  it('returns a board with three fixed columns in columnOrder', () => {
    const board = createEmptyBoard()
    expect(board.columnOrder).toEqual(['todo', 'in-progress', 'done'])
  })

  it('has exactly three columns keyed by canonical ColumnId', () => {
    const board = createEmptyBoard()
    expect(Object.keys(board.columns).sort()).toEqual(['done', 'in-progress', 'todo'])
  })

  it('column titles are To Do / In Progress / Done', () => {
    const board = createEmptyBoard()
    expect(board.columns['todo'].title).toBe('To Do')
    expect(board.columns['in-progress'].title).toBe('In Progress')
    expect(board.columns['done'].title).toBe('Done')
  })

  it('starts with no tasks', () => {
    const board = createEmptyBoard()
    expect(Object.keys(board.tasks)).toHaveLength(0)
    for (const colId of board.columnOrder) {
      expect(board.columns[colId].taskIds).toHaveLength(0)
    }
  })

  it('each call returns a fresh deep copy', () => {
    const a = createEmptyBoard()
    const b = createEmptyBoard()
    expect(a).not.toBe(b)
    expect(a.columns).not.toBe(b.columns)
  })

  it('returned board passes assertBoardInvariants', () => {
    expect(() => assertBoardInvariants(createEmptyBoard())).not.toThrow()
  })
})

// ─── TC-002: createTask ───────────────────────────────────────────────────────

describe('createTask (TC-002)', () => {
  it('adds a task to the target column taskIds and to tasks map', () => {
    const board = createTask(createEmptyBoard(), 'todo', { title: 'New task' })
    const ids = board.columns['todo'].taskIds
    expect(ids).toHaveLength(1)
    expect(board.tasks[ids[0]]).toMatchObject({ title: 'New task' })
  })

  it('defaults description to empty string when not provided', () => {
    const board = createTask(createEmptyBoard(), 'todo', { title: 'T' })
    const id = board.columns['todo'].taskIds[0]
    expect(board.tasks[id].description).toBe('')
  })

  it('stores the provided description', () => {
    const board = createTask(createEmptyBoard(), 'todo', { title: 'T', description: 'Desc' })
    const id = board.columns['todo'].taskIds[0]
    expect(board.tasks[id].description).toBe('Desc')
  })

  it('trims leading/trailing whitespace from title', () => {
    const board = createTask(createEmptyBoard(), 'todo', { title: '  Trimmed  ' })
    const id = board.columns['todo'].taskIds[0]
    expect(board.tasks[id].title).toBe('Trimmed')
  })

  it('appends new task to the bottom of the column', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'First' })
    board = createTask(board, 'todo', { title: 'Second' })
    const ids = board.columns['todo'].taskIds
    expect(ids).toHaveLength(2)
    expect(board.tasks[ids[0]].title).toBe('First')
    expect(board.tasks[ids[1]].title).toBe('Second')
  })

  it('creates tasks in different columns independently', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'A' })
    board = createTask(board, 'in-progress', { title: 'B' })
    board = createTask(board, 'done', { title: 'C' })
    expect(board.columns['todo'].taskIds).toHaveLength(1)
    expect(board.columns['in-progress'].taskIds).toHaveLength(1)
    expect(board.columns['done'].taskIds).toHaveLength(1)
    expect(Object.keys(board.tasks)).toHaveLength(3)
  })

  it('does not mutate the input state', () => {
    const original = createEmptyBoard()
    const next = createTask(original, 'todo', { title: 'X' })
    expect(original.columns['todo'].taskIds).toHaveLength(0)
    expect(original.tasks).toEqual({})
    expect(next).not.toBe(original)
  })

  it('generates a unique id for each task', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'A' })
    board = createTask(board, 'todo', { title: 'B' })
    const [id1, id2] = board.columns['todo'].taskIds
    expect(id1).not.toBe(id2)
  })
})

// ─── TC-003: empty title rejection ───────────────────────────────────────────

describe('createTask — empty title rejection (TC-003)', () => {
  it('returns the same state reference when title is empty string', () => {
    const board = createEmptyBoard()
    expect(createTask(board, 'todo', { title: '' })).toBe(board)
  })

  it('returns the same state reference when title is whitespace only', () => {
    const board = createEmptyBoard()
    expect(createTask(board, 'todo', { title: '   ' })).toBe(board)
  })

  it('adds nothing to tasks or taskIds when title is empty', () => {
    const board = createEmptyBoard()
    const next = createTask(board, 'todo', { title: '' })
    expect(Object.keys(next.tasks)).toHaveLength(0)
    expect(next.columns['todo'].taskIds).toHaveLength(0)
  })
})

// ─── TC-004: updateTask ───────────────────────────────────────────────────────

describe('updateTask (TC-004)', () => {
  it('patches the task title', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'Old title' })
    const id = board.columns['todo'].taskIds[0]
    const next = updateTask(board, id, { title: 'New title' })
    expect(next.tasks[id].title).toBe('New title')
  })

  it('patches the task description', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'T', description: 'Old desc' })
    const id = board.columns['todo'].taskIds[0]
    const next = updateTask(board, id, { description: 'New desc' })
    expect(next.tasks[id].description).toBe('New desc')
  })

  it('patches only the supplied fields (partial update)', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'T', description: 'Keep this' })
    const id = board.columns['todo'].taskIds[0]
    const next = updateTask(board, id, { title: 'Updated' })
    expect(next.tasks[id].title).toBe('Updated')
    expect(next.tasks[id].description).toBe('Keep this')
  })

  it('never changes column membership or order', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'T' })
    const id = board.columns['todo'].taskIds[0]
    const next = updateTask(board, id, { title: 'Updated' })
    expect(next.columns['todo'].taskIds).toContain(id)
    expect(getTaskColumn(next, id)).toBe('todo')
  })

  it('returns the same state reference for an unknown taskId', () => {
    const board = createEmptyBoard()
    expect(updateTask(board, 'ghost', { title: 'X' })).toBe(board)
  })

  it('does not mutate the input state', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'Original' })
    const id = board.columns['todo'].taskIds[0]
    updateTask(board, id, { title: 'New' })
    expect(board.tasks[id].title).toBe('Original')
  })
})

// ─── TC-005: deleteTask ───────────────────────────────────────────────────────

describe('deleteTask (TC-005)', () => {
  it('removes the task from tasks map', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'T' })
    const id = board.columns['todo'].taskIds[0]
    const next = deleteTask(board, id)
    expect(next.tasks[id]).toBeUndefined()
  })

  it('removes the task id from its column taskIds', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'T' })
    const id = board.columns['todo'].taskIds[0]
    const next = deleteTask(board, id)
    expect(next.columns['todo'].taskIds).not.toContain(id)
  })

  it('preserves other tasks in the same column', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'T1' })
    board = createTask(board, 'todo', { title: 'T2' })
    const [id1, id2] = board.columns['todo'].taskIds
    const next = deleteTask(board, id1)
    expect(next.tasks[id2]).toBeDefined()
    expect(next.columns['todo'].taskIds).toEqual([id2])
  })

  it('preserves tasks in other columns', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'A' })
    board = createTask(board, 'in-progress', { title: 'B' })
    const todoId = board.columns['todo'].taskIds[0]
    const ipId = board.columns['in-progress'].taskIds[0]
    const next = deleteTask(board, todoId)
    expect(next.tasks[ipId]).toBeDefined()
    expect(next.columns['in-progress'].taskIds).toContain(ipId)
  })

  it('does not mutate the input state', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'T' })
    const id = board.columns['todo'].taskIds[0]
    deleteTask(board, id)
    expect(board.tasks[id]).toBeDefined()
    expect(board.columns['todo'].taskIds).toContain(id)
  })
})

// ─── Selectors ────────────────────────────────────────────────────────────────

describe('selectColumnTaskCount', () => {
  it('returns 0 for an empty column', () => {
    expect(selectColumnTaskCount(createEmptyBoard(), 'todo')).toBe(0)
  })

  it('returns the correct count after tasks are added', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'A' })
    board = createTask(board, 'todo', { title: 'B' })
    expect(selectColumnTaskCount(board, 'todo')).toBe(2)
    expect(selectColumnTaskCount(board, 'in-progress')).toBe(0)
  })

  it('decrements after a task is deleted', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'A' })
    const id = board.columns['todo'].taskIds[0]
    board = deleteTask(board, id)
    expect(selectColumnTaskCount(board, 'todo')).toBe(0)
  })
})

describe('selectTasksForColumn', () => {
  it('returns an empty array for an empty column', () => {
    expect(selectTasksForColumn(createEmptyBoard(), 'todo')).toHaveLength(0)
  })

  it('returns tasks in taskIds order', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'First' })
    board = createTask(board, 'todo', { title: 'Second' })
    const tasks = selectTasksForColumn(board, 'todo')
    expect(tasks).toHaveLength(2)
    expect(tasks[0].title).toBe('First')
    expect(tasks[1].title).toBe('Second')
  })

  it('returns full Task objects (not just ids)', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'T', description: 'D' })
    const tasks = selectTasksForColumn(board, 'todo')
    expect(tasks[0]).toMatchObject({ title: 'T', description: 'D' })
  })
})

describe('getTaskColumn', () => {
  it('returns the column id that owns the task', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'in-progress', { title: 'T' })
    const id = board.columns['in-progress'].taskIds[0]
    expect(getTaskColumn(board, id)).toBe('in-progress')
  })

  it('returns undefined for an unknown task id', () => {
    expect(getTaskColumn(createEmptyBoard(), 'ghost')).toBeUndefined()
  })
})

// ─── TC-006: assertBoardInvariants ───────────────────────────────────────────

describe('assertBoardInvariants (TC-006)', () => {
  it('does not throw for a valid empty board', () => {
    expect(() => assertBoardInvariants(createEmptyBoard())).not.toThrow()
  })

  it('does not throw when all tasks are in exactly one column', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'A' })
    board = createTask(board, 'in-progress', { title: 'B' })
    expect(() => assertBoardInvariants(board)).not.toThrow()
  })

  it('throws when a task appears in zero columns (orphan)', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'Orphan' })
    // Remove from column but keep in tasks map
    const corrupted: BoardState = {
      ...board,
      columns: {
        ...board.columns,
        todo: { ...board.columns['todo'], taskIds: [] },
      },
    }
    expect(() => assertBoardInvariants(corrupted)).toThrow()
  })

  it('throws when a task appears in two columns (duplicate)', () => {
    let board = createEmptyBoard()
    board = createTask(board, 'todo', { title: 'T' })
    const id = board.columns['todo'].taskIds[0]
    // Inject the same id into another column without creating the task twice
    const corrupted: BoardState = {
      ...board,
      columns: {
        ...board.columns,
        'in-progress': {
          ...board.columns['in-progress'],
          taskIds: [id],
        },
      },
    }
    expect(() => assertBoardInvariants(corrupted)).toThrow()
  })
})
