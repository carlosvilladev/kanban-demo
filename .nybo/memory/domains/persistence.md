# Domain: persistence

localStorage seeding, auto-save, restore, and reset-demo.

## Conventions
- All localStorage access goes through one persistence module; components never touch it directly.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->
- Seed runs only when no saved state exists; user state takes precedence over seed.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->

## Patterns
- Auto-persist on every state change (no explicit save action).
- Reset-demo clears saved state and re-applies the seed.
- App integration seam (canonical wiring between board store and persistence): `const [initialState] = useState(() => loadInitialBoard().state)` (one-time localStorage read in the useState initializer, so it runs exactly once) → `<BoardProvider initialState={initialState}>` (injects into the reducer) → `useAutoPersist(state)` called in a nested `AppContent` child (not in App itself, because `useBoard()` requires being inside `BoardProvider`). See `src/App.tsx`.
<!-- added: 2026-06-29 | feature: kanban-board | confidence: high | verified: 2026-06-29 -->

## Key Files
- `src/storage/`
- `src/seed/`

## Gotchas
- Corrupt or missing saved state must fall back to seed data, never crash or render empty.
