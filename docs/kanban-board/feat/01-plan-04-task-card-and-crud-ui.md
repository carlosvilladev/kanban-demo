# T4: Task card and CRUD UI

## Scope

- `src/components/TaskCard.tsx` - New. Renders a task (title + optional description) with edit/delete affordances.
- `src/components/TaskForm.tsx` - New. Inline form for create and edit (title required, description optional).
- `src/components/ConfirmDialog.tsx` - New. Lightweight confirmation used for delete.
- `src/components/TaskCard.test.tsx` - New. RTL tests for create/edit/delete flows.

## Changes

### Create (FR-T1, FR-T5)

- Per-column "Add task" opens a `TaskForm`; submit calls `useBoard().createTask(columnId, { title, description })`. Submit is disabled / rejected when the trimmed title is empty (AC-011). New card appears immediately at the bottom (BR-013) — no reload.

### Edit (FR-T2)

- Card edit affordance opens `TaskForm` pre-filled; submit calls `editTask(taskId, { title, description })`; card updates in place. Same empty-title guard.

### Delete (FR-T3)

- Card delete affordance opens `ConfirmDialog`; on confirm call `deleteTask(taskId)` (card disappears); on cancel, nothing changes (AC-013). Use an in-app dialog, not `window.confirm`, for polish (NFR-5).

### Polish (NFR-5) + responsiveness (NFR-3)

- Clear hover/focus states; tap targets ≥ 40px; forms keyboard-submittable (Enter to save, Esc to cancel).

### Design Rationale (SRP)

`TaskForm` is shared by create and edit (one validation path); `ConfirmDialog` is reusable. Cards/forms call `useBoard` actions only — no direct state or storage access (BR-004), preserving the "exactly one column / never lose a task" invariant via the T1 ops.

## Dependencies

Requires T2 (actions) and T3 (cards render inside `Column`'s list region and use its "Add task" slot).

## Interfaces Produced

- `TaskCard` (component) — `({ taskId: string }) => JSX.Element`
- `TaskForm` (component) — `({ mode: 'create' | 'edit'; columnId?: ColumnId; taskId?: string; onClose: () => void }) => JSX.Element`
- `ConfirmDialog` (component) — `({ message: string; onConfirm: () => void; onCancel: () => void }) => JSX.Element`

## Interfaces Consumed

- From T2: `useBoard` (`createTask`, `editTask`, `deleteTask`, `state.tasks`).
- From T3: `Column` "Add task" slot + card list region.

## Standalone Verifiable

Yes — RTL drives the form/dialog inside a `BoardProvider` and asserts store changes reflected in the DOM.

## Done When

- [ ] Create adds a card immediately to the target column; empty title rejected (TC-009, TC-003).
- [ ] Edit updates title/description in place (TC-010).
- [ ] Delete shows confirmation; confirm removes, cancel keeps (TC-011).
- [ ] After every op a task appears in exactly one column (AC-014).
- [ ] `tsc`/lint clean; tests green; manual polish/responsive check (TC-012, TC-013).
