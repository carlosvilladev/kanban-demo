/**
 * Single localStorage gateway for Kanban board state.
 *
 * This is the ONLY module in the codebase that calls the localStorage Web API
 * for board data (NFR-T01). All other code uses the exported functions below.
 *
 * Persisted envelope:  { version: number; data: BoardState }
 * Key:                 STORAGE_KEYS.board ('kanban-demo:board')
 *
 * On any failure (missing key, corrupt JSON, version mismatch, invalid shape):
 * readBoard returns null — callers are expected to seed.
 *
 * On write failure (quota exceeded, private-mode browser):
 * writeBoard / clearBoard swallow the error so the app never crashes (NFR-T04).
 */
import type { BoardState, ColumnId } from '../types/board';
import { STORAGE_KEYS, SCHEMA_VERSION } from './keys';

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Structural + referential guard for a BoardState value.
 *
 * Returns true only when:
 * - tasks, columns, columnOrder all present with correct shapes
 * - every columnOrder entry exists in columns
 * - every taskId in any column's taskIds exists in tasks
 * - every task in tasks appears in exactly one column's taskIds (BR-011)
 */
export function isValidBoardState(value: unknown): value is BoardState {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  // Top-level shape
  if (
    typeof obj['tasks'] !== 'object' || obj['tasks'] === null ||
    typeof obj['columns'] !== 'object' || obj['columns'] === null ||
    !Array.isArray(obj['columnOrder'])
  ) {
    return false;
  }

  const tasks = obj['tasks'] as Record<string, unknown>;
  const columns = obj['columns'] as Record<string, unknown>;
  const columnOrder = obj['columnOrder'] as unknown[];

  // columnOrder entries must all be strings present in columns
  for (const colId of columnOrder) {
    if (typeof colId !== 'string') return false;
    if (!(colId in columns)) return false;
  }

  // Track how many times each taskId appears across all column taskIds
  const taskAppearances = new Map<string, number>();

  for (const colId of columnOrder) {
    const col = columns[colId as ColumnId] as Record<string, unknown> | null;
    if (!col || !Array.isArray(col['taskIds'])) return false;

    for (const taskId of col['taskIds'] as unknown[]) {
      if (typeof taskId !== 'string') return false;
      // taskId must exist in tasks
      if (!(taskId in tasks)) return false;
      taskAppearances.set(taskId, (taskAppearances.get(taskId) ?? 0) + 1);
    }
  }

  // Every task in the tasks map must appear exactly once across all columns
  for (const taskId of Object.keys(tasks)) {
    if ((taskAppearances.get(taskId) ?? 0) !== 1) return false;
  }

  return true;
}

// ─── Persistence primitives ──────────────────────────────────────────────────

/**
 * Persists the board wrapped in a versioned envelope.
 * Storage errors are swallowed (NFR-T04) — the app must never crash on write.
 */
export function writeBoard(state: BoardState): void {
  try {
    const envelope = { version: SCHEMA_VERSION, data: state };
    localStorage.setItem(STORAGE_KEYS.board, JSON.stringify(envelope));
  } catch {
    // Quota exceeded or storage unavailable — degrade silently
  }
}

/**
 * Reads and validates the persisted board.
 * Returns null when: key absent · JSON invalid · version mismatch · shape invalid.
 * Never throws.
 */
export function readBoard(): BoardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.board);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const envelope = parsed as Record<string, unknown>;
    if (envelope['version'] !== SCHEMA_VERSION) return null;

    const data: unknown = envelope['data'];
    if (!isValidBoardState(data)) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * Removes the board key from localStorage.
 * Errors are swallowed (NFR-T04).
 */
export function clearBoard(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.board);
  } catch {
    // Degrade silently
  }
}
