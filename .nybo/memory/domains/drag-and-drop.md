# Domain: drag-and-drop

Reorder tasks within a column and move tasks between columns via dnd-kit.

## Conventions
- Use dnd-kit for all drag-and-drop; show a ghost preview and an insertion placeholder.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->
- Escape mid-drag and drops outside a valid target cancel the move (restore origin).
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->

## Patterns
- On drop, compute the new (columnId, index) and apply a single atomic state update.

## Key Files
- `src/dnd/`

## Gotchas
- A successful or cancelled drag must never duplicate or lose a task.
- Support both mouse and touch sensors.
