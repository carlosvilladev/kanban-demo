# Verification Plan

## T1: Storage module

### Test Scenarios
- Round-trip: `writeBoard` then `readBoard` returns a deep-equal board (TC-001).
- Envelope: raw value at `kanban-demo:board` is `{ version: 1, data }` (TC-002).
- Missing key → `readBoard()` is `null` (TC-003).
- Corrupt inputs → `null`, no throw: bad JSON (TC-004), wrong version (TC-005), invalid shape / dangling taskId (TC-006).
- `isValidBoardState` accepts well-formed, rejects malformed and tasks-in-two-columns (TC-007).
- Throwing `setItem` does not propagate (TC-016).

### Gate Criteria [AUTO]
All TC-001–007 + TC-016 pass with a jsdom/`happy-dom` `localStorage`; ≥90% branch coverage on `boardStorage.ts`. tsc + lint clean.

---

## T2: Seed factory

### Test Scenarios
- Shape: 3 columns To Do / In Progress / Done in order; ≥6 tasks; ≥1 per column (TC-008).
- Content: every task has non-empty title + description; each task in exactly one column (TC-009).
- Determinism: two calls deep-equal but distinct references (TC-010).
- `isValidBoardState(createSeedBoard())` is `true`.

### Gate Criteria [AUTO]
TC-008–010 pass; the seed validates against T1's guard. tsc + lint clean.

---

## T3: Load-or-seed lifecycle + Reset demo

### Test Scenarios
- First load (empty) → `{ source: 'seeded' }`, seed persisted (TC-011).
- Valid saved state (≠ seed) → `{ source: 'restored' }`, seed not applied (TC-012) — **DD-5 precedence**.
- Corrupt saved state → `{ source: 'seeded' }`, no throw (TC-013) — **FR-P4 fallback**.
- `resetDemo` clears then writes fresh seed, returns it (TC-014).

### Gate Criteria [AUTO]
TC-011–014 pass; ≥90% branch coverage on `boardLifecycle.ts`. tsc + lint clean.

---

## T4: Auto-persist hook + Reset demo binding

### Test Scenarios
- `state` change → `writeBoard` called with new state (TC-015).
- Throwing storage during change does not surface to React (TC-016 via T1).

### Gate Criteria [AUTO for hook] / [HUMAN for button]
TC-015 passes via `renderHook`. The Reset demo button placement/flow is verified during `kanban-board` integration (HUMAN — deferred cross-feature gate).

---

## End-to-End Verification

**Final acceptance test:**
1. Clear `localStorage`; load the app → board renders the seed (To Do / In Progress / Done, ≥6 tasks). (AC-003, AC-006)
2. Confirm every seed card shows a title and description. (AC-007)
3. Create / edit / delete / move / reorder a task — no save button used. (AC-002, FR-P2)
4. Reload → the board is exactly as left. (AC-001, FR-P3)
5. Modify again, reload → modified state shown; seed did not overwrite it. (AC-008, DD-5)
6. Manually corrupt `kanban-demo:board` (e.g. set it to `"{oops"`), reload → board falls back to seed; no crash, not empty. (AC-004, FR-P4)
7. Trigger Reset demo → original seed restored and persisted. (AC-009, DD-4)
8. Confirm only `src/storage/` references the `localStorage` API (grep). (AC-005, NFR-T01)

**Gate Criteria:** All steps complete without errors or data loss; board is never empty or crashed. NFR-1 (no backend/config) and NFR-4 (no data loss, graceful degradation) hold.

---

## Failure Triage

| If TC fails | Check first | Root cause pattern |
|-------------|-------------|--------------------|
| TC-001 / TC-002 | `boardStorage.ts` envelope write/read symmetry | Stringify/parse not symmetric, or key mismatch |
| TC-004–006 / TC-013 | `readBoard` guard order + `isValidBoardState` | A corrupt branch throws instead of returning `null` |
| TC-008 / TC-009 | `seedData.ts` column/task wiring | `columnId` not matching the owning column's `taskIds` |
| TC-010 | Seed determinism | Hidden `Date.now()`/`Math.random()` or shared mutable reference |
| TC-011 vs TC-012 | `loadInitialBoard` branch | Precedence inverted — seed applied over valid saved state (DD-5 break) |
| TC-014 | `resetDemo` order | Writing before clearing, or returning stale state |
| TC-015 | `useAutoPersist` effect deps | Wrong dependency array; effect not firing on change |
| TC-016 | try/catch in `writeBoard` | Storage error not swallowed |
