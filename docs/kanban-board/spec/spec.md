# Kanban Board & Task CRUD — Software Design Document

## Source

Product requirements (F-xx, BR-xxx, AC-xxx, SCR-001) live in
[requirement.md](./requirement.md). This SDD covers the engineering design:
the shared board type model and the single-source-of-truth store.

---

## Intention

Render the three fixed Kanban columns and let the Demo User create, edit, and
delete task cards client-side. This is the foundation feature — it owns the
`Task` / `Column` / `BoardState` types and the board store that
`drag-and-drop` (adds move/reorder) and `persistence-seed` (supplies initial
state + auto-save) extend.

---

## Scope

- **In:** board + 3 fixed columns + counts (F-01); task create/edit/delete (F-02); shared types; in-memory board store (single source of truth).
- **Out (sibling features, referenced as deps):** column CRUD (none in v1); drag-and-drop reorder/move → `drag-and-drop`; localStorage seed/save/restore/reset → `persistence-seed`; login gating + session → `demo-auth`.

---

## Use Cases

| Use Case | Description | AC refs |
|----------|-------------|---------|
| UC-01 — View board | User sees three ordered columns with cards and live counts | AC-001, AC-002, AC-003 |
| UC-02 — Manage tasks | User creates / edits / deletes a card; board updates immediately | AC-010..AC-014 |

---

## Technical Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-T01 | Test | Pure board operations covered by Vitest unit tests (happy + edge). |
| NFR-T02 | Test | Store + components covered with React Testing Library (jsdom). |
| NFR-T03 | Dep | RTL stack (`@testing-library/react`, `jsdom`) is a new dev dep — executor must get approval before adding (AGENTS.md "Stop and Ask First"). |

---

## Test Cases

Given/When/Then, compacted; each references an AC. Tag: [UNIT] [INTEGRATION] [MANUAL].

| TC | Type | Given / When / Then | Refs |
|----|------|---------------------|------|
| TC-001 | UNIT | Given nothing · When `createEmptyBoard()` · Then 3 columns in fixed order, all empty | AC-002 |
| TC-002 | UNIT | Given a board · When `createTask(col, {title})` · Then task appended to that column, count +1, present in exactly one column | AC-010, AC-014, BR-011/013 |
| TC-003 | UNIT | Given a board · When `createTask` with empty/whitespace title · Then no-op/throws, no task added | AC-011, BR-010 |
| TC-004 | UNIT | Given a task · When `updateTask(id,{title,description})` · Then fields change, membership/position unchanged | AC-012 |
| TC-005 | UNIT | Given a task · When `deleteTask(id)` · Then absent from `tasks` map and from every column's `taskIds` | AC-013, AC-014 |
| TC-006 | UNIT | Given a board · When selectors run · Then `selectColumnTaskCount` = taskIds length and `getTaskColumn` returns owning column or undefined | AC-003 |
| TC-007 | INTEGRATION | Given `BoardProvider` · When a consumer dispatches create · Then state updates and the consumer re-renders with the new count | AC-003, AC-014 |
| TC-008 | INTEGRATION | Given the store · When `Board` renders · Then 3 columns appear in order with titles + counts | AC-002, AC-003 |
| TC-009 | INTEGRATION | Given the board UI · When user submits the add-task form · Then the card appears immediately in the target column | AC-010, FR-T5 |
| TC-010 | INTEGRATION | Given a card · When user edits it · Then title/description update in place | AC-012 |
| TC-011 | INTEGRATION | Given a card · When user clicks delete · Then a confirmation shows; confirm removes the card, cancel keeps it | AC-013 |
| TC-012 | MANUAL | Given 320px viewport · When viewing the board · Then columns remain usable (stack/scroll), tap targets ≥ 40px | AC-004, NFR-001 |
| TC-013 | MANUAL | Given the demo · When walking the board · Then cards/columns/forms look finished with immediate feedback | NFR-002 |

---

## Architecture

### Data Model — shared board types (authoritative; other specs import these)

```ts
// src/types/board.ts
export type ColumnId = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;          // unique, stable (crypto.randomUUID)
  title: string;       // required; non-empty after trim
  description: string; // optional content; '' when none
}

export interface Column {
  id: ColumnId;
  title: string;       // 'To Do' | 'In Progress' | 'Done'
  taskIds: string[];   // ordered; a task's position === its index here
}

export interface BoardState {
  tasks: Record<string, Task>;       // normalized — keyed by Task.id
  columns: Record<ColumnId, Column>; // the three fixed columns
  columnOrder: ColumnId[];           // fixed: ['todo','in-progress','done']
}
```

**Invariant (BR-011):** membership + position derive *only* from
`column.taskIds`. A task id appears in exactly one column's `taskIds` — never
zero, never two. `Task` deliberately carries **no** `columnId`/`order` field;
this keeps drag-and-drop a single-array splice and removes the dual-write
hazard that duplicates/loses tasks. Derive the owning column via
`getTaskColumn(state, taskId)`.

**Store seam (single source of truth):** `BoardProvider({ initialState?, children })`
holds `BoardState` in a `useReducer`; `useBoard()` exposes state + `createTask`
/ `editTask` / `deleteTask` (delegating to the pure ops) + selectors.
`initialState` defaults to `createEmptyBoard()`. Extension points:
`persistence-seed` supplies a seeded/restored `initialState` and subscribes to
state changes; `drag-and-drop` adds a `MOVE_TASK` action that re-splices
`taskIds`.

### Tradeoffs

| Tradeoff | We chose | Over | Rationale |
|----------|----------|------|-----------|
| Single vs dual source for membership | `column.taskIds` only | `Task.columnId` + `taskIds` | One authoritative array → no dual-write drift; protects "never duplicate or lose" across CRUD and (later) drag. |
| Position model | array index | explicit numeric `order` field | Simpler, no reindex/fractional-key bugs at demo scale (~10–20 tasks). |

### Dependencies

- **Blocks:** `drag-and-drop` (consumes the store; adds `MOVE_TASK`), `persistence-seed` (wraps `initialState` + auto-save).
- **Soft (runtime):** `demo-auth` gates the board behind login (AC-001 "after login"); not required to build/test this feature in isolation.
- **Domains:** board (primary), persistence + drag-and-drop (seam-only awareness).
- **Project skills:** `create-component`, `create-service` (`.nybo/skills/`).

---

## Assumptions

Recorded because this spec was planned autonomously (no clarifying interview).

1. **ColumnId values** are the slugs `'todo' | 'in-progress' | 'done'` with display titles To Do / In Progress / Done.
2. **`Task` has no `columnId`/`order`** — diverges from `.nybo/foundation/entities.yaml` (which lists those); the normalized `taskIds` array is the single source of truth per the board domain pattern. Reconcile entities.yaml if this is wrong.
3. **New tasks append to the bottom** of the target column (BR-013).
4. **Delete confirmation** is a lightweight in-app dialog (not `window.confirm`) for polish (NFR-5).
5. **Add-task entry point** is a per-column "Add task" control opening an inline form (title + optional description).
6. **No seed/persistence here** — `BoardProvider` defaults to an empty board; `persistence-seed` injects content. Tests use explicit fixtures.
7. **IDs** via `crypto.randomUUID()` with a fallback for older runtimes.
