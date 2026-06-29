/**
 * Session storage helper — the single gateway for auth persistence.
 *
 * All reads and writes for the demo session go through this module;
 * components and hooks never touch localStorage directly.
 *
 * Key: SESSION_KEY ('kanban.session')
 * Distinct from: 'kanban-demo:board' (owned by persistence-seed).
 * Invariant: clearSession() removes ONLY SESSION_KEY — board data is never touched.
 */
import type { DemoUser, Session } from './types';
import { SESSION_KEY, SESSION_VERSION } from './constants';

/**
 * Read and validate the stored session.
 *
 * Returns null when:
 *  - nothing is stored
 *  - the value is not valid JSON
 *  - the shape is invalid (missing user.id)
 *  - the version does not match SESSION_VERSION
 *  - localStorage itself throws
 *
 * Never throws.
 */
export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);

    if (!isSession(parsed)) return null;

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Write a new session for the given user.
 *
 * Returns the Session that was persisted.
 */
export function writeSession(user: DemoUser): Session {
  const session: Session = {
    user,
    createdAt: Date.now(),
    version: SESSION_VERSION,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/**
 * Remove the session.
 *
 * Touches ONLY SESSION_KEY — board data at 'kanban-demo:board' is untouched.
 * Safe to call even when no session exists.
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ---------------------------------------------------------------------------
// Internal validator
// ---------------------------------------------------------------------------

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false;

  const v = value as Record<string, unknown>;

  if (v['version'] !== SESSION_VERSION) return false;
  if (typeof v['createdAt'] !== 'number') return false;

  const user = v['user'];
  if (typeof user !== 'object' || user === null) return false;

  const u = user as Record<string, unknown>;
  if (typeof u['id'] !== 'string') return false;
  if (typeof u['name'] !== 'string') return false;
  if (typeof u['avatar'] !== 'string') return false;

  return true;
}
