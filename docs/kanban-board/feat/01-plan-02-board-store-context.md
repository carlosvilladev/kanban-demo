# T2: Board store (context + reducer)

## Scope

- `src/board/BoardContext.tsx` - New. `BoardProvider` + `useBoard` hook; single source of truth.
- `src/board/BoardContext.test.tsx` - New. RTL/Vitest tests for dispatch → state → re-render.

## Changes

### Reducer + provider (`src/board/BoardContext.tsx`)

- `boardReducer(state, action)` with actions `CREATE_TASK { columnId, input }`, `UPDATE_TASK { taskId, patch }`, `DELETE_TASK { taskId }`, each delegating to the matching T1 pure op. (Leave room for a future `MOVE_TASK` added by the drag-and-drop spec.)
- `BoardProvider({ initialState?, children })` — `useReducer(boardReducer, initialState ?? createEmptyBoard())`. `initialState` is the seam the `persistence-seed` feature uses to inject seeded/restored state.
- `useBoard()` returns `{ state, createTask(columnId, input), editTask(taskId, patch), deleteTask(taskId), selectColumnTaskCount, selectTasksForColumn, getTaskColumn }` — action creators wrap `dispatch`; selectors are bound to current `state`.
- Throw a clear error if `useBoard` is used outside a `BoardProvider`.

### Design Rationale (Single source of truth / DIP)

All components depend on `useBoard`, never on localStorage or the raw reducer. This satisfies BR-004 and gives persistence/drag-and-drop one well-defined integration point instead of scattered state access.

## Dependencies

Requires T1 — the reducer and action creators call the pure operations and use the shared types.

## Interfaces Produced

- `BoardProvider` (component) — `({ initialState?: BoardState; children: ReactNode }) => JSX.Element`
- `useBoard` (function) — `(): { state: BoardState; createTask: (columnId: ColumnId, input: { title: string; description?: string }) => void; editTask: (taskId: string, patch: { title?: string; description?: string }) => void; deleteTask: (taskId: string) => void; selectColumnTaskCount: (columnId: ColumnId) => number; selectTasksForColumn: (columnId: ColumnId) => Task[]; getTaskColumn: (taskId: string) => ColumnId | undefined }`

## Interfaces Consumed

- From T1: `createEmptyBoard`, `createTask`, `updateTask`, `deleteTask`, selectors, `BoardState`, `ColumnId`, `Task`.

## Standalone Verifiable

Yes — a test consumer component drives the hook and asserts re-render/state.

## Done When

- [ ] `BoardProvider` + `useBoard` exported; out-of-provider use throws.
- [ ] Dispatching create/edit/delete updates state and re-renders consumers (TC-007).
- [ ] `useBoard` defaults to an empty board when no `initialState` prop is given.
- [ ] `tsc`/lint clean; tests green.
