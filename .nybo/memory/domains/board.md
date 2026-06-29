# Domain: board

Board rendering, the three fixed columns, and task create/edit/delete.

## Conventions
- Columns are fixed (To Do / In Progress / Done); no column CRUD in v1.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->
- Components read board state from a single source of truth, never from localStorage directly.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->
- [BOARD-03] All board state mutations are pure functions in `src/board/operations.ts`; `boardReducer` in `BoardContext.tsx` delegates to them and contains no logic directly. Selectors live here too.
<!-- added: 2026-06-28 | feature: kanban-board | confidence: high | verified: 2026-06-28 -->
- [BOARD-04] `assertBoardInvariants(state)` (exported from `src/board/operations.ts`) is the dev-only guard for BR-011; call it in unit tests after every mutation to confirm the "exactly one column" invariant holds. It must not be called on hot paths in production builds.
<!-- added: 2026-06-28 | feature: kanban-board | confidence: high | verified: 2026-06-28 -->
- [BOARD-05] Destructive actions (delete) use `<ConfirmDialog>` — never `window.confirm` — for visual polish. `ConfirmDialog` supports Escape-to-cancel and auto-focuses the confirm button.
<!-- added: 2026-06-28 | feature: kanban-board | confidence: high | verified: 2026-06-28 -->

## Patterns
- Normalized state shape (tasks keyed by id; columns hold ordered taskIds).
- Optimistic local updates — UI changes immediately, then state is persisted.
- Store seams: `BoardProvider({ initialState? })` is the plug-in point for `persistence-seed` to inject restored/seeded state. The `MOVE_TASK` action shape (`{ type: 'MOVE_TASK'; taskId: string; toColumnId: ColumnId; toIndex: number }`) is reserved in the `BoardAction` union for `drag-and-drop` to extend `boardReducer`.

## Key Files
- `src/types/board.ts`
- `src/board/operations.ts`
- `src/board/BoardContext.tsx`
- `src/components/Board.tsx`
- `src/components/Column.tsx`
- `src/components/TaskCard.tsx`
- `src/components/TaskForm.tsx`
- `src/components/ConfirmDialog.tsx`

## Gotchas
- Each task must appear in exactly one column's taskIds — never zero, never two.
