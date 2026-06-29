# Suggestions — persistence-seed

Generated: 2026-06-29

---

## Quick Wins

**[S001] TC-017 integration test (deferred — needs kanban-board)**
Spec TC-017 ("reload simulation end-to-end") is deferred because the board
provider/reducer (kanban-board) doesn't exist yet. When that feature lands,
add an integration test in `src/storage/__tests__/integration.test.ts` that
exercises seed → mutate via reducer → write → fresh `loadInitialBoard` →
verify restored equals the mutated state.

**[S002] Coverage config: exclude scaffold stubs from reports**
`App.tsx` and `main.tsx` dilute the overall statement/function metrics with
zeros because they're empty stubs. Add `coverage.exclude` in `vite.config.ts`
to limit reporting to `src/storage/**` and `src/seed/**` so the dashboard
reflects only the spec-owned modules.

---

## Future Enhancements

**[S003] Storage barrel export (`src/storage/index.ts`)**
Consider adding `src/storage/index.ts` that re-exports the public API
(`loadInitialBoard`, `resetDemo`, `useAutoPersist`, `writeBoard`,
`readBoard`, `clearBoard`). The board provider and app shell currently need
to know the internal file names. A barrel makes the consumer-facing API
explicit and easy to rearrange internally.

**[S004] `@vitest/coverage-v8` version pinning**
`@vitest/coverage-v8@2.1.9` was installed manually because `^2.1.9` (matching
vitest) failed to resolve under npm 11's stricter peer-dep validation. Pin the
version in package.json and consider adding a comment noting the coupling.

**[S005] Version-bump migration hook (demo scope note)**
The current design invalidates old saves on schema version bump (SCHEMA_VERSION
constant). For a real app this would need a migration path. The assumption is
explicitly documented in `status.yaml` — ensure it survives into architecture
notes when the board feature ships.

---

## Technical Debt

**[S006] `src/types/board.ts` is interim**
The `BoardState` / `Column` / `Task` / `ColumnId` types here are stubs to
be reconciled with `kanban-board`'s canonical type file when that feature
lands. At reconciliation, ensure field names, optionality, and `ColumnId`
shape stay aligned — especially `taskIds: string[]` vs. possible `string[]`
generics and `columnId` on `Task`.

---

## Questions for the Human

**[S007] Should `useAutoPersist` call `writeBoard` on the initial mount?**
Currently the hook's `useEffect([state])` fires once on mount, persisting
the initial state immediately. This is by spec (lazy vs. eager seeding tradeoff
in the SDD). But React 18 StrictMode fires effects twice in development — if
the board provider is wrapped in StrictMode, `writeBoard` is called twice on
startup. This is harmless (idempotent write) but noisy. Confirm this is
acceptable for the demo, or add a `useRef` first-render guard.

**[S008] Trust level checkpoint: T1–T4 are all done. Proceed to `/nybo-verify`?**
All 4 tasks are implemented, 52 tests pass, 100% branch coverage on spec-owned
modules, lint and build are clean. Ready for your review before verify/curate/ship.
