# Domain: persistence

localStorage seeding, auto-save, restore, and reset-demo.

## Conventions
- All localStorage access goes through one persistence module; components never touch it directly.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->
- Seed runs only when no saved state exists; user state takes precedence over seed.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->
- [PERS-01] Persisted envelope is `{ version: SCHEMA_VERSION, data: BoardState }` at key `kanban-demo:board`; bumping `SCHEMA_VERSION` invalidates saved data — callers re-seed, no migration code needed (demo scope).
<!-- added: 2026-06-28 | feature: persistence-seed | confidence: high | verified: 2026-06-28 -->
- [PERS-02] `isValidBoardState(unknown): value is BoardState` is called on every read — it checks structural shape, referential integrity (all `columnOrder` ids exist in `columns`; all `taskIds` resolve to entries in `tasks`), and the BR-011 single-column invariant. Any failure returns `null`; callers seed.
<!-- added: 2026-06-28 | feature: persistence-seed | confidence: high | verified: 2026-06-28 -->
- [PERS-03] All storage writes (`writeBoard`, `clearBoard`) catch and swallow exceptions (quota exceeded, private-mode browsers — NFR-T04). Storage errors must never propagate to application code; the UI degrades gracefully.
<!-- added: 2026-06-28 | feature: persistence-seed | confidence: high | verified: 2026-06-28 -->
- [PERS-04] `createSeedBoard()` uses only stable literal IDs — no `Date.now()`, `Math.random()`, or `crypto`. Two consecutive calls must return deeply-equal but independently mutable objects (so reset always produces the same board).
<!-- added: 2026-06-28 | feature: persistence-seed | confidence: high | verified: 2026-06-28 -->

## Patterns
- Auto-persist on every state change (no explicit save action).
- Reset-demo clears saved state and re-applies the seed.
- `loadInitialBoard()` returns `{ state: BoardState; source: 'restored' | 'seeded' }`. The `LoadSource` discriminant lets callers distinguish a cold start (seed applied and persisted) from a warm start (user state restored) without inspecting board contents.
- `<PersistenceSyncer>` is a zero-UI child mounted inside `<BoardProvider>` that calls `useAutoPersist(useBoard().state)`. This is the sole auto-save wiring point; `useAutoPersist` calls `writeBoard` inside `useEffect([state])`. Components must not call `writeBoard` directly — route all board writes through this syncer or the storage gateway.

## Key Files
- `src/storage/`
- `src/seed/`

## Gotchas
- Corrupt or missing saved state must fall back to seed data, never crash or render empty.
