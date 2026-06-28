# T1: Session store, types, and demo constants

## Scope

- `src/auth/types.ts` - `DemoUser` and `Session` TypeScript types (new).
- `src/auth/constants.ts` - `DEMO_USER`, `DEMO_CREDENTIALS`, `SESSION_KEY` (new).
- `src/auth/session.ts` - `readSession` / `writeSession` / `clearSession` helper (new).
- `src/auth/session.test.ts` - unit tests for the helper (new).

## Changes

### Types & constants

- `DemoUser = { id: string; name: string; avatar: string }`.
- `Session = { user: DemoUser; createdAt: number; version: number }`.
- `DEMO_USER = { id: 'demo-user', name: 'Demo User', avatar: 'DU' }` (avatar is
  initials text rendered locally — no remote fetch).
- `DEMO_CREDENTIALS = { username: 'demo', password: 'demo' }`.
- `SESSION_KEY = 'kanban.session'` and a `SESSION_VERSION = 1` constant. This key
  is intentionally distinct from the board-data key owned by `persistence-seed`.

### Session storage helper

- `readSession(): Session | null` — read `SESSION_KEY`, `JSON.parse`, validate
  shape (has `user.id`, `version === SESSION_VERSION`). On missing / non-JSON /
  invalid / version mismatch → return `null`. Wrap in try/catch; never throw.
- `writeSession(user: DemoUser): Session` — build a `Session` with `createdAt`
  and `version`, `JSON.stringify` to `SESSION_KEY`, return it.
- `clearSession(): void` — `localStorage.removeItem(SESSION_KEY)` only. Must not
  read or touch any other key (board data lives elsewhere).

### Design Rationale (SRP)

All `localStorage` access for the session is funneled through one module
(mirrors the persistence convention "components never touch localStorage
directly"). Keeping the session key separate from board data is what makes
"logout never deletes board data" structurally true rather than a runtime check.

## Dependencies

None — foundational task.

## Interfaces Produced

- `DemoUser` (type), `Session` (type)
- `DEMO_USER`, `DEMO_CREDENTIALS`, `SESSION_KEY` (exports)
- `readSession(): Session | null` (function)
- `writeSession(user: DemoUser): Session` (function)
- `clearSession(): void` (function)

## Standalone Verifiable

Yes — the helper is pure aside from `localStorage` and fully testable with jsdom.

## Done When

- [ ] Types and constants compile and are importable.
- [ ] `readSession` returns `null` for missing, non-JSON, malformed, and
      version-mismatched values without throwing.
- [ ] `writeSession` round-trips: `readSession()` after `writeSession(DEMO_USER)`
      returns an equivalent session.
- [ ] `clearSession` removes only `SESSION_KEY` (a sibling key set in the test
      survives untouched).
- [ ] `npm run test` passes for `session.test.ts`; `tsc`/lint clean.
