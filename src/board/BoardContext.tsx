/**
 * Single source of truth for board state.
 *
 * BoardProvider wraps the app (or a subtree) with board state in useReducer.
 * useBoard() exposes state + action creators + selectors to any descendant.
 *
 * Extension seams:
 * - initialState: persistence-seed passes a seeded/restored BoardState here.
 * - useBoard().state observable: persistence-seed renders a <PersistenceSyncer>
 *   child inside this provider and reacts to state changes via useEffect([state]).
 * - MOVE_TASK action: drag-and-drop extends boardReducer with this action; see
 *   the BoardAction comment below for the expected shape.
 */
import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import type { BoardState, ColumnId, Task } from '../types/board';
import {
  createEmptyBoard,
  createTask as opCreateTask,
  updateTask as opUpdateTask,
  deleteTask as opDeleteTask,
  moveTask as opMoveTask,
  selectColumnTaskCount as opSelectColumnTaskCount,
  selectTasksForColumn as opSelectTasksForColumn,
  getTaskColumn as opGetTaskColumn,
} from './operations';

// ─── Actions ────────────────────────────────────────────────────────────────

/**
 * Union of all dispatch-able actions.
 *
 * MOVE_TASK: added by drag-and-drop spec.
 * Delegates to operations.moveTask (single algorithm — no divergent implementation).
 */
type BoardAction =
  | { type: 'CREATE_TASK'; columnId: ColumnId; input: { title: string; description?: string } }
  | { type: 'UPDATE_TASK'; taskId: string; patch: { title?: string; description?: string } }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'REPLACE_BOARD'; state: BoardState }
  | { type: 'MOVE_TASK'; taskId: string; toColumnId: ColumnId; toIndex: number };

// ─── Reducer ────────────────────────────────────────────────────────────────

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'CREATE_TASK':
      return opCreateTask(state, action.columnId, action.input);
    case 'UPDATE_TASK':
      return opUpdateTask(state, action.taskId, action.patch);
    case 'DELETE_TASK':
      return opDeleteTask(state, action.taskId);
    case 'REPLACE_BOARD':
      return action.state;
    case 'MOVE_TASK':
      return opMoveTask(state, {
        taskId: action.taskId,
        toColumnId: action.toColumnId,
        toIndex: action.toIndex,
      });
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface BoardContextValue {
  state: BoardState;
  createTask: (columnId: ColumnId, input: { title: string; description?: string }) => void;
  editTask: (taskId: string, patch: { title?: string; description?: string }) => void;
  deleteTask: (taskId: string) => void;
  /** Replace the entire board state atomically (used by Reset demo). */
  replaceBoard: (state: BoardState) => void;
  /** Move a task to a new column and position. Single atomic dispatch. */
  moveTask: (taskId: string, toColumnId: ColumnId, toIndex: number) => void;
  selectColumnTaskCount: (columnId: ColumnId) => number;
  selectTasksForColumn: (columnId: ColumnId) => Task[];
  getTaskColumn: (taskId: string) => ColumnId | undefined;
}

const BoardContext = createContext<BoardContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

interface BoardProviderProps {
  /**
   * Optional seed/restore seam for persistence-seed.
   * When absent, the board starts empty (createEmptyBoard()).
   */
  initialState?: BoardState;
  children: ReactNode;
}

export function BoardProvider({ initialState, children }: BoardProviderProps) {
  const [state, dispatch] = useReducer(boardReducer, initialState ?? createEmptyBoard());

  const value: BoardContextValue = {
    state,
    createTask: (columnId, input) => dispatch({ type: 'CREATE_TASK', columnId, input }),
    editTask: (taskId, patch) => dispatch({ type: 'UPDATE_TASK', taskId, patch }),
    deleteTask: (taskId) => dispatch({ type: 'DELETE_TASK', taskId }),
    replaceBoard: (newState) => dispatch({ type: 'REPLACE_BOARD', state: newState }),
    moveTask: (taskId, toColumnId, toIndex) =>
      dispatch({ type: 'MOVE_TASK', taskId, toColumnId, toIndex }),
    selectColumnTaskCount: (columnId) => opSelectColumnTaskCount(state, columnId),
    selectTasksForColumn: (columnId) => opSelectTasksForColumn(state, columnId),
    getTaskColumn: (taskId) => opGetTaskColumn(state, taskId),
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Returns board state, action creators, and selectors.
 * Must be called inside a <BoardProvider>; throws a clear error otherwise.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useBoard(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return ctx;
}
