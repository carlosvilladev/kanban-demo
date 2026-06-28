# TDD Contract: Persistence & Demo Seed Data

Markdown TDD guide for nybo-run. Write the failing test (Red), implement (Green),
refactor. Framework: **Vitest** (+ `@testing-library/react` for the hook), with a
jsdom or `happy-dom` environment providing `localStorage`. Reset `localStorage`
between tests (`beforeEach(() => localStorage.clear())`).

---

## Task T1: Storage module

### Behavior: Round-trip persistence (AC-001, BR-001) [UNIT]
**Given** a valid `BoardState`
**When** `writeBoard(state)` then `readBoard()`
**Then** the result deep-equals `state`.
- Precondition: `localStorage` empty. Postcondition: key `kanban-demo:board` holds the state.
**Test file:** `src/storage/__tests__/boardStorage.test.ts`

### Behavior: Versioned envelope (BR-001) [UNIT]
**Given** a written board **When** `JSON.parse(localStorage.getItem('kanban-demo:board'))`
**Then** it equals `{ version: SCHEMA_VERSION, data: <board> }`.

### Behavior: Missing / corrupt → null (AC-003, AC-004, FR-P4) [UNIT]
**Given** (a) no key, (b) `"{not json"`, (c) `{version:999,data:{}}`, (d) a board with a `columnOrder` id absent from `columns` or a `taskId` with no task
**When** `readBoard()`
**Then** each returns `null` and never throws.
- Postcondition: caller is free to seed.

### Behavior: Validation guard (BR-004, BR-011) [UNIT]
**Given** assorted values **When** `isValidBoardState(x)`
**Then** `true` only when every task appears in exactly one column's `taskIds` and all refs resolve.

### Behavior: Storage write never crashes the app (NFR-T04) [UNIT]
**Given** `localStorage.setItem` stubbed to throw **When** `writeBoard(state)`
**Then** no exception propagates.

---

## Task T2: Seed factory

### Behavior: Seed shape & distribution (AC-006) [UNIT]
**Given** `createSeedBoard()`
**Then** `columnOrder` is `['todo','in-progress','done']`, each column has a title, total tasks ≥ 6, each column has ≥ 1 task.
**Test file:** `src/seed/__tests__/seedData.test.ts`

### Behavior: Seed content & single-column invariant (AC-007, BR-007, BR-011) [UNIT]
**Given** the seed **Then** every task has non-empty `title` and `description`, and `isValidBoardState(seed)` is `true`.

### Behavior: Determinism (AC-010, BR-008) [UNIT]
**Given** `a = createSeedBoard()`, `b = createSeedBoard()`
**Then** `a` deep-equals `b` AND `a !== b` (distinct references; mutating `a` must not affect `b`).

---

## Task T3: Load-or-seed lifecycle + reset

### Behavior: First load seeds & persists (AC-003, DD-1) [UNIT]
**Given** empty storage **When** `loadInitialBoard()`
**Then** returns `{ source: 'seeded', state }` deep-equal to `createSeedBoard()`, and `readBoard()` now returns that seed.
**Test file:** `src/storage/__tests__/boardLifecycle.test.ts`

### Behavior: Saved state wins over seed (AC-008, DD-5) [UNIT]
**Given** valid saved state that differs from the seed **When** `loadInitialBoard()`
**Then** returns `{ source: 'restored', state }` equal to the saved state; it is NOT the seed.

### Behavior: Corrupt load falls back to seed (AC-004, FR-P4) [UNIT]
**Given** corrupt saved state **When** `loadInitialBoard()`
**Then** returns `{ source: 'seeded', state }`; never throws; state is non-empty.

### Behavior: Reset demo (AC-009, DD-4) [UNIT]
**Given** modified saved state **When** `resetDemo()`
**Then** storage is cleared then overwritten with a fresh seed; the returned value deep-equals `createSeedBoard()`.

---

## Task T4: Auto-persist hook

### Behavior: Auto-persist on change (AC-002, FR-P2) [UNIT]
**Given** `renderHook(({s}) => useAutoPersist(s), { initialProps:{ s: boardA } })` with `writeBoard` spied
**When** `rerender({ s: boardB })`
**Then** `writeBoard` was called with `boardB`.
**Test file:** `src/storage/__tests__/useAutoPersist.test.tsx`
**Framework:** Vitest + @testing-library/react
