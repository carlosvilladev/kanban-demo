/**
 * Namespaced localStorage keys and schema versioning for the Kanban demo.
 *
 * Bumping SCHEMA_VERSION invalidates all previously saved boards — they read
 * back as null and fall through to seed. No migration code is needed; for a
 * demo, re-seeding is the correct UX.
 *
 * Key space:
 *   kanban-demo:board   — BoardState (this feature)
 *   demo-auth           — login session (demo-auth feature, separate key)
 */
export const STORAGE_KEYS = {
  board: 'kanban-demo:board',
} as const;

export const SCHEMA_VERSION = 1;
