/**
 * Pure board operations and selectors.
 *
 * No React. No localStorage. Framework-free core that enforces:
 *   - The "exactly one column per task" invariant.
 *   - Immutable updates — every function returns a new state object.
 *   - All mutations delegate through this module (SRP / single source of truth).
 */

import type { BoardState, ColumnId, Task } from '../types/board'

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Returns a fresh empty board with the three canonical columns and no tasks.
 */
export function createEmptyBoard(): BoardState {
  return {
    columnOrder: ['todo', 'in-progress', 'done'],
    columns: {
      'todo': { id: 'todo', title: 'To Do', taskIds: [] },
      'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
      'done': { id: 'done', title: 'Done', taskIds: [] },
    },
    tasks: {},
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Adds a new task to `columnId` at the bottom.
 * Returns state unchanged (same reference) if `title` is empty after trimming.
 */
export function createTask(
  state: BoardState,
  columnId: ColumnId,
  input: { title: string; description?: string },
): BoardState {
  const title = input.title.trim()
  if (!title) return state

  const id = crypto.randomUUID()
  const task: Task = { id, title, description: input.description ?? '' }

  return {
    ...state,
    tasks: { ...state.tasks, [id]: task },
    columns: {
      ...state.columns,
      [columnId]: {
        ...state.columns[columnId],
        taskIds: [...state.columns[columnId].taskIds, id],
      },
    },
  }
}

/**
 * Patches `title` and/or `description` on an existing task.
 * Returns state unchanged (same reference) if `taskId` is not found.
 * Never touches column membership or position.
 */
export function updateTask(
  state: BoardState,
  taskId: string,
  patch: { title?: string; description?: string },
): BoardState {
  if (!(taskId in state.tasks)) return state

  const existing = state.tasks[taskId]
  const updated: Task = {
    id: existing.id,
    title: patch.title !== undefined ? patch.title : existing.title,
    description: patch.description !== undefined ? patch.description : existing.description,
  }

  return {
    ...state,
    tasks: { ...state.tasks, [taskId]: updated },
  }
}

/**
 * Removes a task from the tasks map and from whichever column owns it.
 * Returns state unchanged if `taskId` is not found.
 */
export function deleteTask(state: BoardState, taskId: string): BoardState {
  if (!(taskId in state.tasks)) return state

  // Build tasks without the deleted entry
  const tasks: Record<string, Task> = Object.fromEntries(
    Object.entries(state.tasks).filter(([id]) => id !== taskId),
  )

  // Remove taskId from whichever column contains it
  const columns = { ...state.columns }
  for (const colId of state.columnOrder) {
    if (state.columns[colId].taskIds.includes(taskId)) {
      columns[colId] = {
        ...state.columns[colId],
        taskIds: state.columns[colId].taskIds.filter(id => id !== taskId),
      }
    }
  }

  return { ...state, tasks, columns }
}

// ─── Selectors ────────────────────────────────────────────────────────────────

/** Returns the number of tasks in `columnId`. */
export function selectColumnTaskCount(state: BoardState, columnId: ColumnId): number {
  return state.columns[columnId].taskIds.length
}

/** Returns the ordered Task objects for `columnId` (order = taskIds array). */
export function selectTasksForColumn(state: BoardState, columnId: ColumnId): Task[] {
  return state.columns[columnId].taskIds.map(id => state.tasks[id])
}

/** Returns the ColumnId that owns `taskId`, or undefined if not found. */
export function getTaskColumn(state: BoardState, taskId: string): ColumnId | undefined {
  for (const colId of state.columnOrder) {
    if (state.columns[colId].taskIds.includes(taskId)) return colId
  }
  return undefined
}

// ─── Invariant guard ──────────────────────────────────────────────────────────

/**
 * Dev-only assertion: every task in `tasks` appears in exactly one column's taskIds.
 * Throws if the invariant is violated.
 */
export function assertBoardInvariants(state: BoardState): void {
  const count: Record<string, number> = {}
  for (const colId of state.columnOrder) {
    for (const taskId of state.columns[colId].taskIds) {
      count[taskId] = (count[taskId] ?? 0) + 1
    }
  }
  for (const taskId of Object.keys(state.tasks)) {
    const appearances = count[taskId] ?? 0
    if (appearances !== 1) {
      throw new Error(
        `Board invariant violated: task "${taskId}" appears in ${appearances} column(s) — expected exactly 1`,
      )
    }
  }
}
