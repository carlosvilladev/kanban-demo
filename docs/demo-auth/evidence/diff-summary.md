# demo-auth — diff summary

## Files created (new)

### src/auth/ (new directory)
- `src/auth/types.ts` — DemoUser and Session interfaces
- `src/auth/constants.ts` — DEMO_USER, DEMO_CREDENTIALS, SESSION_KEY, SESSION_VERSION
- `src/auth/session.ts` — readSession / writeSession / clearSession helpers
- `src/auth/session.test.ts` — 11 unit tests covering TC-004, TC-005, TC-006
- `src/auth/AuthContext.tsx` — AuthProvider component + AuthContextValue type
- `src/auth/useAuth.ts` — useAuth hook (throws descriptive error outside provider)
- `src/auth/AuthContext.test.tsx` — 8 tests covering TC-002, TC-003, TC-004, TC-005
- `src/auth/LoginScreen.tsx` — login card with one-click + credential form
- `src/auth/LoginScreen.css` — fluid single-column card styles (320px → desktop)
- `src/auth/LoginScreen.test.tsx` — 11 tests covering TC-001, TC-002, TC-003
- `src/auth/RequireAuth.tsx` — auth gate (conditional render: LoginScreen vs children)
- `src/auth/UserMenu.tsx` — avatar + "Logged in as Demo User" + Log out button
- `src/auth/UserMenu.css` — header-friendly user menu styles
- `src/auth/index.ts` — barrel exports for the auth module
- `src/auth/RequireAuth.test.tsx` — 7 tests covering TC-001, TC-005, TC-007

## Files modified

- `src/App.tsx` — wrapped board composition with AuthProvider + RequireAuth; added UserMenu to header; preserved all persistence-seed wiring (initialState, PersistenceSyncer, ResetDemoButton)
- `docs/demo-auth/status.yaml` — updated from `draft` → `in-review`

## Test count change

| Before | After | New tests |
|--------|-------|-----------|
| 122    | 159   | +37       |
