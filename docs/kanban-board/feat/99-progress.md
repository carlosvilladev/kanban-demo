# kanban-board — Progress

## Tasks

- [x] **T1** Board types and pure operations
  - Canonical `src/types/board.ts` written (ColumnId union, Task without columnId, Column, BoardState).
  - `src/board/operations.ts`: createEmptyBoard, createTask, updateTask, deleteTask, selectors, assertBoardInvariants.
  - Reconciled persistence-seed: removed columnId from Task, updated boardStorage.ts validator, fixed 3 test files.
  - 40 new unit tests; all 52 existing tests still pass.

- [x] **T2** Board store (context + reducer)
  - `src/board/BoardContext.tsx`: BoardProvider (useReducer), useBoard hook, all actions + selectors.
  - 9 new RTL tests for provider, actions, selector bindings, out-of-provider error.

- [x] **T3** Board and column rendering
  - `src/components/Board.tsx`: renders columns from columnOrder.
  - `src/components/Column.tsx` (T3 version): header, count badge, task list, Add-task slot.
  - 8 new RTL tests for column order, titles, counts, empty-state.

- [x] **T4** Task card and CRUD UI
  - `src/components/TaskCard.tsx`: title/description + Edit/Delete affordances.
  - `src/components/TaskForm.tsx`: create/edit form, empty-title guard, Esc to cancel.
  - `src/components/ConfirmDialog.tsx`: in-app confirmation (not window.confirm).
  - Column.tsx upgraded to use TaskCard + TaskForm.
  - 12 new RTL tests: create/edit/delete flows, invariant check.

- [x] **App wiring** — `src/App.tsx` wires loadInitialBoard() + BoardProvider + useAutoPersist + Board.

## Evidence

- Tests: 121 passed (8 test files)
- Lint: clean
- tsc --noEmit: clean
- npm run build: success (153 kB bundle, 49 kB gzip)
