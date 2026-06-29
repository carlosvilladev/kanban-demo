/**
 * Canonical BoardState types for the kanban-board feature.
 * All other features import from here.
 *
 * Design rules (normalized shape):
 *   - Task has NO columnId — membership lives ONLY in Column.taskIds.
 *   - ColumnId is a closed union; columns are fixed in v1 (no CRUD).
 *   - BoardState is the single source of truth; components never touch localStorage directly.
 */

export type ColumnId = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
}

export interface Column {
  id: ColumnId
  title: string
  /** Ordered list of task ids — array index defines render order. */
  taskIds: string[]
}

export interface BoardState {
  /** Map of task id → Task — single source of truth for task data. */
  tasks: Record<string, Task>
  /** Map of column id → Column. All three keys are always present in v1. */
  columns: Record<ColumnId, Column>
  /** Ordered list of column ids — the canonical rendering order. */
  columnOrder: ColumnId[]
}
