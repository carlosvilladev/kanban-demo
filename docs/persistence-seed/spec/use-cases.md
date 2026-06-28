# Persistence & Demo Seed Data — Use Cases

## Actors

| Actor | Description |
|-------|-------------|
| Demo User | The simulated signed-in user interacting with the board |
| System | The persistence layer and seed factory (automated) |
| Presenter | The person running the live demo (triggers Reset demo) |

---

## User Stories

### US-01 — Board is never empty
**As a** demo user **I want** the board to open already full of realistic tasks
**So that** the demo looks finished from the first second.

### US-02 — My changes survive a reload
**As a** demo user **I want** every change saved automatically and restored on reload
**So that** I never lose work and never click "save".

### US-03 — A broken save never breaks the app
**As a** demo user **I want** corrupt or missing storage to degrade gracefully
**So that** the board still renders instead of crashing or showing nothing.

### US-04 — Replay the demo cleanly
**As a** presenter **I want** a Reset demo action **So that** I can restore the
original seed between runs.

---

## Use Case Scenarios

### UC-01 — First load seeds the board (US-01)

**Preconditions:** No `kanban-demo:board` key in `localStorage`.

#### Main Scenario
1. App initializes and calls `loadInitialBoard()`.
2. System reads storage, finds nothing.
3. System builds the board via `createSeedBoard()` (3 columns, ≥6 tasks).
4. System persists the seed and returns `{ source: 'seeded', state }`.
5. The board renders the seed.

#### Error Scenarios
**2e. Read throws** → treated as "no state"; seed is used.

**Postconditions:** A seeded board is on screen and saved (AC-003, AC-006, AC-007).

---

### UC-02 — Change auto-saves and restores (US-02)

**Preconditions:** A board is rendered (seeded or restored).

#### Main Scenario
1. Demo user creates / edits / deletes / moves / reorders a task.
2. The in-memory `BoardState` updates (source of truth).
3. `useAutoPersist` observes the change and calls `writeBoard(state)`.
4. Later, the page reloads; `loadInitialBoard()` reads valid saved state.
5. The board renders the exact saved state.

#### Alternative Scenarios
**4a. Saved state differs from seed** → restored state wins; seed is not applied (AC-008).

**Postconditions:** Persisted state equals on-screen state (AC-001, AC-002).

---

### UC-03 — Corrupt state degrades to seed (US-03)

**Preconditions:** `kanban-demo:board` holds invalid JSON, a wrong `version`, or a
structurally invalid board.

#### Main Scenario
1. App initializes and calls `loadInitialBoard()`.
2. `readBoard()` parses/validates and returns `null` (corrupt).
3. System falls back to `createSeedBoard()` and persists it.
4. The board renders the seed; no error surfaces to the user.

**Postconditions:** Board is non-empty and consistent; app did not crash (AC-004).

---

### UC-04 — Reset demo (US-04)

**Preconditions:** Saved (possibly modified) state exists.

#### Main Scenario
1. Presenter triggers the Reset demo control.
2. System calls `resetDemo()` → `clearBoard()` then writes a fresh `createSeedBoard()`.
3. The returned fresh seed becomes the new source of truth.
4. The board re-renders the original seed.

**Postconditions:** Saved state replaced by the original seed (AC-009).

---

## UX/UI References

No dedicated screens. Reset demo is a single control owned by the app shell /
`kanban-board` header; this feature exposes the `resetDemo()` binding it calls.
