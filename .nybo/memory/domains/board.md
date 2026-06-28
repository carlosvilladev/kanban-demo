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

## Key Files
- `src/components/Board.tsx`
- `src/components/Column.tsx`
- `src/components/TaskCard.tsx`

## Gotchas
- Each task must appear in exactly one column's taskIds — never zero, never two.
