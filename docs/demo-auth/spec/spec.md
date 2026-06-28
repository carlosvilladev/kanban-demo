# Demo Authentication & Session — Software Design Document

## Source

Features (F-01), business rules (BR-xxx), acceptance criteria (AC-xxx), and the
login screen (SCR-001) live in [requirement.md](./requirement.md). This SDD
covers the engineering design only.

---

## Intention

Gate the demo behind a simulated login so it reads like a real app: a visitor
signs in as the demo user (one click or `demo / demo`), the session persists in
`localStorage`, reload stays signed in, and logout returns to login without
touching board data.

---

## Flows

| Flow | Steps | AC refs |
|------|-------|---------|
| Sign in (one-click) | Login → "Continue as Demo User" → board | AC-002, AC-008 |
| Sign in (credentials) | Enter `demo/demo` → Sign in → board (wrong → error) | AC-003, AC-004 |
| Resume session | Launch with valid session → board | AC-005 |
| Log out | Click Log out → session cleared → login (board data intact) | AC-006, AC-007 |
| Corrupt session | Unparseable session → treated as logged out | AC-009 |

---

## Assumptions

- **Credentials:** `demo` / `demo`, pre-filled in the form and shown as a hint (FR-L3).
- **Both methods provided:** one-click button *and* credential form, for a polished demo.
- **Wrong credentials rejected** with an inline error (FR-L2 implies only demo creds work).
- **No router dependency:** gating is a conditional render on `isAuthenticated` — login vs board are the only two states, so adding a router is unjustified (NFR-1, "Stop and Ask First").
- **Avatar:** rendered locally from initials ("DU"), no remote fetch — keeps the login path offline/zero-setup.
- **Session key `kanban.session`** is distinct from the board-data key (`kanban.board`, owned by `persistence-seed`); logout removes only `kanban.session`.
- **Auth state** is a single source of truth via React Context (`AuthProvider` + `useAuth`), mirroring the board's single-source-of-truth convention.

---

## Technical Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-T01 | Dependencies | No new runtime deps — gating via conditional render, no router. |
| NFR-T02 | Offline | Avatar rendered locally (initials); no network fetch (NFR-1). |
| NFR-T03 | Isolation | Session storage isolated to key `kanban.session`. |

---

## Test Cases

### TC-001 — Unauthenticated launch shows login (AC-001) [INTEGRATION]
**Given** no `kanban.session` in `localStorage`
**When** the app mounts
**Then** the login screen renders and the board does not.

### TC-002 — One-click sign-in (AC-002, BR-002) [INTEGRATION]
**Given** the login screen
**When** the user clicks "Continue as Demo User"
**Then** a session is written and the gated children (board) render.

### TC-003 — Credential sign-in + rejection (AC-003, AC-004, BR-004) [INTEGRATION]
**Given** the login form prefilled with `demo/demo`
**When** the user submits valid then invalid credentials
**Then** valid → board; invalid → inline error and still on login.

### TC-004 — Session persists across reload (AC-005, BR-006) [UNIT]
**Given** a valid session written by login
**When** session storage is re-read on a fresh mount
**Then** `readSession()` returns the demo user and gating shows the board.

### TC-005 — Logout clears session, keeps board data (AC-006, AC-007, BR-007) [UNIT]
**Given** a signed-in session and an existing `kanban.board` value
**When** `clearSession()` / `logout()` runs
**Then** `kanban.session` is removed and `kanban.board` is byte-for-byte unchanged.

### TC-006 — Corrupt session falls back to login (AC-009, BR-009) [UNIT]
**Given** `kanban.session` set to non-JSON or an invalid shape
**When** `readSession()` runs on launch
**Then** it returns `null` (logged out) and never throws.

### TC-007 — User context displayed (AC-008, BR-008) [UNIT]
**Given** a signed-in demo user
**When** the user menu renders
**Then** "Logged in as Demo User" and the avatar are visible.

---

## Architecture

### Tradeoffs

| Tradeoff | We chose | Over | Rationale |
|----------|----------|------|-----------|
| Routing | Conditional render on `isAuthenticated` | react-router | 2-state app; zero new deps (NFR-1). |
| Avatar | Local initials avatar | Remote avatar service | Works offline; honors zero-setup. |

### Data Model

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| DemoUser | id, name, avatar | Static constant `DEMO_USER` (id `demo-user`). |
| Session | user, createdAt, version | Persisted at `kanban.session`; corrupt → `null`. |
