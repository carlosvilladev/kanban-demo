# Domain: drag-and-drop

Reorder tasks within a column and move tasks between columns via dnd-kit.

## Conventions
- Use dnd-kit for all drag-and-drop; show a ghost preview and an insertion placeholder.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->
- Escape mid-drag and drops outside a valid target cancel the move (restore origin).
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->
- [DND-01] Wrap dnd-kit sortable behaviour in a dedicated `<Sortable*>` component rather than adding `useSortable` directly to a presentational component; the presentational component stays DnD-free and its tests run without a `DndContext` ancestor.
<!-- added: 2026-06-28 | feature: drag-and-drop | confidence: high | verified: 2026-06-28 -->
- [DND-02] Configure `MouseSensor` with `distance: 8` and `TouchSensor` with `delay: 200, tolerance: 8`; these thresholds let taps and vertical scroll pass through on mobile without triggering a drag.
<!-- added: 2026-06-28 | feature: drag-and-drop | confidence: high | verified: 2026-06-28 -->

## Patterns
- On drop, compute the new (columnId, index) and apply a single atomic state update.
- `operations.moveTask(state, { taskId, toColumnId, toIndex })` is the ONE move algorithm. `src/dnd/applyMove.ts` is a thin delegation wrapper to it; the `MOVE_TASK` reducer case in `BoardContext.tsx` is a second entry point to the same function. Neither contains its own move logic.
- `projectDrop(board, activeId, overId)` is the pure drop projection. It returns `null` when `overId` is `null` (off-target), an unknown id, or when `activeId` is missing from the task map. A null result means no dispatch is issued and the card returns to its origin — this is the concrete mechanism behind cancel semantics.

## Key Files
- `src/dnd/`

## Gotchas
- A successful or cancelled drag must never duplicate or lose a task.
- Support both mouse and touch sensors.
- dnd-kit's `useSortable` injects `role="button"` into its attributes by default. `SortableTaskCard` explicitly excludes it (`const { role: _role, ...rest } = attributes`) because keyboard DnD is out of scope and the role causes RTL to interpret the card wrapper as a button, breaking accessible-name queries in card tests. If keyboard DnD is added later, restore the role and update test wrappers to mount inside `DndContext`.
