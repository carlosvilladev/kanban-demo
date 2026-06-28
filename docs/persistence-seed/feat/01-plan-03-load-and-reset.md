# T3: Load-or-seed lifecycle + Reset demo

## Scope

- `src/storage/boardLifecycle.ts` - New. `loadInitialBoard()` and `resetDemo()` — orchestrate read/validate/seed/persist.
- `src/storage/__tests__/boardLifecycle.test.ts` - New. Unit tests for restore-vs-seed precedence, corrupt fallback, and reset.

## Changes

### loadInitialBoard

- `type LoadSource = 'restored' | 'seeded'`
- `loadInitialBoard(): { state: BoardState; source: LoadSource }`
  1. `const saved = readBoard()` (T1).
  2. If `saved` is non-null → `{ state: saved, source: 'restored' }`. **Seed is not applied** — restored user state always wins (BR-010 / DD-5).
  3. If `saved` is `null` (missing or corrupt) → `const seed = createSeedBoard()` (T2); `writeBoard(seed)`; return `{ state: seed, source: 'seeded' }` (DD-1, FR-P4).
- Persisting the seed on first load makes "saved state exists" true after the first render; behavior stays identical to lazy seeding until the user changes something.

### resetDemo

- `resetDemo(): BoardState`
  1. `clearBoard()` (T1).
  2. `const seed = createSeedBoard()`; `writeBoard(seed)`.
  3. `return seed` so the caller can adopt it as the new source of truth (DD-4 / BR-009).

### Design Rationale (orchestration boundary)

This module is the only place the load-or-seed **decision** lives, composing the T1 primitives and the T2 factory. Keeping the precedence rule (restored > seed) in one function makes DD-5 a single, directly-tested branch.

## Dependencies

Requires **T1** (`readBoard`, `writeBoard`, `clearBoard`) and **T2** (`createSeedBoard`).

## Done When

- [ ] `loadInitialBoard` and `resetDemo` exported from `src/storage/boardLifecycle.ts`.
- [ ] No saved state → `{ source: 'seeded' }`, seed equal to `createSeedBoard()`, and seed is persisted (TC-011).
- [ ] Valid saved state (≠ seed) → `{ source: 'restored' }` equal to saved; seed NOT applied (TC-012).
- [ ] Corrupt saved state → `{ source: 'seeded' }`, no throw, non-empty (TC-013).
- [ ] `resetDemo` clears then writes a fresh seed deep-equal to `createSeedBoard()` and returns it (TC-014).
- [ ] `npm run test`, `tsc`, `npm run lint` clean.

## Interfaces Produced

- `{ name: "LoadSource", signature: "'restored' | 'seeded'", kind: "type" }`
- `{ name: "loadInitialBoard", signature: "(): { state: BoardState; source: LoadSource }", kind: "function" }`
- `{ name: "resetDemo", signature: "(): BoardState", kind: "function" }`

## Standalone Verifiable

Yes — pure orchestration over T1/T2 with a jsdom `localStorage`. Unit-testable in isolation.
