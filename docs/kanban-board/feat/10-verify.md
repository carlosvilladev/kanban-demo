# Verification Plan

## T1: Board types and pure operations

### Test Scenarios
- `createEmptyBoard` yields three columns in fixed order, all empty (TC-001).
- `createTask` appends to target column, +1 count, present in exactly one column; empty/whitespace title rejected (TC-002, TC-003).
- `updateTask` changes fields only; `deleteTask` removes everywhere; selectors + `assertBoardInvariants` correct (TC-004, TC-005, TC-006).

### Gate Criteria
[AUTO] Vitest unit tests pass for happy + edge + invariant; `tsc`/lint clean.

---

## T2: Board store (context + reducer)

### Test Scenarios
- Dispatch create/edit/delete via `useBoard`; consumer re-renders with new state/count (TC-007).
- Default empty board when no `initialState`; `useBoard` outside provider throws.

### Gate Criteria
[AUTO] RTL tests pass with a test consumer; state transitions verified.

---

## T3: Board and column rendering

### Test Scenarios
- Board renders exactly 3 columns in order with titles + counts from store (TC-008).
- Empty column renders styled empty region (not blank/broken).
- [HUMAN] Layout usable at 320px and desktop (TC-012).

### Gate Criteria
[AUTO] Structure/order/count tests pass. [HUMAN] Responsive check signed off.

---

## T4: Task card and CRUD UI

### Test Scenarios
- Create shows card immediately in target column; empty title blocked (TC-009, TC-003).
- Edit updates in place (TC-010); delete confirm removes / cancel keeps (TC-011).
- Post-op invariant: task in exactly one column (AC-014).
- [HUMAN] Visual polish + feedback (TC-013).

### Gate Criteria
[AUTO] CRUD RTL tests pass. [HUMAN] Polish/responsive sign-off.

---

## Failure Triage

| If TC fails | Check first | Root cause pattern |
|---|---|---|
| TC-002 / TC-005 / AC-014 | `operations.ts` create/delete | Membership written to wrong place or not removed → duplicate/lost task |
| TC-003 / TC-009 | title trim guard | Empty-title validation missing in op or form |
| TC-007 / TC-008 | `BoardContext` wiring | Component reading stale state / not subscribed to store |
| TC-006 / count wrong | selectors | Count derived from something other than `taskIds.length` |
| TC-011 | `ConfirmDialog` / delete handler | Confirm bypassed or cancel still deletes |

---

## End-to-End Verification

**Final acceptance test:**
1. Mount the app with a seeded `initialState` (fixture standing in for `persistence-seed`).
2. Board shows three columns To Do → In Progress → Done with correct counts (AC-001, AC-002, AC-003).
3. Add a task to "To Do" with a title → it appears at the bottom immediately; count increments (AC-010, FR-T5).
4. Attempt to add a task with a blank title → rejected (AC-011).
5. Edit a card's title/description → updates in place (AC-012).
6. Delete a card → confirm dialog → confirm removes it; counts update (AC-013).
7. Throughout, every task appears in exactly one column (AC-014); resize to 320px stays usable (AC-004).

**Gate Criteria:** All [AUTO] gates green and [HUMAN] responsive/polish sign-off complete; no task duplicated or lost across any CRUD sequence.
