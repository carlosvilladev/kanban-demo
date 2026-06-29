/**
 * Pure projection: dnd-kit active/over IDs → DropTarget | null.
 *
 * Returns null when the drop should be cancelled (off-target or unknown id).
 * Never mutates inputs.
 */
import type { BoardState, ColumnId } from '../types/board';
import { getTaskColumn } from '../board/operations';
import type { DropTarget } from './types';

export function projectDrop(
  board: BoardState,
  activeId: string,
  overId: string | null,
): DropTarget | null {
  // Active task must exist
  if (!board.tasks[activeId]) return null;

  // Off-target → cancel
  if (overId === null) return null;

  // Over a column → insert at end (or 0 if empty)
  if (overId in board.columns) {
    const colId = overId as ColumnId;
    return {
      toColumnId: colId,
      toIndex: board.columns[colId].taskIds.length,
    };
  }

  // Over another task → insert-before, adjusted for within-column downward moves
  if (board.tasks[overId]) {
    const targetColumnId = getTaskColumn(board, overId);
    if (!targetColumnId) return null;

    const targetTaskIds = board.columns[targetColumnId].taskIds;
    const overIndex = targetTaskIds.indexOf(overId);

    let toIndex = overIndex; // insert-before semantics

    const sourceColumnId = getTaskColumn(board, activeId);
    if (sourceColumnId === targetColumnId) {
      const sourceIndex = targetTaskIds.indexOf(activeId);
      if (sourceIndex < overIndex) {
        // Moving down: after removing active, over-item shifts one position up,
        // so we subtract 1 to keep insert-before semantics consistent.
        toIndex = overIndex - 1;
      }
    }

    return { toColumnId: targetColumnId, toIndex };
  }

  // Unknown overId (neither a column id nor a task id)
  return null;
}
