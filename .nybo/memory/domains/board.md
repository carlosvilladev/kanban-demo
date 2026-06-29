# Domain: board

Board rendering, the three fixed columns, and task create/edit/delete.

## Conventions
- Columns are fixed (To Do / In Progress / Done); no column CRUD in v1.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->
- Components read board state from a single source of truth, never from localStorage directly.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->

## Patterns
- Normalized state shape (tasks keyed by id; columns hold ordered taskIds).
- Optimistic local updates — UI changes immediately, then state is persisted.
- Critical state invariants are protected at four layers: (1) TypeScript type shape (omit the field that would enable violation), (2) pure ops — `assertBoardInvariants()` throws in dev/test, (3) dedicated unit tests for the invariant function, (4) persistence read — `isValidBoardState()` rejects orphaned or duplicated task references on load.
<!-- added: 2026-06-29 | feature: kanban-board | confidence: high | verified: 2026-06-29 -->

## Key Files
- `src/components/Board.tsx`
- `src/components/Column.tsx`
- `src/components/TaskCard.tsx`
- `src/board/BoardContext.tsx`
- `src/board/operations.ts`
- `src/types/board.ts`

## Gotchas
- Each task must appear in exactly one column's taskIds — never zero, never two.
- Task carries no `columnId` or `order` field — column membership derives exclusively from `Column.taskIds`. Never add a redundant `columnId` to Task; the dual-write hazard it introduces is exactly what this normalized shape eliminates.
<!-- added: 2026-06-29 | feature: kanban-board | confidence: high | verified: 2026-06-29 -->
