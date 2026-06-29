# Suggestions — kanban-board

## Quick Wins

[S001] **Enter-key submit test coverage**: TaskForm supports `Enter` (without Shift) to
submit. The UX path is implemented but not covered by automated tests (RTL's
`userEvent.keyboard` would need explicit key-press tests). Low effort, adds
coverage for an accessibility affordance.

[S002] **Escape-key dismiss test for ConfirmDialog**: The overlay handles `Escape` to
call `onCancel`, but this is not tested. A single `userEvent.keyboard('{Escape}')`
test in TaskCard.test.tsx closes the gap.

## Future Enhancements

[S003] **Task count badge animation**: A subtle scale pulse on the column count when
it changes would give stronger "immediate feedback" (NFR-5). Can be done with a
CSS keyframe triggered by a short-lived class toggled on count change.

[S004] **Keyboard navigation within columns**: Arrow keys to move focus between cards,
Enter to open edit. Not in the spec but would improve accessibility beyond the
minimum tap-target requirement.

[S005] **Error boundary around Board**: If a persisted state ever arrives malformed,
the board could white-screen. Adding a React ErrorBoundary wrapper (already
guarded at the operation level by `assertBoardInvariants`) would let the app
gracefully fall back to seed data in the UI layer too.

## Technical Debt

[S006] **`assertBoardInvariants` is dev-only but has no guard**: It is called in
production code paths in the tests but exported without a `process.env.NODE_ENV`
guard. In production it should be a no-op (or called only in test/development
environments). Consider wrapping with an `if (import.meta.env.DEV)` guard in
`operations.ts`.

[S007] **`crypto.randomUUID()` fallback (lines 14–16 in operations.ts) is untested**:
The fallback branch is unreachable in jsdom (which ships crypto). Consider
marking it with `/* v8 ignore next */` to exclude it from coverage noise, or
testing it via a vitest mock of `crypto`.

## Questions for the Human

[S008] Does the "reset demo" button (described in `requirements.md`) belong to this
spec or to `persistence-seed`? Currently it is out of scope here. Recommend
spec-ing it in `persistence-seed` since it resets localStorage state.

[S009] Should the task description field support Markdown or Rich Text in a future
iteration? If yes, the plain `<textarea>` should be noted as a placeholder
and the type model's `description: string` field is still correct.
