# T4 — App integration + interaction/E2E tests

Mounts the DnD layer in the real board tree and proves the end-to-end behaviors.

## Scope
- App wiring (in kanban-board's board tree): wrap `<Board>` in `<BoardDndContext>` so all columns/cards share one DndContext. (Edit to the board entry component — owned by kanban-board, contributed here.)
- `src/dnd/dnd.integration.test.tsx` (new) — interaction tests over a seeded board using synthetic dnd-kit events (per spec Assumption 3).
- `src/dnd/perf.test.ts` (new, optional) — timing assertion for NFR-2.

## Changes
### Integration tests (TC-008..013)
- TC-008: synthetic DragEnd within a column → store order updates immediately; UI reflects it.
- TC-009: synthetic DragEnd over a different column → card moves; `columnId` and target column `taskIds` updated; new column sticks after re-render.
- TC-010: `DragCancelEvent` (Escape) → no store change; card back at origin.
- TC-011: DragEnd with `over: null` (off-target) → no store change; origin restored.
- TC-012: assert both Mouse and Touch sensors active; simulate a touch-originated move dispatches a `moveTask`.
- TC-013: measure elapsed time from drop dispatch to committed state < ~100 ms on the demo-sized seed (NFR-2) — soft assertion + logged number.
### No-dup / no-loss end-to-end (TC-003 reinforced at integration level)
- After a scripted sequence (reorder → cross-column → cancel → cross-column back), assert: total task count equals the seed count, and every task id appears in exactly one column's `taskIds` (FR-D7 / BR-D01).

## Design rationale
- The pure core (T1) carries the exhaustive invariant proof; T4 confirms the wiring delivers it through the real component tree and the store, closing the loop on FR-D7 at both layers.

## Dependencies
- T2 (provider/handlers), T3 (sortable cards/overlay). Seeded board from
  kanban-board + persistence-seed (for a populated initial state in the harness).

## Done when
- [ ] All integration TCs (008–012) green; TC-013 logs a sub-100 ms number.
- [ ] No-dup/no-loss sequence assertion green.
- [ ] `npm run test`, `tsc`, `npm run lint`, `npm run build` all clean.
- [ ] Manual demo pass: drag with mouse and with touch (devtools touch emulation).

## Interfaces produced
- None (integration/wiring + tests only).

## Standalone verifiable
Yes — this task's tests are the end-to-end gate.
