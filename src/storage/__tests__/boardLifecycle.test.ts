import { describe, it, expect, beforeEach } from 'vitest'
import { loadInitialBoard, resetDemo } from '../boardLifecycle'
import { readBoard, writeBoard } from '../boardStorage'
import { createSeedBoard } from '../../seed/seedData'

// ─── TC-011: First load seeds and persists ────────────────────────────────────

describe('loadInitialBoard — empty storage (TC-011)', () => {
  beforeEach(() => localStorage.clear())

  it('returns source: seeded and a state equal to createSeedBoard()', () => {
    const { state, source } = loadInitialBoard()
    expect(source).toBe('seeded')
    expect(state).toEqual(createSeedBoard())
  })

  it('persists the seed so a subsequent readBoard returns it', () => {
    const { state } = loadInitialBoard()
    expect(readBoard()).toEqual(state)
  })
})

// ─── TC-012: Saved state wins over seed ───────────────────────────────────────

describe('loadInitialBoard — valid saved state (TC-012)', () => {
  beforeEach(() => localStorage.clear())

  it('returns source: restored with the saved state, not the seed', () => {
    // Write a board that differs from the seed
    const custom = createSeedBoard()
    custom.tasks['t-scaffold'] = { ...custom.tasks['t-scaffold'], title: 'Custom Title' }
    writeBoard(custom)

    const { state, source } = loadInitialBoard()
    expect(source).toBe('restored')
    expect(state).toEqual(custom)
    // Specifically NOT equal to the fresh seed
    expect(state.tasks['t-scaffold'].title).toBe('Custom Title')
  })

  it('does not overwrite existing saved state with the seed', () => {
    const saved = createSeedBoard()
    // Modify a task title so the saved board differs from a fresh seed.
    // Column membership is unchanged; only task data differs.
    saved.tasks['t-scaffold'] = { ...saved.tasks['t-scaffold'], title: 'Saved modified title' }
    writeBoard(saved)

    loadInitialBoard()
    // saved state should still be in storage untouched
    expect(readBoard()).toEqual(saved)
  })
})

// ─── TC-013: Corrupt load falls back to seed ──────────────────────────────────

describe('loadInitialBoard — corrupt saved state (TC-013)', () => {
  beforeEach(() => localStorage.clear())

  it('returns source: seeded and never throws', () => {
    localStorage.setItem('kanban-demo:board', '{corrupt json')
    const { state, source } = loadInitialBoard()
    expect(source).toBe('seeded')
    expect(state).toEqual(createSeedBoard())
  })

  it('returns non-empty state even on corrupt storage', () => {
    localStorage.setItem('kanban-demo:board', 'null')
    const { state } = loadInitialBoard()
    expect(Object.keys(state.tasks).length).toBeGreaterThan(0)
  })
})

// ─── TC-014: resetDemo ────────────────────────────────────────────────────────

describe('resetDemo (TC-014)', () => {
  beforeEach(() => localStorage.clear())

  it('clears existing state and overwrites with a fresh seed', () => {
    // Write a custom state
    const custom = createSeedBoard()
    custom.tasks['t-scaffold'] = { ...custom.tasks['t-scaffold'], title: 'Modified' }
    writeBoard(custom)

    const result = resetDemo()

    // Return value must equal a fresh seed
    expect(result).toEqual(createSeedBoard())
    // Storage must also equal a fresh seed
    expect(readBoard()).toEqual(createSeedBoard())
  })

  it('returns a state deeply equal to createSeedBoard()', () => {
    const result = resetDemo()
    expect(result).toEqual(createSeedBoard())
  })

  it('works from an already-empty storage', () => {
    expect(() => resetDemo()).not.toThrow()
    expect(readBoard()).toEqual(createSeedBoard())
  })
})
