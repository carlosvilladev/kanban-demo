# Progress Tracker

**Status:** Not Started

**Current Task:** None — spec drafted, awaiting review then implementation

---

## Task Checklist

### T1: Storage module — the single localStorage gateway
- [ ] Implement Task 1: keys + `SCHEMA_VERSION`; `readBoard`/`writeBoard`/`clearBoard`/`isValidBoardState` with corrupt-input fallback
- [ ] Verify Task 1: TC-001–007 + TC-016 pass; ≥90% branch coverage; tsc + lint clean

### T2: Demo seed factory
- [ ] Implement Task 2: deterministic `createSeedBoard` with 3 columns + 8 realistic tasks
- [ ] Verify Task 2: TC-008–010 pass; seed validates via T1 guard

### T3: Load-or-seed lifecycle + Reset demo
- [ ] Implement Task 3: `loadInitialBoard` (restore > seed precedence) + `resetDemo`
- [ ] Verify Task 3: TC-011–014 pass (DD-5 precedence + FR-P4 fallback)

### T4: Auto-persist hook + Reset demo binding
- [ ] Implement Task 4: `useAutoPersist` hook + document/expose `resetDemo` seam
- [ ] Verify Task 4: TC-015 passes; button flow deferred to kanban-board integration

---

## Completion Summary

{Updated when all tasks are done.}
