# T2: Demo seed factory

## Scope

- `src/seed/seedData.ts` - New. `createSeedBoard(): BoardState` — the deterministic demo board.
- `src/seed/__tests__/seedData.test.ts` - New. Unit tests for shape, content, distribution, and determinism.

## Changes

### Seed factory

- `createSeedBoard(): BoardState` returns a fresh, normalized board on every call.
- Three fixed columns in order: `todo` "To Do", `in-progress` "In Progress", `done` "Done"; `columnOrder = ['todo','in-progress','done']` (DD-2).
- Stable literal task ids (e.g. `t-design-login`) — **no** `Date.now()`, `Math.random()`, or `crypto` (BR-008 / NFR-T03), so the "original seed" is reproducible for Reset demo and tests.
- Return a **deep copy** each call (build fresh objects/arrays) so callers can mutate the result without poisoning future seeds.
- Seed task set (≥6 tasks, ≥1 per column; demo-themed and "lived-in"):

  | id | column | title | description |
  |----|--------|-------|-------------|
  | `t-design-login` | todo | Design login screen | Sketch the demo sign-in with a one-click "Continue as Demo User". |
  | `t-dark-mode` | todo | Add a dark-mode toggle | Optional polish: respect `prefers-color-scheme` plus a manual switch. |
  | `t-demo-script` | todo | Write the demo script | Draft the 60-second walkthrough narration for the live demo. |
  | `t-dnd` | in-progress | Wire up drag & drop | Integrate dnd-kit sensors, the ghost preview, and the insertion placeholder. |
  | `t-task-card` | in-progress | Build the task card | Title + description layout with edit and delete affordances. |
  | `t-scaffold` | done | Scaffold React + Vite + TS | Project bootstrapped with Vitest and ESLint. |
  | `t-persistence` | done | Set up localStorage persistence | Single storage module with a versioned envelope and seed fallback. |
  | `t-normalize` | done | Define normalized board state | Tasks keyed by id; columns hold ordered `taskIds`. |

- Each `Task` carries `columnId` matching the column whose `taskIds` lists it (consistency for the validator in T1).

### Design Rationale (purity + determinism)

A pure, side-effect-free factory makes both first-run seeding and Reset demo trivially correct and testable; determinism is what lets Reset demo restore a well-defined "original" (DD-4).

## Dependencies

None within this feature. Consumes the `BoardState` type (see T1 / `kanban-board`).

## Done When

- [ ] `createSeedBoard` exported from `src/seed/seedData.ts`.
- [ ] Columns are To Do / In Progress / Done in order; ≥6 tasks; ≥1 per column (TC-008).
- [ ] Every task has non-empty `title` and `description` and appears in exactly one column (TC-009, TC-007 cross-check).
- [ ] Two calls return deeply-equal but **distinct** object references (TC-010).
- [ ] `isValidBoardState(createSeedBoard())` is `true`.
- [ ] `npm run test`, `tsc`, `npm run lint` clean.

## Interfaces Produced

- `{ name: "createSeedBoard", signature: "(): BoardState", kind: "function" }`

## Standalone Verifiable

Yes — pure function, no storage or React. Unit-testable in full isolation.
