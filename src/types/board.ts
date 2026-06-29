// Authoritative type model for the Kanban board.
// Imported by all sibling specs (drag-and-drop, persistence-seed, demo-auth).

export type ColumnId = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;          // unique, stable (crypto.randomUUID)
  title: string;       // required; non-empty after trim
  description: string; // optional content; '' when none
}

export interface Column {
  id: ColumnId;
  title: string;       // 'To Do' | 'In Progress' | 'Done'
  taskIds: string[];   // ordered; a task's position === its index here
}

/**
 * Single source of truth for board state.
 *
 * Invariant (BR-011): a task id appears in exactly one column's taskIds —
 * never zero, never two. Task carries NO columnId/order field; membership
 * and position derive solely from column.taskIds.
 */
export interface BoardState {
  tasks: Record<string, Task>;        // normalized — keyed by Task.id
  columns: Record<ColumnId, Column>;  // the three fixed columns
  columnOrder: ColumnId[];            // fixed: ['todo','in-progress','done']
}
