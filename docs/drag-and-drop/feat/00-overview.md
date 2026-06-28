# Feature Plan — Drag & Drop (overview)

**Spec:** [`../spec/spec.md`](../spec/spec.md) · **Status:** draft · **Mode:** compact

## Problem & solution
- The demo's headline interaction is dragging task cards within and across three
  fixed columns. It must feel instant, show clear feedback, and — critically —
  never duplicate or lose a card.
- Solution: a self-contained `src/dnd/` layer over dnd-kit. A pure core
  (`projectDrop` + `applyMove`) computes a single atomic move; a React layer
  (DndContext, sensors, sortable cards, DragOverlay) renders ghost + placeholder
  and dispatches that one move to the `kanban-board` store.

## Architecture
```mermaid
flowchart TD
  subgraph dnd[src/dnd/ — this feature]
    ctx[BoardDndContext\nsensors + closestCorners + DragOverlay]
    proj[projectDrop  (pure)]
    move[applyMove  (pure, atomic)]
    hook[useSortableTask + DragOverlayCard]
  end
  subgraph board[kanban-board — dependency]
    store[normalized store\nmoveTask action]
    cmp[Board / Column / TaskCard]
  end
  ctx -->|active,over| proj --> |toColumnId,toIndex| store
  store --> move --> store
  ctx --> hook --> cmp
  store -->|state change| persist[(persistence-seed\nauto-save)]
```

## Data model
No new entities. Operates on `kanban-board`'s normalized shape:
`tasks` keyed by id (`{id,title,description,columnId,order}`) and `columns`
holding ordered `taskIds`. A move mutates the two affected `taskIds` arrays and
one task's `columnId` in a single transition.

## Task index
| # | Task | Layer | Deps | Standalone verifiable |
|---|------|-------|------|-----------------------|
| T1 | DnD pure core: types, `projectDrop`, `applyMove` (+ FR-D7 property tests) | data/services | — | yes |
| T2 | `BoardDndContext` + sensors (mouse+touch) + collision + drag handlers/cancel | orchestration | T1 | yes (synthetic events) |
| T3 | Sortable cards: `useSortableTask`, `DragOverlayCard` ghost, column droppable + placeholder | UI | T1, T2 | partial (needs T2) |
| T4 | App integration + interaction/E2E tests (reorder, cross-column, cancel, no-dup/loss, sensors) | end-to-end | T2, T3 | yes |

## Dependency graph
```
T1 ──▶ T2 ──▶ T3 ──▶ T4
        └───────────▶ T4
```

## Cross-feature dependencies
- **kanban-board (blocking):** Board/Column/Task types, normalized store with a
  `moveTask` action (delegates to this feature's `applyMove`), and the
  Board/Column/TaskCard components the DnD layer wraps.
- **persistence-seed (soft):** auto-persists whenever a move changes store state.
- **demo-auth (soft):** the board only mounts for an authenticated session.
