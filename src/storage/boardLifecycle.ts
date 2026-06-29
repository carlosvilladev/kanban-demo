/**
 * boardLifecycle — load-or-seed decision and Reset demo.
 *
 * The only place the "restored > seed" precedence rule lives (DD-5).
 * Composes T1 primitives (readBoard/writeBoard/clearBoard) with the T2 factory.
 */

import type { BoardState } from '../types/board'
import { readBoard, writeBoard, clearBoard } from './boardStorage'
import { createSeedBoard } from '../seed/seedData'

export type LoadSource = 'restored' | 'seeded'

/**
 * Returns the board state that the app should boot with.
 *
 * Decision tree:
 *   1. readBoard() returns a valid saved state → restore it (user state wins, BR-010 / DD-5).
 *   2. readBoard() returns null (missing or corrupt) → seed, persist the seed, return it.
 *
 * Persisting the seed on first load ensures "saved state exists" is true after the first
 * render, making restore/reset behavior consistent. (AC-003, DD-1, FR-P4)
 */
export function loadInitialBoard(): { state: BoardState; source: LoadSource } {
  const saved = readBoard()
  if (saved !== null) {
    return { state: saved, source: 'restored' }
  }

  const seed = createSeedBoard()
  writeBoard(seed)
  return { state: seed, source: 'seeded' }
}

/**
 * Clears the current saved state and replaces it with a fresh seed.
 * Returns the fresh seed so the caller can adopt it as the new source of truth.
 * (DD-4 / BR-009 / AC-009)
 */
export function resetDemo(): BoardState {
  clearBoard()
  const seed = createSeedBoard()
  writeBoard(seed)
  return seed
}
