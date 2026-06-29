import { describe, it, expect } from 'vitest'
import { createSeedBoard } from '../seedData'
import { isValidBoardState } from '../../storage/boardStorage'

// ─── TC-008: Seed shape ───────────────────────────────────────────────────────

describe('createSeedBoard — shape (TC-008)', () => {
  it('has To Do / In Progress / Done columns in that exact order', () => {
    const board = createSeedBoard()
    expect(board.columnOrder).toEqual(['todo', 'in-progress', 'done'])
    expect(board.columns['todo'].title).toBe('To Do')
    expect(board.columns['in-progress'].title).toBe('In Progress')
    expect(board.columns['done'].title).toBe('Done')
  })

  it('has at least 6 tasks', () => {
    const board = createSeedBoard()
    expect(Object.keys(board.tasks).length).toBeGreaterThanOrEqual(6)
  })

  it('has at least 1 task per column', () => {
    const board = createSeedBoard()
    for (const colId of board.columnOrder) {
      expect(board.columns[colId].taskIds.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('each task appears in exactly one column', () => {
    const board = createSeedBoard()
    const appearances: Record<string, number> = {}
    for (const colId of board.columnOrder) {
      for (const taskId of board.columns[colId].taskIds) {
        appearances[taskId] = (appearances[taskId] ?? 0) + 1
      }
    }
    for (const taskId of Object.keys(board.tasks)) {
      expect(appearances[taskId]).toBe(1)
    }
  })
})

// ─── TC-009: Seed content ─────────────────────────────────────────────────────

describe('createSeedBoard — content (TC-009)', () => {
  it('every task has a non-empty title', () => {
    const board = createSeedBoard()
    for (const task of Object.values(board.tasks)) {
      expect(task.title.length).toBeGreaterThan(0)
    }
  })

  it('every task has a non-empty description', () => {
    const board = createSeedBoard()
    for (const task of Object.values(board.tasks)) {
      expect(task.description.length).toBeGreaterThan(0)
    }
  })
})

// ─── TC-010: Seed determinism ─────────────────────────────────────────────────

describe('createSeedBoard — determinism (TC-010)', () => {
  it('two calls return deeply equal results', () => {
    expect(createSeedBoard()).toEqual(createSeedBoard())
  })

  it('two calls return distinct object references (deep copy)', () => {
    const a = createSeedBoard()
    const b = createSeedBoard()
    expect(a).not.toBe(b)
    expect(a.tasks).not.toBe(b.tasks)
    expect(a.columns).not.toBe(b.columns)
    expect(a.columnOrder).not.toBe(b.columnOrder)
  })

  it('mutating one result does not affect the next call', () => {
    const a = createSeedBoard()
    // Cast to string[] to test array mutation without ColumnId type constraint.
    ;(a.columnOrder as string[]).push('extra')
    const b = createSeedBoard()
    expect(b.columnOrder).not.toContain('extra')
  })
})

// ─── T1 validator cross-check ─────────────────────────────────────────────────

describe('createSeedBoard — isValidBoardState cross-check', () => {
  it('seed board passes the storage validator', () => {
    expect(isValidBoardState(createSeedBoard())).toBe(true)
  })
})
