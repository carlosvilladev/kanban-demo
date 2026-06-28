# T4: Route gate, user menu (logout), and App wiring

## Scope

- `src/auth/RequireAuth.tsx` - auth gate wrapper (new).
- `src/auth/UserMenu.tsx` - signed-in badge + logout control (new).
- `src/auth/UserMenu.css` - styles (new).
- `src/auth/index.ts` - barrel exports for the auth module (new).
- `src/App.tsx` - wrap the tree in `AuthProvider` and gate the board (modified).
- `src/auth/RequireAuth.test.tsx` - gating tests (new).

## Changes

### RequireAuth (gate)

- Reads `useAuth().isAuthenticated`. When `false` → render `<LoginScreen />`.
  When `true` → render `children` (the board area). This is the conditional
  render that replaces a router (see spec Assumptions).

### UserMenu (FR-L6 + logout / FR-L5)

- Renders an initials avatar (from `DEMO_USER.avatar`) and "Logged in as Demo
  User", plus a "Log out" button that calls `useAuth().logout()`.
- After logout, `isAuthenticated` flips and `RequireAuth` shows `LoginScreen`
  automatically. Logout touches only the session — board data is untouched.

### App wiring

- `App.tsx`: `<AuthProvider>` at the root, then `<RequireAuth>` wrapping the
  board area. Render `<UserMenu />` in the app header (only visible when
  authenticated, since it lives inside the gated subtree or reads
  `isAuthenticated`). **Integration seam:** `App.tsx` is shared with the
  app-shell/board work — keep auth wiring additive so it composes with the board.

### Design Rationale (OCP)

The gate is a single composable wrapper; the board mounts as its children with
no knowledge of auth. Adding auth does not modify board components.

## Dependencies

Requires T2 (`useAuth`, `AuthProvider`) and T3 (`LoginScreen`).

## Interfaces Produced

- `RequireAuth` (component)
- `UserMenu` (component)

## Standalone Verifiable

Partial — gate logic is unit-testable in isolation; full App composition is the
end-to-end check (see 10-verify). Blocking coupling: shared `App.tsx` with the
board feature — verify board still mounts under the gate once both exist.

## Done When

- [ ] Unauthenticated → `RequireAuth` renders `LoginScreen`; the gated children
      are not in the DOM.
- [ ] Authenticated → children render and `UserMenu` shows "Logged in as Demo
      User" + avatar.
- [ ] "Log out" calls `logout()`; the view returns to `LoginScreen`.
- [ ] A board-data key written before logout still exists afterward.
- [ ] `App.tsx` mounts without errors; `AuthProvider` wraps the tree.
- [ ] `npm run test` passes; `npm run build` + `tsc`/lint clean.
