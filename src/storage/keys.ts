/** Namespaced localStorage key for the board state envelope */
export const STORAGE_KEYS = {
  board: 'kanban-demo:board',
} as const

/**
 * Envelope schema version.
 * Bumping this number intentionally invalidates old saves (they read back as null → seed).
 * No migration code — out of scope for the demo.
 */
export const SCHEMA_VERSION = 1
