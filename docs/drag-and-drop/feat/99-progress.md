# Progress — drag-and-drop

## Tasks

- [x] T1 — DnD pure core (types, projectDrop, applyMove)
  - Created `src/dnd/types.ts` (DropTarget, Move; re-exports canonical types)
  - Added `moveTask()` to `src/board/operations.ts` — single canonical algorithm
  - Added `MOVE_TASK` to `BoardContext.tsx` reducer; exposed `moveTask()` on `useBoard()`
  - Created `src/dnd/applyMove.ts` — thin delegation to `operations.moveTask`
  - Created `src/dnd/projectDrop.ts` — pure projection
  - 24 unit tests (TC-001, TC-002, TC-003) — all green

- [x] T2 — BoardDndContext + sensors + handlers
  - Created `src/dnd/sensors.ts` — `useBoardSensors()` (MouseSensor 8px + TouchSensor 200ms/8px)
  - Created `src/dnd/BoardDndContext.tsx` — DndContext provider, `useDragHandlers` exported
  - 7 unit tests (TC-012, handler-level) — all green

- [x] T3 — Sortable cards, ghost overlay, insertion placeholder
  - Created `src/dnd/useSortableTask.ts`
  - Created `src/dnd/SortableTaskCard.tsx` (wraps TaskCard; keeps TaskCard presentational)
  - Created `src/dnd/DragOverlayCard.tsx` (ghost overlay card)
  - Updated `src/components/Column.tsx` — useDroppable + SortableContext + SortableTaskCard
  - Updated `src/components/Board.tsx` — wrapped columns in BoardDndContext
  - All 159 prior tests still pass (no regression)

- [x] T4 — Integration tests + wiring
  - Created `src/dnd/dnd.integration.test.tsx` — 17 tests (TC-006..013, no-dup/no-loss)
  - Created `src/dnd/perf.test.ts` — 2 tests (TC-013 statistical, sub-ms on demo board)
  - Final gate: 210/210 tests, tsc clean, lint 0 warnings, build green

## Final state

Tests: 210 passed (159 prior + 51 new DnD)
Typecheck: PASS
Lint: 0 warnings
Build: PASS (207 kB JS gzip 66 kB)
