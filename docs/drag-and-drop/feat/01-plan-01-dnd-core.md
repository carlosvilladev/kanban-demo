# T1 — DnD pure core (types, projectDrop, applyMove)

The heart of FR-D7. No React. Fully unit-testable in isolation.

## Scope
- `src/dnd/types.ts` (new) — DnD-local types: `DropTarget { toColumnId, toIndex }`, `Move { taskId, toColumnId, toIndex }`. Re-exports `Board`/`Column`/`Task` types from the kanban-board model (does not redefine them).
- `src/dnd/projectDrop.ts` (new) — pure projection from dnd-kit `active`/`over` ids to a `DropTarget | null`.
- `src/dnd/applyMove.ts` (new) — pure atomic transform `applyMove(board, move): Board`.
- `src/dnd/projectDrop.test.ts`, `src/dnd/applyMove.test.ts` (new) — Vitest.

## Changes
### Pure logic
- `projectDrop(board, activeId, overId)`:
  - Resolve `activeId` → source `{columnId, index}`.
  - If `overId` is a column id → target column, index = end of that column (or 0 if empty).
  - If `overId` is a task id → target = that task's column, index = that task's position (insert-before semantics, adjusted when moving down within the same column).
  - If `overId` is null / not a known column or task → return `null` (off-target ⇒ cancel, FR-D6).
- `applyMove(board, { taskId, toColumnId, toIndex })`:
  1. Remove `taskId` from its current column's `taskIds` (find source by `task.columnId`).
  2. Clamp `toIndex` into `[0, targetTaskIds.length]`; splice-insert `taskId`.
  3. Set moved `task.columnId = toColumnId`.
  4. Return a NEW board (immutable; no in-place mutation) in ONE return — remove and insert happen on the same derived arrays so the id can never exist twice or vanish.
  - No-op fast path: same column AND resulting index === current index ⇒ return input board unchanged.

## Design rationale
- SRP: projection (geometry → intent) is separated from application (intent → state). Pure functions make the FR-D7 invariant directly assertable without a DOM.
- Single atomic transform satisfies the domain pattern "compute new (columnId,index) and apply a single atomic state update."

## Dependencies
- None (first task). Uses kanban-board's `Board`/`Task` TYPES only; if those types
  do not yet exist, declare a minimal local interface and have kanban-board adopt it.

## Done when
- [ ] `applyMove` and `projectDrop` exported and typed.
- [ ] Unit tests green incl. the property test (TC-003): for N random moves, total task count is invariant and every task id appears in exactly one column's `taskIds`.
- [ ] `tsc` clean; no in-place mutation of the input board (verified by reference-inequality assertions).

## Interfaces produced
- `applyMove(board: Board, move: Move): Board` — function
- `projectDrop(board: Board, activeId: string, overId: string | null): DropTarget | null` — function
- `Move`, `DropTarget` — types

## Standalone verifiable
Yes — pure functions, no external coupling beyond shared types.
