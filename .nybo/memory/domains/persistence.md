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

## Key Files
- `src/storage/`
- `src/seed/`

## Gotchas
- Corrupt or missing saved state must fall back to seed data, never crash or render empty.
