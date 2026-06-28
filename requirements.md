# Requirements — Drag & Drop Kanban (Demo)

## 1. Overview

A self-contained **demo** Kanban application. It exists to showcase a polished
drag-and-drop board experience, not to be a production product. There is **no
backend** — the app ships with realistic **demo data**, runs entirely in the
browser, and persists everything to **`localStorage`**.

The demo flow is intentionally short and impressive:

1. Land on a **login screen** and sign in as a demo user (no real auth).
2. See a Kanban board **pre-populated with demo tasks**.
3. **Create, edit, delete, and drag-and-drop** tasks across columns.
4. Reload the page and find every change still there (localStorage).

### 1.1 Goals

- Demonstrate a fluid drag-and-drop Kanban in under a minute, with zero setup.
- Ship with believable **seed data** so the board looks "lived-in" on first open.
- Make every interaction work offline and survive a refresh.

### 1.2 Non-Goals

This is a demo. See [Section 8 — Out of Scope](#8-out-of-scope). In short: no real
authentication, no server, no multi-user, no accounts beyond the demo user.

---

## 2. Demo Data

The app is **seeded on first run** so it is never empty.

- **DD-1** On first load (when no saved state exists in `localStorage`), the app
  shall seed a default board with demo columns and demo tasks.
- **DD-2** The default board shall have at least three columns —
  **To Do**, **In Progress**, **Done** — with a few realistic demo tasks
  distributed across them (e.g. "Design login screen", "Wire up drag & drop",
  "Write demo script").
- **DD-3** Seed tasks shall include a title and a short description so cards look
  realistic.
- **DD-4** A **"Reset demo"** action shall be available to clear saved state and
  restore the original seed data, so the demo can be replayed cleanly.
- **DD-5** Seeding shall run only when no saved state exists; once the user makes
  changes, their state takes precedence over the seed.

---

## 3. User Stories

- As a visitor, I land on a login screen and sign in as a demo user.
- As a demo user, I immediately see a board already filled with demo tasks.
- As a demo user, I can add a new task to any column.
- As a demo user, I can edit a task's title and description.
- As a demo user, I can delete a task I no longer want.
- As a demo user, I can **drag a task** to reorder it or move it between columns.
- As a demo user, I can reload the page and my changes are still there.
- As a demo user, I can reset the demo to its original state.
- As a demo user, I can log out and return to the login screen.

---

## 4. Functional Requirements

### 4.1 Login Experience (demo)

- **FR-L1** On launch, an unauthenticated user shall see a **login screen**.
- **FR-L2** Authentication is **simulated** — no real backend. Logging in shall be
  possible via a one-click **"Continue as Demo User"** button and/or a simple
  username/password form that accepts the demo credentials.
- **FR-L3** Pre-filled or clearly displayed demo credentials shall make signing in
  obvious (e.g. `demo / demo`), so no one is blocked at the door.
- **FR-L4** After login, the demo user's "session" shall persist in `localStorage`
  so a reload keeps the user signed in and lands them back on the board.
- **FR-L5** A **Log out** action shall clear the session and return to the login
  screen. (Logging out shall not delete the user's board data.)
- **FR-L6** The login screen shall display the demo user's name/avatar context
  somewhere after sign-in (e.g. "Logged in as Demo User") to make the flow read
  as a real app.

### 4.2 Board & Columns

- **FR-B1** After login, the app shall display the Kanban board with its columns
  and cards.
- **FR-B2** The board shall render the three seeded columns (To Do / In Progress /
  Done) in a fixed, sensible order for the demo.
- **FR-B3** Each column shall show its title and current task count.

> Note: column creation/rename/delete is **out of scope** for the demo — the three
> seeded columns are sufficient to show movement. (See Out of Scope.)

### 4.3 Tasks — Create / Edit / Delete

- **FR-T1** Users shall be able to **create** a task in any column, supplying at
  least a title (description optional).
- **FR-T2** Users shall be able to **edit** a task's title and description.
- **FR-T3** Users shall be able to **delete** a task, with a lightweight
  confirmation to avoid accidental loss during a demo.
- **FR-T4** Each task shall belong to exactly one column and hold an explicit
  position within that column.
- **FR-T5** Newly created tasks shall appear immediately in the target column
  without a reload.

### 4.4 Drag & Drop (core feature)

- **FR-D1** Users shall be able to drag a task and drop it at a new position
  **within the same column** (reorder).
- **FR-D2** Users shall be able to drag a task and drop it **into a different
  column**, changing its column and position in one action.
- **FR-D3** While dragging, the app shall show a visual representation of the task
  being dragged (a "ghost"/preview).
- **FR-D4** While dragging over a valid column, the app shall show a
  **placeholder / insertion indicator** marking where the task will land.
- **FR-D5** Dropping shall settle the task into place (smooth animation) and update
  the order immediately.
- **FR-D6** Dropping outside any valid target, or pressing **Escape** mid-drag,
  shall cancel the move and return the task to its origin.
- **FR-D7** No drag/drop outcome (success or cancel) shall ever duplicate or lose a
  task.
- **FR-D8** Drag and drop shall work with both **mouse and touch** input.

### 4.5 Persistence (localStorage)

- **FR-P1** All board state — tasks, their columns, and their order — shall persist
  to **`localStorage`**.
- **FR-P2** Every change (create, edit, delete, move, reorder) shall save
  automatically; there is no explicit "save" action.
- **FR-P3** On reload, the app shall restore the exact saved state (board + login
  session).
- **FR-P4** If saved state is missing or corrupt, the app shall fall back to the
  demo seed data rather than crashing or showing an empty board.

---

## 5. Non-Functional Requirements

- **NFR-1 Zero setup:** The demo shall run as a static frontend with no server,
  database, or build/login configuration required.
- **NFR-2 Performance:** Drag interactions shall feel real-time on the demo-sized
  board (≈3 columns, ≈10–20 tasks); drop/reorder shall complete within ~100 ms of
  release.
- **NFR-3 Responsiveness:** The board and login shall be usable from mobile
  (~320 px) to desktop, with touch-friendly drag targets.
- **NFR-4 Reliability:** No data loss on reload; an interrupted drag leaves the
  board consistent; corrupt state degrades gracefully to seed data (FR-P4).
- **NFR-5 Polish:** The demo should look finished — seeded content, clear visual
  drag feedback, and smooth animations — since its purpose is to impress.
- **NFR-6 Browser support:** Latest two versions of Chrome, Firefox, Safari, Edge.

---

## 6. Acceptance Criteria

- [ ] On first load, an unauthenticated user sees the login screen.
- [ ] Clicking "Continue as Demo User" (or entering demo credentials) lands the
      user on the board.
- [ ] The board appears pre-populated with seeded demo tasks across To Do /
      In Progress / Done.
- [ ] A user can create a task, edit its title/description, and delete it (with
      confirmation).
- [ ] A task can be reordered within a column via drag and drop.
- [ ] A task can be dragged from one column to another, and its new column sticks.
- [ ] An insertion indicator shows the drop position during a drag.
- [ ] Pressing Escape mid-drag cancels the move and restores the original position.
- [ ] After any change, reloading the page restores the exact same board **and**
      keeps the user logged in.
- [ ] "Reset demo" restores the original seed data.
- [ ] "Log out" returns to the login screen without deleting board data.
- [ ] No task is ever duplicated or lost across any drag/drop or cancel sequence.

---

## 7. Demo Walkthrough (happy path)

1. Open the app → **login screen** with obvious demo credentials.
2. Click **Continue as Demo User** → board loads, already full of demo tasks.
3. **Create** a task in "To Do".
4. **Drag** it into "In Progress", then into "Done".
5. **Edit** a task's description; **delete** another (confirm).
6. **Reload** the page → everything is exactly as left, still logged in.
7. (Optional) **Reset demo** to replay from a clean seed.

---

## 8. Out of Scope

Explicitly **not** part of this demo:

- Real authentication, accounts, passwords, or any server/backend.
- Multi-user collaboration or real-time sync.
- Creating, renaming, deleting, or reordering **columns** (the three seeded
  columns are fixed).
- Multiple boards, board sharing, or permissions.
- Rich task metadata (due dates, labels, assignees, attachments, comments).
- Search, filtering, sorting, activity history, and undo/redo.
- Notifications and third-party integrations.
- Keyboard-only drag and drop and full WCAG conformance (nice-to-have, not
  required for the demo).

---

## 9. Resolved Decisions

- **Storage:** `localStorage` only — no backend (this is a demo).
- **Auth:** Simulated demo login; session stored in `localStorage`.
- **Seed data:** Three fixed columns with realistic demo tasks; re-seedable via
  "Reset demo".
