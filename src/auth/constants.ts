/**
 * Demo auth constants.
 *
 * SESSION_KEY is intentionally distinct from the board-data key
 * ('kanban-demo:board') so that clearSession() can never accidentally
 * touch board data.
 */
import type { DemoUser } from './types';

export const SESSION_KEY = 'kanban.session';
export const SESSION_VERSION = 1;

export const DEMO_USER: DemoUser = {
  id: 'demo-user',
  name: 'Demo User',
  /** Initials — rendered locally, no remote fetch. */
  avatar: 'DU',
};

export const DEMO_CREDENTIALS = {
  username: 'demo',
  password: 'demo',
} as const;
