# Suggestions — drag-and-drop

## Quick Wins

[S001] Add a CSS `.task-card-overlay` class to `index.css` to style the ghost card more distinctly
(currently uses inline styles in `DragOverlayCard`). This would make theme changes easier.

[S002] `projectDrop` could short-circuit early when `activeId === overId` (dragging onto itself)
to avoid a no-op move dispatch and save the reducer call.

## Future Enhancements

[S003] Add a `KeyboardSensor` behind a feature flag for full keyboard DnD accessibility. The
current spec explicitly defers this (`ADR-DND-2`); the infrastructure (sensor array in `sensors.ts`)
makes it a one-line addition when required.

[S004] The `DragOverlay` drop animation duration (200 ms) is hardcoded in `BoardDndContext`.
Exposing it as a CSS custom property (`--dnd-overlay-duration`) would allow per-theme tuning.

[S005] `SortableTaskCard` omits `role="button"` from dnd-kit's attributes to avoid RTL test
interference. If keyboard DnD is added in future, restore the role and update the test wrappers
to include a `DndContext`.

## Technical Debt

[S006] The `useDragHandlers` hook is exported from `BoardDndContext.tsx` (triggering a
`react-refresh/only-export-components` suppression comment). Extracting it to its own file
(`useDragHandlers.ts`) would be cleaner.

[S007] Integration tests (`dnd.integration.test.tsx`) craft minimal dnd-kit event objects manually.
If dnd-kit ever ships official testing utilities, migrate to those for better contract coverage.

## Questions for the Human

[S008] The `DragOverlay` ghost uses an inline `rotate: '1.5deg'` style. Should this match a design
token, or is the current visual acceptable for the demo?

[S009] `closestCorners` is the chosen collision algorithm (per spec ADR-DND-2). For a real product
with many tasks per column, `closestCenter` or a custom algorithm might give more precise target
selection. Worth revisiting if the demo columns grow.
