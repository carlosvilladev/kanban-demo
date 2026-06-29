# Progress Tracker

**Status:** Complete

**Current Task:** All tasks done — in-review

---

## Task Checklist

### T1: Storage module — the single localStorage gateway
- [x] Implement Task 1: keys + `SCHEMA_VERSION`; `readBoard`/`writeBoard`/`clearBoard`/`isValidBoardState` with corrupt-input fallback
- [x] Verify Task 1: TC-001–007 + TC-016 pass; tsc + lint clean
  - 23 unit tests covering round-trip, envelope, missing key, bad JSON, version mismatch, invalid shape, quota throw

### T2: Demo seed factory
- [x] Implement Task 2: deterministic `createSeedBoard` with 3 columns + 8 realistic tasks
- [x] Verify Task 2: TC-008–010 pass; seed validates via T1 guard
  - 12 unit tests covering shape, content, distribution, determinism, reference isolation

### T3: Load-or-seed lifecycle + Reset demo
- [x] Implement Task 3: `loadInitialBoard` (restore > seed precedence) + `resetDemo`
- [x] Verify Task 3: TC-011–014 pass (DD-5 precedence + FR-P4 fallback)
  - 14 unit tests covering first-load, restore-wins, corrupt fallback, reset, TC-017 reload simulation

### T4: Auto-persist hook + Reset demo binding
- [x] Implement Task 4: `useAutoPersist` hook; `PersistenceSyncer` component; `ResetDemoButton` component; App.tsx rewired
- [x] Verify Task 4: TC-015 passes; REPLACE_BOARD action added to BoardContext
  - 4 unit tests via renderHook

---

## Completion Summary

- Total new tests: 53 (23 + 12 + 14 + 4)
- Total suite after this spec: 121 tests, all passing
- typecheck: clean
- lint: clean
- build: 45 modules, 152 kB JS bundle
- Files created: `src/storage/keys.ts`, `src/storage/boardStorage.ts`, `src/storage/boardLifecycle.ts`, `src/storage/useAutoPersist.ts`, `src/seed/seedData.ts`, `src/components/PersistenceSyncer.tsx`, `src/components/ResetDemoButton.tsx`
- Files modified: `src/board/BoardContext.tsx` (REPLACE_BOARD action + replaceBoard fn), `src/App.tsx` (full rewire)
