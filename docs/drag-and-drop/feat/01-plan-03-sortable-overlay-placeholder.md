# T3 — Sortable cards, ghost overlay, insertion placeholder

Delivers the visible feedback: ghost (FR-D3), placeholder (FR-D4), smooth settle (FR-D5).

## Scope
- `src/dnd/useSortableTask.ts` (new) — wraps `useSortable({ id })`; returns `attributes`, `listeners`, `setNodeRef`, `transform`, `transition`, `isDragging`.
- `src/dnd/DragOverlayCard.tsx` (new) — presentational ghost rendered inside `BoardDndContext`'s `<DragOverlay>`; reuses kanban-board's `TaskCard` visuals with a lifted/elevated style.
- Integrate into kanban-board components (consumed there): wrap each column's list in `<SortableContext items={taskIds} strategy={verticalListSortingStrategy}>` and register each Column as a droppable (`useDroppable({ id: columnId })`) so empty columns accept drops.

## Changes
### Sortable item
- `TaskCard` (in kanban-board) calls `useSortableTask(task.id)`, spreads `attributes`+`listeners` on a ≥44 px drag affordance (NFR-3), applies `transform`/`transition`, and renders a faded placeholder style when `isDragging` (source slot collapses → the gap IS the insertion indicator).
### Overlay
- `DragOverlayCard` shows the active task at full opacity following the pointer (FR-D3).
- Configure `<DragOverlay>` `dropAnimation` (default ease, ~200 ms) for the smooth settle (FR-D5, NFR-5).
### Placeholder
- `verticalListSortingStrategy` animates siblings to open the gap at the projected index while dragging over a column (FR-D4).

## Design rationale
- Reuse: the overlay and sortable item reuse kanban-board's `TaskCard` presentational layer rather than duplicating card markup.
- The placeholder is emergent from sortable transforms — no separate "ghost slot" component needed, keeping the demo polished and the code small.

## Dependencies
- T1 (types), T2 (DndContext + overlay slot + `activeId`). kanban-board `TaskCard`/`Column` (blocking dep).

## Done when
- [ ] Dragging renders a `DragOverlay` ghost (TC-006).
- [ ] Dragging over a column shows an insertion placeholder/gap (TC-007).
- [ ] Drag handle/target ≥44 px; board usable at ~320 px (NFR-3).
- [ ] Drop animation visible; no layout jump on settle (FR-D5/NFR-5).
- [ ] `tsc`/lint/build clean.

## Interfaces produced
- `useSortableTask(id: string)` — hook
- `DragOverlayCard` — React component

## Standalone verifiable
Partial — needs T2's provider mounted; rendering/ghost assertions run under T2's context.
