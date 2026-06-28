# T1: Storage module — the single localStorage gateway

## Scope

- `src/types/board.ts` - **May already exist (owned by `kanban-board`).** If absent, create the minimal shared `BoardState` / `Column` / `Task` / `ColumnId` contract used below; reconcile with `kanban-board` when it lands.
- `src/storage/keys.ts` - New. Exports the namespaced storage key and schema version.
- `src/storage/boardStorage.ts` - New. The only module that touches the `localStorage` Web API for board data: `readBoard`, `writeBoard`, `clearBoard`, `isValidBoardState`.
- `src/storage/__tests__/boardStorage.test.ts` - New. Unit tests for round-trip, envelope shape, and every corrupt-input fallback.

## Changes

### Keys & versioning

- `STORAGE_KEYS = { board: 'kanban-demo:board' } as const`.
- `SCHEMA_VERSION = 1` (number). Bumping it intentionally invalidates old saves (they read back as `null` → seed). No migration code — out of scope for the demo.

### Persistence primitives

- `writeBoard(state: BoardState): void` — wraps state in `{ version: SCHEMA_VERSION, data: state }`, `JSON.stringify`, `localStorage.setItem`. Wrap the write in try/catch so a throwing/quota-limited storage (private mode) never propagates an exception (NFR-T04).
- `readBoard(): BoardState | null` — returns the saved board, or `null` when there is no usable state. Returns `null` (never throws) when: key absent · `JSON.parse` throws · parsed `version !== SCHEMA_VERSION` · `isValidBoardState(parsed.data)` is false.
- `clearBoard(): void` — `localStorage.removeItem(STORAGE_KEYS.board)` inside try/catch.
- `isValidBoardState(value: unknown): value is BoardState` — structural + referential guard: `columns` is a record, `columnOrder` is `string[]` whose ids all exist in `columns`, `tasks` is a record, every `taskId` listed in any column exists in `tasks`, and every task appears in **exactly one** column's `taskIds` (protects invariant-1 / BR-011).

### Design Rationale (SRP + single source of truth)

This is the only place the `localStorage` API is referenced (BR-005 / NFR-T01). Components and the board provider depend on these functions, never on the Web API, which keeps the corrupt-fallback logic in one testable place.

## Dependencies

None within this feature. Consumes the `BoardState` type from `kanban-board` (see Scope note).

## Done When

- [ ] `readBoard`/`writeBoard`/`clearBoard`/`isValidBoardState` exported from `src/storage/boardStorage.ts`; key + `SCHEMA_VERSION` from `src/storage/keys.ts`.
- [ ] `writeBoard` then `readBoard` round-trips a board deep-equal to the original (TC-001).
- [ ] Raw stored value is the `{ version, data }` envelope at `kanban-demo:board` (TC-002).
- [ ] `readBoard` returns `null` for: missing key, bad JSON, wrong version, invalid shape (TC-003–006).
- [ ] `isValidBoardState` accepts well-formed boards and rejects dangling refs / duplicated tasks (TC-007).
- [ ] A throwing `localStorage.setItem` does not propagate (TC-016).
- [ ] `npm run test`, `tsc`, and `npm run lint` are clean.

## Interfaces Produced

- `{ name: "STORAGE_KEYS", signature: "{ board: 'kanban-demo:board' }", kind: "export" }`
- `{ name: "SCHEMA_VERSION", signature: "number", kind: "export" }`
- `{ name: "readBoard", signature: "(): BoardState | null", kind: "function" }`
- `{ name: "writeBoard", signature: "(state: BoardState): void", kind: "function" }`
- `{ name: "clearBoard", signature: "(): void", kind: "function" }`
- `{ name: "isValidBoardState", signature: "(value: unknown): value is BoardState", kind: "function" }`
- `{ name: "BoardState", signature: "{ columns; columnOrder; tasks }", kind: "type" }` (only if `src/types/board.ts` is created here)

## Standalone Verifiable

Yes — pure functions over a jsdom/`happy-dom` `localStorage`. Fully unit-testable in isolation.
