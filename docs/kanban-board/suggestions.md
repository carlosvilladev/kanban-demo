# kanban-board — Suggestions

## Quick Wins

[S001] **Reset Demo button** — `resetDemo()` is already exported from `useAutoPersist.ts`.
Adding a "Reset demo" button requires dispatching a `REPLACE_BOARD` action (one new reducer
case + one button in AppContent). Estimated: ~20 lines, zero new dependencies.

[S002] **Task description trim** — `TaskForm` trims the description on submit. Consider also
trimming in `updateTask` / `createTask` in operations.ts for belt-and-suspenders hygiene
(currently only title is trimmed in the pure ops layer).

[S003] **Column header aria-level** — The `<h2>` inside each Column is semantically correct
but the page has no `<h1>`. App.tsx could add a visually-hidden `<h1>Kanban Demo</h1>` for
accessibility tree completeness.

## Future Enhancements

[S004] **Drag-and-drop** — `MOVE_TASK` action slot is already reserved in `boardReducer` (see
the comment in BoardContext.tsx). The drag-and-drop spec picks up exactly from that slot; no
type changes needed.

[S005] **Inline task counter animation** — a CSS transition on the count badge
(`data-testid="count-*"`) would give the board more visual life during demo walkthroughs.

[S006] **Keyboard shortcut to add task** — `N` key (focused on column) to open TaskForm would
improve demo flow without requiring a dependency.

## Technical Debt

[S007] **Inline styles** — All components use inline style objects for demo simplicity.
A follow-up pass with CSS modules or a utility library (e.g. Tailwind classes) would make the
styling composable and themeable. Not needed for the demo.

[S008] **`selectTasksForColumn` re-creates array on every render** — Because it maps inside
`useBoard()`, consumers that call `selectTasksForColumn` will always receive a new array
reference even if the tasks are unchanged. A `useMemo` wrapper or memoized selector would
prevent unnecessary re-renders at scale.

## Questions for the Human

[S009] Should the "Add task" form in Column appear above the existing task list (prepend) or
below it (current: append)? The spec says "bottom" (append) — confirming this is intentional.

[S010] Should the ConfirmDialog be a full-screen modal overlay or an inline replacement of the
card (current)? Inline is cheaper but a modal overlay is more standard UX.
