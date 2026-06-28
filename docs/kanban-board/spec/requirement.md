# Kanban Demo — Board & Task CRUD
## Feature Breakdown by Deliverable

**Version:** 1.0.0
**Project:** kanban-demo
**Date:** June 2026
**Owner:** Demo

---

## 1. Requirement Overview

> After the demo user logs in, the app shows a Kanban board with three fixed
> columns pre-filled with realistic tasks, and lets the user create, edit, and
> delete task cards entirely client-side.

This requirement covers the **board surface** (three fixed columns + counts) and
**task CRUD** (create / edit / delete). It is the foundational feature — it
defines the shared `Task` / `Column` / `BoardState` types and the
single-source-of-truth board store that `drag-and-drop` and `persistence-seed`
build on.

| Axis | What it solves | For whom |
|---|---|---|
| Visibility | A populated, ordered board with live per-column counts | Demo User |
| Editing | Add, rename, and remove task cards without a reload | Demo User |
| Foundation | A normalized board store other features extend (move, persist) | System |

> Dependency: F-02 (Task CRUD) operates on the columns rendered by F-01.

---

## 3. Detailed Features

### F-01: Board & Columns (Demo User)

**Description**
After login the app renders the Kanban board: three fixed columns
(To Do / In Progress / Done) in a fixed order, each showing its title and a
live count of the tasks it currently holds.

**Actor:** Demo User
**Priority:** Must
**Screen:** SCR-001

#### Business Rules

| ID | Rule |
|---|---|
| BR-001 | The board renders exactly three columns — To Do, In Progress, Done — in that fixed order. |
| BR-002 | No column create / rename / delete in v1 (out of scope — see drag-and-drop & persistence-seed specs for sibling scope). |
| BR-003 | Each column header shows its title and a count equal to the number of tasks currently in that column. |
| BR-004 | Components read board state only from the board store (single source of truth); never from localStorage directly. |

#### Acceptance Criteria

| ID | Criterion | Expected Result |
|---|---|---|
| AC-001 | After authentication the board view renders with all three columns and their cards | PASS: three columns visible with cards |
| AC-002 | Columns render in order To Do → In Progress → Done | PASS: fixed left-to-right order |
| AC-003 | Each column header shows title + count; count updates immediately on add / remove | PASS: count always matches card count |
| AC-004 | Board is usable from 320px to desktop | PASS: columns stack/scroll, no overflow break (NFR-3) |

### F-02: Task Create / Edit / Delete (Demo User)

**Description**
The user adds a card to any column (title required, description optional),
edits a card's title/description, and deletes a card behind a lightweight
confirmation — all reflected immediately without a reload.

**Actor:** Demo User
**Priority:** Must
**Screen:** SCR-001

#### Business Rules

| ID | Rule |
|---|---|
| BR-010 | A task requires a non-empty title (after trim); description is optional. |
| BR-011 | Each task belongs to exactly one column and holds an explicit position = its index in that column's ordered `taskIds`; never zero, never two columns. |
| BR-012 | Deleting a task requires a lightweight confirmation before removal. |
| BR-013 | A newly created task appears at the bottom of its target column. |
| BR-014 | Create / edit / delete update the store and re-render immediately — no manual save, no reload. |

#### Acceptance Criteria

| ID | Criterion | Expected Result |
|---|---|---|
| AC-010 | User creates a task in any column with a title (+ optional description) | PASS: card appears immediately in that column (FR-T1, FR-T5) |
| AC-011 | Creating a task with an empty / whitespace-only title | PASS: rejected, no task created (BR-010) |
| AC-012 | User edits a task's title and description | PASS: card updates in place immediately (FR-T2) |
| AC-013 | User deletes a task | PASS: confirmation shown; on confirm card is removed, on cancel it stays (FR-T3) |
| AC-014 | After any create / edit / delete | PASS: the task still appears in exactly one column (FR-T4, BR-011) |

---

## 4. Non-Functional Requirements

| ID | Category | Description | Threshold | Measurement Condition |
|---|---|---|---|---|
| NFR-001 | Usability | Board usable on small screens with touch-friendly targets (NFR-3) | Works at 320px; tap targets ≥ 40px | Manual check at 320px and desktop |
| NFR-002 | Polish | Board looks finished; CRUD gives immediate visual feedback (NFR-5) | No flicker/jank; clear hover/focus states | Manual demo walkthrough |

---

## 5. UI/UX — Screen Descriptions

| | |
|---|---|
| **Prototype type** | HTML (built in-repo) |
| **Prototype status** | Draft |

### SCR-001: Board (Demo User)

**Access:** Shown after login (auth gating owned by the `demo-auth` feature).

**Purpose:** Display the three-column board and host task CRUD interactions.

| Zone | Visual Description |
|---|---|
| Column header | Title (To Do / In Progress / Done) + count badge; "Add task" affordance. |
| Card list | Vertically ordered cards; each card shows title + (optional) description, with edit and delete affordances. |
| Empty column | Renders the header with count 0 and an empty-but-styled drop area — never blank/broken. |

**Empty/error states:** an empty column shows its header with count 0 + a subtle placeholder (never blank). Board content (seed/restore) and login gating come from sibling features (persistence-seed, demo-auth).
