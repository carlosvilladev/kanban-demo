/**
 * DnD-local types.
 * Re-exports canonical board model types — does NOT redefine them.
 */
export type { BoardState, ColumnId, Task, Column } from '../types/board';

/** Computed drop target: where the dragged card should land. */
export interface DropTarget {
  toColumnId: import('../types/board').ColumnId;
  toIndex: number;
}

/** Move descriptor passed to applyMove / moveTask. */
export interface Move {
  taskId: string;
  toColumnId: import('../types/board').ColumnId;
  toIndex: number;
}
