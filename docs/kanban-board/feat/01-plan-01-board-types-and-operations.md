# T1: Board types and pure operations

## Scope

- `src/types/board.ts` - New. The shared `ColumnId`, `Task`, `Column`, `BoardState` types (authoritative; imported by all other specs).
- `src/board/operations.ts` - New. Pure board mutations + selectors; no React, no localStorage.
- `src/board/operations.test.ts` - New. Vitest unit tests for ops + selectors + invariant.

## Changes

### Types (`src/types/board.ts`)

- `ColumnId = 'todo' | 'in-progress' | 'done'`.
- `Task { id: string; title: string; description: string }` — no `columnId`/`order` (membership lives in `taskIds`).
- `Column { id: ColumnId; title: string; taskIds: string[] }` — order = array index.
- `BoardState { tasks: Record<string,Task>; columns: Record<ColumnId,Column>; columnOrder: ColumnId[] }`.

### Pure operations + selectors (`src/board/operations.ts`)

- `createEmptyBoard(): BoardState` — three columns (To Do / In Progress / Done) in fixed `columnOrder`, all `taskIds` empty.
- `createTask(state, columnId, { title, description? }): BoardState` — trims title; if empty, return state unchanged (and export a guard the UI uses to block submit). Generates id (`crypto.randomUUID()` with fallback), appends id to target column's `taskIds` (bottom), adds to `tasks`. Immutable update.
- `updateTask(state, taskId, { title?, description? }): BoardState` — patches fields only; never touches membership/position; ignores unknown id.
- `deleteTask(state, taskId): BoardState` — removes from `tasks` and from its column's `taskIds`.
- Selectors: `selectColumnTaskCount(state, columnId)`, `selectTasksForColumn(state, columnId): Task[]` (ordered), `getTaskColumn(state, taskId): ColumnId | undefined`.
- `assertBoardInvariants(state): void` — dev-only: every task id appears in exactly one column's `taskIds`; throws otherwise.

### Design Rationale (SRP)

Pure, framework-free core isolates board semantics from React and storage, so the store (T2), drag-and-drop, and persistence all reuse one tested module and the "exactly one column / never lose a task" invariant is enforced in one place.

## Dependencies

None — foundational task.

## Interfaces Produced

- `ColumnId`, `Task`, `Column`, `BoardState` (type)
- `createEmptyBoard(): BoardState` (function)
- `createTask(state: BoardState, columnId: ColumnId, input: { title: string; description?: string }): BoardState` (function)
- `updateTask(state: BoardState, taskId: string, patch: { title?: string; description?: string }): BoardState` (function)
- `deleteTask(state: BoardState, taskId: string): BoardState` (function)
- `selectColumnTaskCount(state: BoardState, columnId: ColumnId): number` (function)
- `selectTasksForColumn(state: BoardState, columnId: ColumnId): Task[]` (function)
- `getTaskColumn(state: BoardState, taskId: string): ColumnId | undefined` (function)
- `assertBoardInvariants(state: BoardState): void` (function)

## Standalone Verifiable

Yes — fully covered by Vitest unit tests with in-memory fixtures.

## Done When

- [ ] Types compile and are exported from `src/types/board.ts`.
- [ ] All operations are pure (no mutation of input; return new state).
- [ ] Unit tests cover create (incl. empty-title rejection), update, delete, selectors, and the invariant (TC-001..TC-006).
- [ ] `npm run lint` and `tsc` clean; `npm run test` green.
