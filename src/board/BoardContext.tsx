/**
 * BoardProvider + useBoard — single source of truth for board state.
 *
 * Design:
 *   - useReducer delegates all mutations to the pure ops in operations.ts (SRP).
 *   - `initialState` prop is the seam persistence-seed uses to inject seeded/restored state.
 *   - Selectors are bound to current state so consumers always read consistent data.
 *   - A MOVE_TASK action slot is reserved for the drag-and-drop feature.
 */

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from 'react'
import type { BoardState, ColumnId, Task } from '../types/board'
import {
  createEmptyBoard,
  createTask as opCreateTask,
  updateTask as opUpdateTask,
  deleteTask as opDeleteTask,
  selectColumnTaskCount as opSelectCount,
  selectTasksForColumn as opSelectTasks,
  getTaskColumn as opGetTaskColumn,
} from './operations'

// ─── Actions ──────────────────────────────────────────────────────────────────

type BoardAction =
  | { type: 'CREATE_TASK'; columnId: ColumnId; input: { title: string; description?: string } }
  | { type: 'UPDATE_TASK'; taskId: string; patch: { title?: string; description?: string } }
  | { type: 'DELETE_TASK'; taskId: string }
  // Reserved for drag-and-drop feature (T-DND):
  // | { type: 'MOVE_TASK'; taskId: string; toColumnId: ColumnId; toIndex: number }

// ─── Reducer ──────────────────────────────────────────────────────────────────

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'CREATE_TASK':
      return opCreateTask(state, action.columnId, action.input)
    case 'UPDATE_TASK':
      return opUpdateTask(state, action.taskId, action.patch)
    case 'DELETE_TASK':
      return opDeleteTask(state, action.taskId)
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

// ─── Context value shape ──────────────────────────────────────────────────────

interface BoardContextValue {
  state: BoardState
  createTask: (columnId: ColumnId, input: { title: string; description?: string }) => void
  editTask: (taskId: string, patch: { title?: string; description?: string }) => void
  deleteTask: (taskId: string) => void
  selectColumnTaskCount: (columnId: ColumnId) => number
  selectTasksForColumn: (columnId: ColumnId) => Task[]
  getTaskColumn: (taskId: string) => ColumnId | undefined
}

const BoardContext = createContext<BoardContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

interface BoardProviderProps {
  /** Seed or restored state from persistence-seed. Defaults to an empty board. */
  initialState?: BoardState
  children: ReactNode
}

export function BoardProvider({ initialState, children }: BoardProviderProps) {
  const [state, dispatch] = useReducer(
    boardReducer,
    initialState ?? createEmptyBoard(),
  )

  const value: BoardContextValue = {
    state,
    createTask: (columnId, input) =>
      dispatch({ type: 'CREATE_TASK', columnId, input }),
    editTask: (taskId, patch) =>
      dispatch({ type: 'UPDATE_TASK', taskId, patch }),
    deleteTask: (taskId) =>
      dispatch({ type: 'DELETE_TASK', taskId }),
    selectColumnTaskCount: (columnId) => opSelectCount(state, columnId),
    selectTasksForColumn: (columnId) => opSelectTasks(state, columnId),
    getTaskColumn: (taskId) => opGetTaskColumn(state, taskId),
  }

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBoard(): BoardContextValue {
  const ctx = useContext(BoardContext)
  if (ctx === null) {
    throw new Error('useBoard must be used within a BoardProvider')
  }
  return ctx
}
