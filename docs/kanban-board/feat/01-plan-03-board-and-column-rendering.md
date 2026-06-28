# T3: Board and column rendering

## Scope

- `src/components/Board.tsx` - New. Renders the three columns in `columnOrder`.
- `src/components/Column.tsx` - New. Column header (title + count) and its ordered card list region.
- `src/components/Board.test.tsx` - New. RTL tests for order, titles, counts.

## Changes

### Board (`src/components/Board.tsx`)

- Reads `state.columnOrder` from `useBoard` and renders a `Column` per id (always exactly three, fixed order — BR-001/BR-002).
- Responsive layout (NFR-3): horizontal columns on desktop; stack or horizontal-scroll at ~320px without breaking. Touch-friendly spacing.

### Column (`src/components/Column.tsx`)

- Header shows the column `title` and a count from `selectColumnTaskCount(id)` (BR-003) — count is derived from the store, so it updates immediately on any CRUD.
- Renders `selectTasksForColumn(id)` in order as `TaskCard`s (cards themselves come from T4; T3 renders the list region + an empty-but-styled state for count 0).
- Exposes a per-column "Add task" affordance slot wired in T4.

### Design Rationale (SRP / presentational split)

Board owns layout/order; Column owns header + list. Both read only from `useBoard`, never from storage (BR-004). Keeping cards in T4 lets this task verify structure (columns, order, counts) independently of CRUD UI.

## Dependencies

Requires T2 — consumes `useBoard` for `columnOrder`, selectors, and counts.

## Interfaces Produced

- `Board` (component) — `() => JSX.Element`
- `Column` (component) — `({ columnId: ColumnId }) => JSX.Element`

## Interfaces Consumed

- From T2: `useBoard` (state, `selectColumnTaskCount`, `selectTasksForColumn`).

## Standalone Verifiable

Yes — render `Board` inside a `BoardProvider` with a fixture state and assert columns/order/counts. (Card-level CRUD assertions belong to T4.)

## Done When

- [ ] Board renders exactly three columns in order To Do → In Progress → Done (TC-008).
- [ ] Each header shows title + correct count from the store (TC-008).
- [ ] Empty columns render a styled empty region, never blank/broken (AC-004).
- [ ] Layout usable at 320px and desktop (manual TC-012).
- [ ] `tsc`/lint clean; tests green.
