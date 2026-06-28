# T2: Auth context and useAuth hook

## Scope

- `src/auth/AuthContext.tsx` - `AuthProvider` + context value (new).
- `src/auth/useAuth.ts` - `useAuth` hook (new).
- `src/auth/AuthContext.test.tsx` - provider/hook tests (new).

## Changes

### AuthProvider

- Holds `user: DemoUser | null` in state, initialized lazily from
  `readSession()?.user ?? null` (so a valid persisted session hydrates as
  signed-in on mount — FR-L4 reload behavior).
- Exposes context value `{ user, isAuthenticated, login, logout }` where
  `isAuthenticated = user !== null`.
- `login(creds?)`:
  - No `creds` (one-click "Continue as Demo User") → sign in as `DEMO_USER`.
  - With `creds` → accept only when `username/password` match `DEMO_CREDENTIALS`;
    on match sign in and return `true`; on mismatch return `false` and do not
    change state (caller renders the inline error).
  - On successful sign-in: set state to `DEMO_USER` and call `writeSession`.
- `logout()` → set `user` to `null` and call `clearSession()` (board data untouched).

### useAuth

- Thin hook reading the context; throws a clear error if used outside
  `AuthProvider` (developer-experience guard).

### Design Rationale (Single source of truth)

Auth state lives in one React context, mirroring the board's
"single source of truth, never read localStorage directly in components"
convention. Components call `useAuth`; only the provider talks to `session.ts`.

## Dependencies

Requires T1 — consumes `readSession`, `writeSession`, `clearSession`,
`DEMO_USER`, `DEMO_CREDENTIALS`.

## Interfaces Produced

- `AuthProvider` (component)
- `useAuth(): { user: DemoUser | null; isAuthenticated: boolean; login: (creds?) => boolean; logout: () => void }`

## Standalone Verifiable

Yes — testable via a probe component rendered inside `AuthProvider`.

## Done When

- [ ] Mounting with a valid persisted session yields `isAuthenticated === true`.
- [ ] Mounting with no session yields `isAuthenticated === false`.
- [ ] `login()` (one-click) signs in and persists a session.
- [ ] `login({demo,demo})` returns `true` and signs in; wrong creds return
      `false` and leave state unchanged.
- [ ] `logout()` clears state and session; a pre-existing board-data key survives.
- [ ] `useAuth` outside the provider throws a descriptive error.
- [ ] `npm run test` passes; `tsc`/lint clean.
