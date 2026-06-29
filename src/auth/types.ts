/**
 * Auth domain types for the Kanban demo.
 *
 * DemoUser — the single demo persona shown throughout the app.
 * Session   — persisted to localStorage under SESSION_KEY; a missing or
 *             corrupt entry is treated as logged-out (never throws).
 */

export interface DemoUser {
  id: string;
  name: string;
  /** Initials rendered locally as an avatar — no remote fetch. */
  avatar: string;
}

export interface Session {
  user: DemoUser;
  createdAt: number;
  version: number;
}
