/**
 * Load-or-seed lifecycle and Reset demo orchestration.
 *
 * This is the only place the "restored > seeded" precedence decision lives:
 * - loadInitialBoard: read → if valid return it; else seed + persist + return.
 * - resetDemo: clear → fresh seed → persist → return.
 *
 * Dependencies: T1 (boardStorage), T2 (createSeedBoard).
 */
import type { BoardState } from '../types/board';
import { readBoard, writeBoard, clearBoard } from './boardStorage';
import { createSeedBoard } from '../seed/seedData';

export type LoadSource = 'restored' | 'seeded';

/**
 * Determines the initial board state on app startup.
 *
 * Precedence (DD-5 / BR-010):
 * 1. Valid saved state  → restored (user state always wins over seed).
 * 2. Missing or invalid → fresh seed, immediately persisted so "saved state
 *    exists" becomes true after the first render (DD-1).
 */
export function loadInitialBoard(): { state: BoardState; source: LoadSource } {
  const saved = readBoard();
  if (saved !== null) {
    return { state: saved, source: 'restored' };
  }

  // No valid saved state — seed, persist, return
  const seed = createSeedBoard();
  writeBoard(seed);
  return { state: seed, source: 'seeded' };
}

/**
 * Resets the demo to its original seeded state.
 *
 * 1. Clears saved board state.
 * 2. Creates a fresh deterministic seed.
 * 3. Persists the seed.
 * 4. Returns the seed so the caller can adopt it as the new source of truth.
 *
 * The returned seed deep-equals createSeedBoard() (DD-4 / BR-009).
 */
export function resetDemo(): BoardState {
  clearBoard();
  const seed = createSeedBoard();
  writeBoard(seed);
  return seed;
}
