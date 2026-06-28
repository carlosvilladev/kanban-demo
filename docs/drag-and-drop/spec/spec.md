# Spec — Drag & Drop (SDD)

**Source:** [`requirement.md`](./requirement.md) — F-D1, AC-D01..D08, NFR-2/3/5.

## Intention
Let the demo user reorder a task within a column and move it across columns by
dragging, with a ghost preview, insertion placeholder, smooth settle, and mouse +
touch support — implemented entirely in `src/dnd/` over the `kanban-board` store.

## Use Cases
| UC | Flow | AC |
|----|------|----|
| UC-1 | Reorder a card inside one column | AC-D01, AC-D05 |
| UC-2 | Move a card into a different column | AC-D02, AC-D05 |
| UC-3 | Cancel a drag (Escape / off-target) | AC-D06, AC-D07 |

## Technical Requirements
- **Library:** dnd-kit (`@dnd-kit/core` + `@dnd-kit/sortable`) for ALL drag-and-drop.
- **Sensors:** `MouseSensor` (activation distance 8 px) + `TouchSensor` (delay 200 ms, tolerance 8 px) so taps/scroll on mobile don't hijack a drag (FR-D8, NFR-3).
- **Collision:** `closestCorners`; every Column is a droppable so empty columns accept drops.
- **Ghost:** `<DragOverlay>` renders a `TaskCard` clone (FR-D3); source slot collapses to a faded placeholder while `isDragging`.
- **Placeholder:** `verticalListSortingStrategy` animates siblings to open the insertion gap (FR-D4).
- **Atomicity (FR-D7):** drop is projected to `{toColumnId, toIndex}` then applied via ONE pure transform `applyMove()` (remove-from-source → insert-into-target → set `columnId`). Store's `moveTask` action delegates to it. Optimistic update ≤100 ms (NFR-2).
- **Cancel (FR-D6):** `onDragCancel` / null projection → no dispatch; state untouched.
- Keyboard-initiated DnD is out of scope (req §8); Escape-to-cancel still works via dnd-kit core.

## Test Cases
| TC | Given / When / Then (summary) | Tag | AC/FR |
|----|------------------------------|-----|-------|
| TC-001 | applyMove reorders within a column | [UNIT] | AC-D01 |
| TC-002 | applyMove moves across columns, sets columnId, in one transition | [UNIT] | AC-D02 |
| TC-003 | Property: over 1000 random moves, task count constant & each task in exactly one column | [UNIT] | AC-D07 |
| TC-004 | projectDrop maps over-task and over-empty-column to correct (col,index) | [UNIT] | AC-D02/D04 |
| TC-005 | projectDrop returns null for over-nothing (off-target) | [UNIT] | AC-D06 |
| TC-006 | Dragging renders a DragOverlay ghost | [INTEGRATION] | AC-D03 |
| TC-007 | Dragging over a column reveals an insertion placeholder/gap | [INTEGRATION] | AC-D04 |
| TC-008 | Synthetic DragEnd within column reorders & store updates immediately | [INTEGRATION] | AC-D01/D05 |
| TC-009 | Synthetic DragEnd over another column moves card; new column sticks | [INTEGRATION] | AC-D02 |
| TC-010 | Escape mid-drag → onDragCancel → state unchanged, card at origin | [INTEGRATION] | AC-D06/D07 |
| TC-011 | Drop off-target → no dispatch → origin restored | [INTEGRATION] | AC-D06/D07 |
| TC-012 | Both MouseSensor & TouchSensor registered; touch drag dispatches a move | [INTEGRATION] | AC-D08 |
| TC-013 | Drop/reorder settles within ~100 ms on demo board | [STATISTICAL] | NFR-2 |

## Architecture
- **ADR-DND-1:** dnd-kit chosen (accessible, tree-shakeable, first-class DragOverlay + sortable, touch sensors). Alternative `react-dnd` rejected (heavier, weaker touch/animation story for a demo).
- **ADR-DND-2:** Split `MouseSensor`+`TouchSensor` over a single `PointerSensor` to tune touch activation (delay/tolerance) independently — satisfies the "both mouse and touch sensors" convention.
- **Data flow:** dnd-kit event → `projectDrop(board, active, over)` → `{toColumnId,toIndex}` | null → `store.moveTask()` → `applyMove(board, move)` → new normalized state → persistence auto-save.

## Assumptions
1. `kanban-board` exposes a normalized store and a single `moveTask(taskId,toColumnId,toIndex)` action; this feature supplies the pure `applyMove` it delegates to, so FR-D7 is unit-verifiable here in isolation.
2. Sensor split (Mouse+Touch) and `closestCorners` are the chosen defaults (see ADRs).
3. dnd-kit pointer geometry can't be simulated in jsdom; interaction TCs feed crafted `DragStart/Over/End/Cancel` events to the handlers rather than emulating real pointer drags. Real-pointer fidelity is left to manual demo QA.
4. NFR-2 (~100 ms) verified by a lightweight timing assertion + manual demo check, not a strict CI gate.
