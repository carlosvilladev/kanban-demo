/**
 * Pure board operations and selectors.
 * No React, no localStorage — testable with plain Vitest.
 *
 * Invariant enforced here: a task id appears in exactly one column's
 * taskIds — never zero, never two.
 */
import type { BoardState, ColumnId, Task } from '../types/board';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Creates an empty board with the three fixed columns in canonical order. */
export function createEmptyBoard(): BoardState {
  return {
    tasks: {},
    columns: {
      'todo': { id: 'todo', title: 'To Do', taskIds: [] },
      'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
      'done': { id: 'done', title: 'Done', taskIds: [] },
    },
    columnOrder: ['todo', 'in-progress', 'done'],
  };
}

/**
 * Adds a new task to the bottom of the target column.
 * Returns state unchanged (no-op) if title is empty or whitespace-only.
 */
export function createTask(
  state: BoardState,
  columnId: ColumnId,
  input: { title: string; description?: string },
): BoardState {
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) return state; // guard: reject empty/whitespace titles

  const id = generateId();
  const task: Task = {
    id,
    title: trimmedTitle,
    description: (input.description ?? '').trim(),
  };

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
  };
}

/**
 * Patches a task's title and/or description.
 * Never touches membership or position.
 * Returns state unchanged if taskId unknown or new title is empty.
 */
export function updateTask(
  state: BoardState,
  taskId: string,
  patch: { title?: string; description?: string },
): BoardState {
  const task = state.tasks[taskId];
  if (!task) return state;

  let newTitle = task.title;
  if (patch.title !== undefined) {
    const trimmed = patch.title.trim();
    if (!trimmed) return state; // guard: reject empty title update
    newTitle = trimmed;
  }

  const newDescription =
    patch.description !== undefined ? patch.description.trim() : task.description;

  return {
    ...state,
    tasks: {
      ...state.tasks,
      [taskId]: { ...task, title: newTitle, description: newDescription },
    },
  };
}

/**
 * Removes a task from the tasks map and from its column's taskIds.
 * Returns state unchanged if taskId unknown.
 */
export function deleteTask(state: BoardState, taskId: string): BoardState {
  if (!state.tasks[taskId]) return state;

  const remainingTasks = Object.fromEntries(
    Object.entries(state.tasks).filter(([id]) => id !== taskId),
  ) as Record<string, Task>;

  return {
    ...state,
    tasks: remainingTasks,
    columns: {
      'todo': {
        ...state.columns['todo'],
        taskIds: state.columns['todo'].taskIds.filter((id) => id !== taskId),
      },
      'in-progress': {
        ...state.columns['in-progress'],
        taskIds: state.columns['in-progress'].taskIds.filter((id) => id !== taskId),
      },
      'done': {
        ...state.columns['done'],
        taskIds: state.columns['done'].taskIds.filter((id) => id !== taskId),
      },
    },
  };
}

/** Returns the number of tasks in the given column. */
export function selectColumnTaskCount(state: BoardState, columnId: ColumnId): number {
  return state.columns[columnId].taskIds.length;
}

/** Returns tasks in the given column, ordered by position (array index). */
export function selectTasksForColumn(state: BoardState, columnId: ColumnId): Task[] {
  return state.columns[columnId].taskIds.map((id) => state.tasks[id]);
}

/** Returns the column that owns the given task, or undefined if not found. */
export function getTaskColumn(state: BoardState, taskId: string): ColumnId | undefined {
  for (const columnId of state.columnOrder) {
    if (state.columns[columnId].taskIds.includes(taskId)) {
      return columnId;
    }
  }
  return undefined;
}

/**
 * Dev-only invariant check.
 * Throws if any task id appears in zero or more than one column's taskIds,
 * or if a taskId in a column doesn't exist in the tasks map.
 */
export function assertBoardInvariants(state: BoardState): void {
  const seenInColumns = new Map<string, number>();

  for (const columnId of state.columnOrder) {
    for (const taskId of state.columns[columnId].taskIds) {
      seenInColumns.set(taskId, (seenInColumns.get(taskId) ?? 0) + 1);
    }
  }

  // Every task in the tasks map must appear exactly once in column taskIds
  for (const taskId of Object.keys(state.tasks)) {
    const count = seenInColumns.get(taskId) ?? 0;
    if (count !== 1) {
      throw new Error(
        `Invariant violated: task "${taskId}" appears in ${count} column(s) (must be exactly 1)`,
      );
    }
  }

  // Every taskId referenced in column taskIds must exist in the tasks map
  for (const [taskId] of seenInColumns) {
    if (!state.tasks[taskId]) {
      throw new Error(
        `Invariant violated: taskId "${taskId}" is in a column's taskIds but not in the tasks map`,
      );
    }
  }
}
