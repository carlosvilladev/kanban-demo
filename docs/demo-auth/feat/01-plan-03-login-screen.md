# T3: Login screen

## Scope

- `src/auth/LoginScreen.tsx` - the login UI (new).
- `src/auth/LoginScreen.css` - responsive styles (new).
- `src/auth/LoginScreen.test.tsx` - component tests (new).

## Changes

### LoginScreen component

- Centered card: brand title, a visible credentials hint
  ("Demo credentials: demo / demo"), a username + password form, a primary
  "Sign in" button, and a prominent "Continue as Demo User" button.
- Form fields are **pre-filled** with `DEMO_CREDENTIALS` (FR-L3) and remain editable.
- "Continue as Demo User" → `login()` (no args).
- "Sign in" submit → `login({ username, password })`; if it returns `false`, show
  an inline error: "Use demo / demo (or click Continue as Demo User." and stay on
  the screen. No navigation here — the gate (T4) swaps the view when
  `isAuthenticated` flips.
- Password field uses `type="password"`; submitting via Enter works.

### Styling (NFR-3)

- Fluid, single-column card centered with flexbox; usable from 320px to desktop.
- Interactive targets ≥ 44px tall for touch. No fixed pixel widths that break on
  mobile. No external fonts/assets fetched (NFR-1, offline).

### Design Rationale (SRP)

`LoginScreen` is pure presentation + intent: it calls `useAuth().login` and
renders error state. It owns no session or persistence logic.

## Dependencies

Requires T2 (`useAuth`) and T1 (`DEMO_CREDENTIALS`).

## Interfaces Produced

- `LoginScreen` (component)

## Standalone Verifiable

Yes — rendered inside a test `AuthProvider`; assert DOM + `login` calls.

## Done When

- [ ] Username and password inputs render pre-filled with `demo` / `demo`.
- [ ] The credentials hint text is visible.
- [ ] Clicking "Continue as Demo User" calls `login()` with no args.
- [ ] Submitting valid creds calls `login` and shows no error; submitting wrong
      creds shows the inline error and the screen stays mounted.
- [ ] Layout is single-column and readable at 320px (no horizontal scroll in test
      viewport); buttons meet the touch-target size.
- [ ] `npm run test` passes; `tsc`/lint clean.
