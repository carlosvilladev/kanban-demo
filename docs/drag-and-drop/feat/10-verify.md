# Verify — Drag & Drop

## Per-task gates

### T1 — pure core
- Scenarios: reorder within column; move across columns; move to empty column; no-op (same index); off-target projection → null; **property test:** 1000 random moves preserve task count and single-column membership.
- Gate: all unit tests green `[AUTO]`; no in-place mutation `[AUTO]`; `tsc` clean `[AUTO]`.

### T2 — context + sensors
- Scenarios: valid DragEnd → exactly one `moveTask`; invalid/off-target DragEnd → zero dispatches; DragCancel → zero dispatches; sensor list contains Mouse + Touch.
- Gate: handler dispatch counts correct `[AUTO]`; both sensors registered `[AUTO]`; build clean `[AUTO]`.

### T3 — sortable / overlay / placeholder
- Scenarios: ghost renders on drag start; insertion gap appears over a column; drop animation plays; drag target ≥44 px; usable at 320 px.
- Gate: ghost + placeholder present `[AUTO]`; settle animation + touch-target size `[HUMAN]`.

### T4 — integration / E2E
- Scenarios: TC-008..013 + scripted no-dup/no-loss sequence.
- Gate: integration suite green `[AUTO]`; TC-013 logs <~100 ms `[AUTO/soft]`; mouse+touch manual drag `[HUMAN]`.

## Failure triage
| If TC fails | Check first | Root-cause pattern |
|-------------|-------------|--------------------|
| TC-001/002/003 | `applyMove` remove/insert ordering & clamp | index off-by-one; mutating input array; not deriving target array before insert |
| TC-004/005 | `projectDrop` over-id resolution | empty-column id not handled; same-column downward shift not adjusted; null not returned off-target |
| TC-006/007 | DragOverlay slot / SortableContext items | overlay not mounted; `items` not the column's taskIds; strategy missing |
| TC-008/009 | store `moveTask` ↔ `applyMove` wiring | action not delegating to applyMove; component reads stale state, not the store |
| TC-010/011 | onDragCancel / null-projection branch | dispatch fired on cancel; over:null not mapped to no-op |
| TC-012 | sensor list | only one sensor registered; touch activation constraint blocks the synthetic event |
| TC-013 | optimistic update path | extra re-render or sync persistence on the critical path |

## End-to-end verification (acceptance)
1. Seed board renders 3 columns with demo tasks (via kanban-board + persistence-seed).
2. Reorder a card within "To Do" → new order holds (AC-D01).
3. Drag a card "To Do" → "In Progress" → column + position update in one action; sticks (AC-D02).
4. During drag: ghost follows pointer (AC-D03) and an insertion placeholder shows (AC-D04).
5. Release → smooth settle, order updates immediately ≤100 ms (AC-D05, NFR-2).
6. Start a drag, press Escape → card returns to origin, state unchanged (AC-D06).
7. Start a drag, release outside any column → card returns to origin (AC-D06).
8. Across the whole session no task is duplicated or lost (AC-D07 / BR-D01).
9. Repeat steps 2–3 using touch (emulation) → works (AC-D08, NFR-3).
- **Final gate:** all `[AUTO]` gates green; `[HUMAN]` polish/touch checks signed off; FR-D7 invariant assertion green at both unit and integration layers.
