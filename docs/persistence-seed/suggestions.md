# Suggestions — persistence-seed

Generated: 2026-06-28

---

## Quick Wins

**[S001]** Add a `src/storage/index.ts` barrel export once all three storage files are stable, so consumers import from `'../storage'` rather than deep paths. Low effort, high readability gain.

**[S002]** The `useAutoPersist` hook currently fires on every `state` reference change. If the drag-and-drop spec creates many rapid state updates during a drag, consider a `useDeferredValue` or a 50ms debounce — but only after profiling, since the board is small and synchronous write-through is the intentional choice (Architecture tradeoffs).

---

## Future Enhancements

**[S003]** Schema migration path: when `SCHEMA_VERSION` is bumped in a real product, a `migrate(oldData, oldVersion)` function could upgrade stored data rather than silently re-seeding. For the demo this is intentionally out of scope (FR-P4 fallback covers it), but it would be needed for a production feature.

**[S004]** Cross-tab sync: `localStorage` changes from another browser tab do not trigger React state updates. Adding a `window.addEventListener('storage', ...)` listener in `useAutoPersist` would keep multiple tabs consistent. Not needed for the demo but a nice-to-have for fidelity.

**[S005]** `resetDemo` currently returns the fresh seed. The `replaceBoard` call in `ResetDemoButton` adopts it directly. If a confirm dialog is added before reset (UX polish), the dialog component already has a pattern in `src/components/ConfirmDialog.tsx` — wire it there.

---

## Technical Debt

**[S006]** `BoardContext.tsx` now has a `REPLACE_BOARD` action that takes the entire new state. The drag-and-drop spec will also need `MOVE_TASK`. Keep an eye on the reducer growing — if a 4th action is added, consider splitting to a dedicated `boardReducer.ts` file to keep `BoardContext.tsx` under the 150-line convention limit.

**[S007]** `PersistenceSyncer` returns `null` (a valid React pattern). Some teams prefer a `<Fragment>` with no children for semantic clarity. Either is fine; pick one and document it as a project convention in the next curate cycle.

---

## Questions for the Human

**[S008]** The `demo-auth` spec will read `localStorage` for the session key (`demo-auth`). Confirm the key name — currently it is assumed to be `'demo-auth'` (separate from `'kanban-demo:board'`). If the auth spec changes this, the `STORAGE_KEYS` comment in `src/storage/keys.ts` should be updated to reflect the full key space.

**[S009]** Should `loadInitialBoard` be called inside a `useMemo` (current approach) or directly at module level (called once per import)? The `useMemo` approach is safer under React StrictMode double-invoke, but requires the `useMemo` call in `App.tsx`. Confirm this is the preferred pattern before demo-auth wraps `App`.
