/**
 * PersistenceSyncer — zero-UI child component that auto-persists board state.
 *
 * Renders nothing. Must be placed INSIDE <BoardProvider> so it can access
 * useBoard(). On every state change it calls writeBoard via useAutoPersist,
 * keeping localStorage in sync without any manual save action.
 *
 * Architecture seam (from persistence-seed spec):
 *   <BoardProvider initialState={...}>
 *     <PersistenceSyncer />   ← here
 *     <Board />
 *   </BoardProvider>
 */
import { useBoard } from '../board/BoardContext';
import { useAutoPersist } from '../storage/useAutoPersist';

export function PersistenceSyncer(): null {
  const { state } = useBoard();
  useAutoPersist(state);
  return null;
}
