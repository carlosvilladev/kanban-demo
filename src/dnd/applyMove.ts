/**
 * Atomic move transform — thin delegation to the canonical `moveTask` operation.
 *
 * This file is the DnD layer's entry point for state mutations.
 * There is exactly ONE move algorithm, implemented in src/board/operations.ts.
 * applyMove delegates to it; the store's MOVE_TASK action also delegates to it.
 */
import { moveTask } from '../board/operations';
import type { BoardState } from '../types/board';
import type { Move } from './types';

/**
 * Apply a move to the board state.
 * Delegates to operations.moveTask — single implementation, no duplication.
 */
export function applyMove(board: BoardState, move: Move): BoardState {
  return moveTask(board, move);
}
