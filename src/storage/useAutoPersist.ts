/**
 * useAutoPersist — write-through persistence hook.
 *
 * Observes the board state from a <BoardProvider> descendant and persists it
 * on every change (FR-P2). There is no manual save — every state change
 * auto-persists.
 *
 * Pattern: render a <PersistenceSyncer> child inside <BoardProvider> that
 * calls useAutoPersist(useBoard().state).
 *
 * writeBoard already swallows storage errors (NFR-T04) so this hook is
 * guaranteed not to throw.
 */
import { useEffect } from 'react';
import type { BoardState } from '../types/board';
import { writeBoard } from './boardStorage';

/**
 * Persists `state` to localStorage on every render where `state` has changed.
 * Returns void — this hook is side-effect only.
 */
export function useAutoPersist(state: BoardState): void {
  useEffect(() => {
    writeBoard(state);
  }, [state]);
}
