# Evidence Report — Drag & Drop (Phase 3 Verify)

**Date:** 2026-06-28  
**Reviewer:** Guardian (Haiku 4.5)  
**Spec:** `docs/drag-and-drop/spec/spec.md` + `requirement.md`

---

## Gate Results

All canonical checks pass. No regressions to prior specs (Specs 1–3).

### Build & Type
- **typecheck** (`npm run typecheck`): PASS — zero errors
- **lint** (`npm run lint`): PASS — zero errors, zero warnings
- **build** (`npm run build`): PASS — 207 KB JS, 66 KB gzip

### Tests
- **Test suite** (`npm test`): 210 passed, 17 files, 1.15s total
  - Prior specs (1–3): 159 tests — all still passing (no regression)
  - Spec 4 (drag-and-drop): 51 new tests — all passing
    - Unit: applyMove (13), projectDrop (11), perf (2)
    - Integration: BoardDndContext (7), dnd.integration (18)

### Coverage
- **Overall:** 91.32% statements, 89.37% branch, 90.78% functions
- **DnD module:** 100% statement, 84.37% branch, 100% functions

---

## AC/TC Traceability

All 8 acceptance criteria are covered by automatable tests. No manual-only ACs.

| AC | Test Case(s) | Status |
|----|--------------|--------|
| AC-D01 (reorder within column) | TC-001 | ✅ Covered |
| AC-D02 (move across columns) | TC-002 | ✅ Covered |
| AC-D03 (ghost preview visible) | TC-006 | ✅ Covered |
| AC-D04 (insertion placeholder) | TC-007 | ✅ Covered |
| AC-D05 (smooth settle ≤100 ms) | TC-013 | ✅ Covered |
| AC-D06 (cancel/off-target) | TC-010, TC-011 | ✅ Covered |
| AC-D07 (no dup/loss) | TC-003 | ✅ Covered |
| AC-D08 (mouse + touch) | TC-012 | ✅ Covered |

Additional tests: TC-004 (projectDrop valid targets), TC-005 (projectDrop null projection), TC-008/TC-009 (store integration), TC-013 (perf).

---

## Invariant Audit

### Invariant 1: No task duplicated or lost on SUCCESSFUL move

**Test strength:** STRONG

- TC-003 property test: 1000 random moves, `assertBoardInvariants` called **after every move** (src/dnd/applyMove.test.ts:173)
- Implementation: `moveTask` in operations.ts (line 158) removes from source, inserts into target atomically
- Both within-column (TC-001) and cross-column (TC-002) covered by unit tests
- Integration tests (TC-008, TC-009) verify store dispatch + invariants hold

**Verdict:** Property test with 1000 iterations + invariant checks is genuine and comprehensive.

---

### Invariant 2: No task duplicated or lost on CANCELLED drag

**Test strength:** STRONG

- TC-010: `handleDragCancel` → state reference unchanged (no mutation)
- TC-011: DragEnd with `over=null` → state reference unchanged, no dispatch
- Implementation: `projectDrop` returns null for cancel; `handleDragEnd` only dispatches if target is non-null

**Verdict:** Tests prove no action dispatched. State equality confirms zero mutation.

---

### Invariant 3: Single atomic update

**Test strength:** STRONG

- `moveTask` in BoardContext (line 108–109) dispatches exactly one MOVE_TASK action
- MOVE_TASK reducer case (lines 59–64) delegates to `opMoveTask`, returns one state object
- TC-008, TC-009 verify single dispatch per drop

**Verdict:** One dispatch path, one state transition, no fork.

---

### Invariant 4: One move algorithm (BOARD-03 compliance)

**Test strength:** STRONG

- `applyMove` delegates to `operations.moveTask`
- MOVE_TASK reducer also delegates to same `operations.moveTask`
- Single function definition, both paths converge
- No divergent move implementation

**Verdict:** Verified in code; both DnD and store use identical algorithm.

---

### Invariant 5: Mouse AND touch sensors both configured

**Test strength:** STRONG

- TC-012 unit test verifies both `MouseSensor` and `TouchSensor` in sensor list
- MOUSE_ACTIVATION: distance 8 px
- TOUCH_ACTIVATION: delay 200 ms, tolerance 8 px
- Both registered in `useBoardSensors` (sensors.ts:16–21)

**Verdict:** Both sensors wired and tuned per spec.

---

### Edge Cases

All tested:
- Move to same position → no-op fast path (applyMove.test.ts:55–62)
- Move to empty column (projectDrop.test.ts:28–35)
- Move to end of column (projectDrop.test.ts:37–45)
- Out-of-bounds index clamped (applyMove.test.ts:76–84)
- Unknown/null overId → null projection (projectDrop.test.ts:103–127)
- Within-column downward move adjustment (projectDrop.test.ts:58–67)

---

## Performance (NFR-2)

TC-013 results:
- 1000 applyMove calls: 0.64 ms total (**0.0006 ms per op**)
- Single move: 0.0077 ms
- All 1000 under 100 ms threshold ✅

Dispatch + settle in integration: 0.06 ms (jsdom is effectively instantaneous)

---

## Summary

| Category | Result |
|----------|--------|
| **Build** | ✅ PASS |
| **Lint** | ✅ PASS |
| **Tests** | ✅ PASS (210 total, 51 new DnD) |
| **Coverage** | ✅ 91.32% overall, 100% DnD stmts |
| **No regression** | ✅ Prior 159 tests still pass |
| **AC coverage** | ✅ All 8 ACs covered by tests |
| **Invariant 1** (no dup/loss on success) | ✅ STRONG |
| **Invariant 2** (no dup/loss on cancel) | ✅ STRONG |
| **Invariant 3** (atomic update) | ✅ STRONG |
| **Invariant 4** (one algorithm) | ✅ STRONG |
| **Invariant 5** (mouse + touch) | ✅ STRONG |

---

## Verdict

**PASS** ✅

All acceptance criteria covered. Critical invariants (no-dup/no-loss, atomicity, single algorithm) guarded by property tests and integration tests. Prior specs show no regression. Build, lint, and coverage all green.

**Ready for curate → ship workflow.**

---

## Findings

**None.** All load-bearing paths covered by meaningful tests.
