# T2 — BoardDndContext + sensors + handlers

Wires dnd-kit to the pure core and the store. Owns sensors, collision, cancel.

## Scope
- `src/dnd/sensors.ts` (new) — `useBoardSensors()`: `MouseSensor` (activation distance 8 px) + `TouchSensor` (delay 200 ms, tolerance 8 px), composed via `useSensors`.
- `src/dnd/BoardDndContext.tsx` (new) — `<DndContext>` provider: sensors, `collisionDetection={closestCorners}`, the four handlers, and a `<DragOverlay>` slot (overlay content delivered in T3).
- `src/dnd/BoardDndContext.test.tsx` (new) — handler-level tests via synthetic events.

## Changes
### Provider + handlers
- `onDragStart(e)` — record `activeId` in local state so the overlay (T3) can render the ghost; collapse the source slot.
- `onDragOver(e)` — optional: track `overId` to drive the live placeholder (T3 reads it). No state dispatch here.
- `onDragEnd(e)` — `const target = projectDrop(board, e.active.id, e.over?.id ?? null)`; if `target` is null ⇒ do nothing (cancel); else `store.moveTask(e.active.id, target.toColumnId, target.toIndex)` (ONE dispatch ⇒ one atomic `applyMove`). Clear `activeId`.
- `onDragCancel()` — clear `activeId`; no dispatch (FR-D6). Escape triggers this automatically via dnd-kit core.

### Store seam
- Read board state from the kanban-board store (single source of truth — never localStorage). Call its `moveTask` action, which delegates to `applyMove` (T1).

## Design rationale
- OCP/seam: the provider depends on the store's `moveTask` action and the pure `projectDrop`; geometry and persistence stay outside this file.
- Sensor split keeps mouse responsive (small distance) while making touch deliberate (delay+tolerance) so vertical scroll on a ~320 px screen isn't captured (FR-D8, NFR-3).

## Dependencies
- T1 (`projectDrop`). kanban-board store `moveTask` action (blocking dep).

## Done when
- [ ] `onDragEnd` dispatches exactly one `moveTask` for a valid drop and zero for an invalid/cancelled one (asserted via mocked store + synthetic `DragEndEvent`/`DragCancelEvent`).
- [ ] Both `MouseSensor` and `TouchSensor` present in the configured sensor list (TC-012).
- [ ] `tsc`/lint/build clean.

## Interfaces produced
- `BoardDndContext` — React component (children + overlay slot)
- `useBoardSensors(): SensorDescriptor[]` — function

## Standalone verifiable
Yes — handlers tested by feeding crafted dnd-kit events with a mocked store.
