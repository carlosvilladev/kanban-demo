# demo-auth — Progress

## Tasks

- [x] T1: Session store, types, and demo constants
  - `src/auth/types.ts`, `src/auth/constants.ts`, `src/auth/session.ts`
  - 11 unit tests green; TC-004, TC-005, TC-006 covered
- [x] T2: Auth context and useAuth hook
  - `src/auth/AuthContext.tsx`, `src/auth/useAuth.ts`
  - 8 tests green; TC-002, TC-003, TC-004, TC-005 covered
- [x] T3: Login screen
  - `src/auth/LoginScreen.tsx`, `src/auth/LoginScreen.css`
  - 11 tests green; TC-001, TC-002, TC-003 covered
- [x] T4: Route gate, UserMenu (logout), and App wiring
  - `src/auth/RequireAuth.tsx`, `src/auth/UserMenu.tsx`, `src/auth/index.ts`, `src/App.tsx`
  - 7 tests green; TC-001, TC-005, TC-007 covered

## Final results

- Test files: 12 passed
- Tests: 159 passed (122 pre-existing + 37 new)
- Typecheck: clean
- Lint: 0 errors, 1 warning (react-refresh — context object co-located with provider)
- Build: clean (vite production, 155 kB JS)
