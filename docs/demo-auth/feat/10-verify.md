# Verification Plan

## T1: Session store
### Test Scenarios
- Round-trip: `writeSession(DEMO_USER)` then `readSession()` returns equivalent session (TC-004).
- Corrupt/missing: non-JSON, `{}`, wrong version → `readSession()` returns `null`, no throw (TC-006).
- Isolation: `clearSession()` removes only `kanban.session`; a sibling `kanban.board` key survives (TC-005).
### Gate Criteria
`[AUTO]` `session.test.ts` passes; corrupt input never throws; no key other than `kanban.session` is mutated.

---

## T2: Auth context
### Test Scenarios
- Hydrate: mount with a valid persisted session → `isAuthenticated === true`; none → `false` (TC-004).
- One-click + credential login set state and persist; wrong creds return `false`, state unchanged (TC-002, TC-003).
- `logout()` clears state and session; board-data key survives (TC-005).
### Gate Criteria
`[AUTO]` Provider/hook tests pass for hydrate, login (both paths), reject, and logout.

---

## T3: Login screen
### Test Scenarios
- Inputs pre-filled `demo`/`demo`; credentials hint visible (TC-003).
- "Continue as Demo User" calls `login()`; valid submit calls `login`, wrong submit shows inline error (TC-002, TC-003).
- Renders single-column with touch-sized buttons at a 320px test viewport (AC-010).
### Gate Criteria
`[AUTO]` Component tests pass. `[HUMAN]` Visual check that the login card looks polished and readable on mobile width.

---

## T4: Route gate + logout
### Test Scenarios
- Unauthenticated → `LoginScreen` shown, children absent (TC-001).
- Authenticated → children render; `UserMenu` shows "Logged in as Demo User" + avatar (TC-007).
- Logout returns to login; pre-existing board-data key intact (TC-005).
### Gate Criteria
`[AUTO]` Gating + logout tests pass. `[HUMAN]` Confirm `App.tsx` composes auth gate around the board area.

---

## Failure Triage

| If TC fails | Check first | Root cause pattern |
|---|---|---|
| TC-001 / TC-002 | `RequireAuth` + `isAuthenticated` wiring | Gate not reading context, or provider missing at root |
| TC-004 | `readSession` validation + lazy state init | Shape/version check too strict/loose; not hydrating on mount |
| TC-005 | `clearSession` / logout scope | Logout clearing a shared key or wrong key name |
| TC-006 | try/catch in `readSession` | Unhandled `JSON.parse` throw on corrupt value |
| TC-003 | `login(creds)` comparison | Credential check inverted or trimming/casing mismatch |

---

## End-to-End Verification

**Final acceptance test:**
1. Cold open (no session) → login screen, board not visible (AC-001).
2. Click "Continue as Demo User" → board area renders, "Logged in as Demo User" shown (AC-002, AC-008).
3. Reload → still signed in, board shown (AC-005).
4. Edit any board data, then Log out → login screen (AC-006).
5. Sign back in → previously edited board data is unchanged (AC-007, invariant).
6. Set `kanban.session` to garbage, reload → login screen, no crash (AC-009).
7. Resize to 320px on the login screen → usable, no horizontal scroll (AC-010).

**Gate Criteria:** All steps pass with no console errors. `npm run test`, `npm run build`, and lint are clean. Logout provably leaves board data intact.
