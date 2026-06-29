/**
 * boardStorage — the single localStorage gateway for board data.
 *
 * Only this module calls the localStorage Web API (NFR-T01).
 * All other code uses the exported functions below.
 */

import type { BoardState } from '../types/board'
import { SCHEMA_VERSION, STORAGE_KEYS } from './keys'

// ─── Persistence envelope ────────────────────────────────────────────────────

interface StorageEnvelope {
  version: number
  data: BoardState
}

// ─── Validation guard ────────────────────────────────────────────────────────

/**
 * Structural + referential guard for BoardState.
 *
 * Returns true only when:
 *   - `columns` is a record of well-formed Column objects
 *   - `columnOrder` is a string[] whose ids all exist in `columns`
 *   - `tasks` is a record of well-formed Task objects
 *   - every taskId in any column exists in `tasks`
 *   - every task in `tasks` appears in **exactly one** column's taskIds
 *     (invariant-1 / BR-011: a task belongs to exactly one column)
 */
export function isValidBoardState(value: unknown): value is BoardState {
  if (typeof value !== 'object' || value === null) return false

  const board = value as Record<string, unknown>

  // ── columnOrder must be a string[] ───────────────────────────────────
  if (!Array.isArray(board.columnOrder)) return false
  const columnOrder = board.columnOrder as unknown[]

  // ── columns must be a non-null object ────────────────────────────────
  if (typeof board.columns !== 'object' || board.columns === null) return false
  const columns = board.columns as Record<string, unknown>

  // ── tasks must be a non-null object ──────────────────────────────────
  if (typeof board.tasks !== 'object' || board.tasks === null) return false
  const tasks = board.tasks as Record<string, unknown>

  // ── every columnOrder id must exist in columns ────────────────────────
  for (const id of columnOrder) {
    if (typeof id !== 'string') return false
    if (!(id in columns)) return false
  }

  // ── validate each column and tally task appearances ──────────────────
  const taskAppearanceCount: Record<string, number> = {}

  for (const colId of Object.keys(columns)) {
    const colValue = columns[colId]
    if (typeof colValue !== 'object' || colValue === null) return false
    const col = colValue as Record<string, unknown>

    if (typeof col.id !== 'string') return false
    if (typeof col.title !== 'string') return false

    const taskIds = col.taskIds
    if (!Array.isArray(taskIds)) return false

    for (const taskId of taskIds) {
      if (typeof taskId !== 'string') return false
      if (!(taskId in tasks)) return false
      taskAppearanceCount[taskId] = (taskAppearanceCount[taskId] ?? 0) + 1
    }
  }

  // ── validate each task and check appearance count ────────────────────
  for (const taskId of Object.keys(tasks)) {
    const taskValue = tasks[taskId]
    if (typeof taskValue !== 'object' || taskValue === null) return false
    const task = taskValue as Record<string, unknown>

    if (typeof task.id !== 'string') return false
    if (typeof task.title !== 'string') return false
    if (typeof task.description !== 'string') return false

    // Every task must appear in exactly one column (not zero, not two+)
    const appearances = taskAppearanceCount[taskId] ?? 0
    if (appearances !== 1) return false
  }

  return true
}

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Returns the saved BoardState, or null when there is no usable state.
 * Never throws. Returns null when:
 *   - key absent
 *   - JSON parse fails
 *   - stored version !== SCHEMA_VERSION
 *   - isValidBoardState returns false
 */
export function readBoard(): BoardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.board)
    if (raw === null) return null

    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return null

    const envelope = parsed as Record<string, unknown>
    if (envelope.version !== SCHEMA_VERSION) return null

    if (!isValidBoardState(envelope.data)) return null

    return envelope.data
  } catch {
    return null
  }
}

// ─── Write ───────────────────────────────────────────────────────────────────

/**
 * Persists state as { version: SCHEMA_VERSION, data: state } at STORAGE_KEYS.board.
 * Swallows any storage error (quota / private mode) — NFR-T04.
 */
export function writeBoard(state: BoardState): void {
  try {
    const envelope: StorageEnvelope = {
      version: SCHEMA_VERSION,
      data: state,
    }
    localStorage.setItem(STORAGE_KEYS.board, JSON.stringify(envelope))
  } catch {
    // Swallow storage errors (quota / private mode) so the app never crashes (NFR-T04)
  }
}

// ─── Clear ───────────────────────────────────────────────────────────────────

/**
 * Removes the board key from localStorage.
 * Swallows any storage error.
 */
export function clearBoard(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.board)
  } catch {
    // Swallow storage errors
  }
}
