import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAutoPersist } from '../useAutoPersist'
import { createSeedBoard } from '../../seed/seedData'
import type { BoardState } from '../../types/board'

// ─── Mock boardStorage so we can spy on writeBoard without touching localStorage
vi.mock('../boardStorage', () => ({
  writeBoard: vi.fn(),
  readBoard: vi.fn(() => null),
  clearBoard: vi.fn(),
  isValidBoardState: vi.fn(() => true),
  STORAGE_KEYS: { board: 'kanban-demo:board' },
  SCHEMA_VERSION: 1,
}))

import { writeBoard } from '../boardStorage'

// ─── TC-015: Auto-persist on change ──────────────────────────────────────────

describe('useAutoPersist (TC-015)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls writeBoard with the initial state on mount', () => {
    const state = createSeedBoard()
    renderHook(() => useAutoPersist(state))
    expect(writeBoard).toHaveBeenCalledWith(state)
  })

  it('calls writeBoard again when state reference changes', () => {
    const state1 = createSeedBoard()
    const { rerender } = renderHook(
      ({ state }: { state: BoardState }) => useAutoPersist(state),
      { initialProps: { state: state1 } },
    )

    const state2 = createSeedBoard()
    // Mutate a field so state2 is a distinct object with different content
    state2.tasks['t-scaffold'] = { ...state2.tasks['t-scaffold'], title: 'Updated' }
    rerender({ state: state2 })

    expect(writeBoard).toHaveBeenCalledWith(state2)
    expect(writeBoard).toHaveBeenCalledTimes(2)
  })

  // NFR-T04 (quota/throwing storage) is verified in boardStorage.test.ts TC-016.
  // writeBoard guarantees no throw by design; this hook relies on that contract.
})
