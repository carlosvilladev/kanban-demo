# T4: Auto-persist hook + Reset demo binding

## Scope

- `src/storage/useAutoPersist.ts` - New. React hook that write-through-persists board state on every change (FR-P2). Re-exports `resetDemo` binding for the app shell.
- `src/storage/__tests__/useAutoPersist.test.tsx` - New. Hook tests via `@testing-library/react` `renderHook`.

## Changes

### useAutoPersist

- `useAutoPersist(state: BoardState): void` — `useEffect(() => { writeBoard(state); }, [state])`. Persists on every change to the board source of truth; there is no manual save (FR-P2). Relies on `writeBoard` already swallowing storage errors (T1) so the effect never throws.
- Note: the board provider (owned by `kanban-board`) holds `state` via reducer/`useState` and initializes it from `loadInitialBoard().state` (T3). This hook only observes and persists — it does not own state.

### Reset demo binding

- This feature exposes `resetDemo` (from T3) for the app shell / board header control. The button's placement and styling are owned by `kanban-board`; here we document the seam: on click → `const fresh = resetDemo(); dispatch(replaceBoard(fresh))` so the UI adopts the fresh seed (DD-4). No new file needed beyond re-exporting `resetDemo` from the storage barrel if one exists.

### Design Rationale (observer seam)

Splitting "own state" (board provider) from "persist state" (this hook) keeps persistence decoupled from the reducer — the board feature can evolve its state logic without touching storage, and FR-P2 is verified independently of the UI.

## Dependencies

Requires **T3** (and T1's `writeBoard`). Integration consumer is the `kanban-board` board provider (cross-feature seam — defer that gate to integration).

## Done When

- [ ] `useAutoPersist` exported from `src/storage/useAutoPersist.ts`.
- [ ] Changing the `state` argument triggers `writeBoard` with the new value (TC-015).
- [ ] A throwing storage during a state change does not surface an error to React (TC-016 via T1).
- [ ] `npm run test`, `tsc`, `npm run lint` clean.

## Interfaces Produced

- `{ name: "useAutoPersist", signature: "(state: BoardState): void", kind: "function" }`

## Standalone Verifiable

Partial — the hook is unit-testable in isolation (`renderHook` + spy on `writeBoard`). The Reset demo **button wiring** depends on `kanban-board`'s provider; Guardian should defer that end-to-end gate until the board feature exists.
