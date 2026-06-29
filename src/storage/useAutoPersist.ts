/**
 * useAutoPersist — write-through persistence hook.
 *
 * Observes `state` and calls writeBoard on every change, implementing
 * the "no manual save" invariant (FR-P2 / invariant-6).
 *
 * This hook does NOT own the board state — the board provider (kanban-board)
 * holds state via a reducer. This hook is purely an observer / persistence
 * side-effect, keeping storage decoupled from state logic.
 *
 * Storage errors are swallowed by writeBoard (T1 / NFR-T04) so this effect
 * never throws.
 *
 * Reset demo seam:
 *   On click → const fresh = resetDemo(); dispatch(replaceBoard(fresh))
 *   The button placement and dispatch wiring belong to kanban-board.
 *   Re-exported resetDemo below surfaces it at the storage barrel boundary.
 */

import { useEffect } from 'react'
import type { BoardState } from '../types/board'
import { writeBoard } from './boardStorage'

export function useAutoPersist(state: BoardState): void {
  useEffect(() => {
    writeBoard(state)
  }, [state])
}

// Re-export resetDemo so app-shell / board provider can import it without
// reaching into boardLifecycle directly (barrel boundary).
export { resetDemo } from './boardLifecycle'
