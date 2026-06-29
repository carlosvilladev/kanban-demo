# demo-auth — Suggestions

## Quick Wins

[S001] **Split AuthContext.tsx to silence the react-refresh warning** — move the `AuthContext` object and `AuthContextValue` type to `src/auth/authContext.ts` (a plain `.ts`, not `.tsx`), keeping only `AuthProvider` in `AuthContext.tsx`. Then the component file exports only components and the warning disappears. Low risk, ~5-minute refactor.

[S002] **Add `login` and `logout` to `useCallback` inside AuthProvider** — currently they are arrow functions recreated on every render and excluded from the `useMemo` dep array. Wrapping them in `useCallback` would make the dep array correct and avoid the react-hooks/exhaustive-deps rule being silently bent.

## Future Enhancements

[S003] **Animated transition between login and board** — a subtle fade on `isAuthenticated` flip would make the demo feel more polished without adding complexity. A single CSS transition on the wrapping div is enough.

[S004] **Persist last-used username** — prefill the username field with the last typed value from sessionStorage so a page-reload mid-login doesn't lose what the user typed. Trivial to add without touching board storage.

[S005] **Dark-mode support for LoginScreen** — the card uses hardcoded #fff / #f3f4f6. A `prefers-color-scheme` media query in LoginScreen.css would be a one-change visual upgrade.

## Technical Debt

[S006] **Inline styles in App.tsx header** — the header now mixes inline `style={}` with CSS class components (UserMenu, ResetDemoButton). Extracting an `AppHeader.tsx` with a CSS module would unify styling and make the shell easier to change for the drag-and-drop spec.

## Questions for the Human

[S007] **Session expiry** — the current `Session.createdAt` field is stored but never checked. Should there be a max session age (e.g. 24 h) that forces re-login? For a demo this is probably unnecessary, but if the demo is meant to reset daily, an expiry check in `readSession` is the right place.

[S008] **drag-and-drop wrapping** — Spec 4 (drag-and-drop) will need `DndContext` from dnd-kit wrapping the board. That provider should live inside `RequireAuth` (only needed when authed). Confirm: should `DndContext` sit in `Board.tsx` or be promoted to `App.tsx`? The current App structure makes either location viable.
