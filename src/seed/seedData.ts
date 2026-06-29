/**
 * createSeedBoard — deterministic demo board factory.
 *
 * Design rules:
 *   - No Date.now(), Math.random(), or crypto — stable literal ids only (NFR-T03).
 *   - Returns a fresh deep copy on every call so callers may mutate freely (TC-010).
 *   - 3 fixed columns (To Do / In Progress / Done) with 8 demo-themed tasks (3/2/3).
 *   - Tasks have NO columnId — membership is encoded in SEED_COLUMNS.taskIds only.
 */

import type { BoardState, Column, Task } from '../types/board'

// ─── Fixed seed data ──────────────────────────────────────────────────────────

// Column definitions — order is the canonical rendering order.
const SEED_COLUMNS: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    taskIds: ['t-design-login', 't-dark-mode', 't-demo-script'],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    taskIds: ['t-dnd', 't-task-card'],
  },
  {
    id: 'done',
    title: 'Done',
    taskIds: ['t-scaffold', 't-persistence', 't-normalize'],
  },
]

// Task definitions — see spec DD-2 for the canonical list and descriptions.
// No columnId field: membership is encoded in SEED_COLUMNS.taskIds above.
const SEED_TASKS: Task[] = [
  {
    id: 't-design-login',
    title: 'Design login screen',
    description: 'Sketch the demo sign-in with a one-click "Continue as Demo User".',
  },
  {
    id: 't-dark-mode',
    title: 'Add a dark-mode toggle',
    description: 'Optional polish: respect `prefers-color-scheme` plus a manual switch.',
  },
  {
    id: 't-demo-script',
    title: 'Write the demo script',
    description: 'Draft the 60-second walkthrough narration for the live demo.',
  },
  {
    id: 't-dnd',
    title: 'Wire up drag & drop',
    description: 'Integrate dnd-kit sensors, the ghost preview, and the insertion placeholder.',
  },
  {
    id: 't-task-card',
    title: 'Build the task card',
    description: 'Title + description layout with edit and delete affordances.',
  },
  {
    id: 't-scaffold',
    title: 'Scaffold React + Vite + TS',
    description: 'Project bootstrapped with Vitest and ESLint.',
  },
  {
    id: 't-persistence',
    title: 'Set up localStorage persistence',
    description: 'Single storage module with a versioned envelope and seed fallback.',
  },
  {
    id: 't-normalize',
    title: 'Define normalized board state',
    description: 'Tasks keyed by id; columns hold ordered taskIds.',
  },
]

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Returns a fresh, normalized BoardState pre-populated with the demo seed data.
 * Each call returns independent object references — mutating one result does not
 * affect the next call.
 */
export function createSeedBoard(): BoardState {
  return {
    columnOrder: SEED_COLUMNS.map(c => c.id),
    columns: Object.fromEntries(
      SEED_COLUMNS.map(c => [c.id, { ...c, taskIds: [...c.taskIds] }]),
    ) as Record<'todo' | 'in-progress' | 'done', Column>,
    tasks: Object.fromEntries(
      SEED_TASKS.map(t => [t.id, { ...t }]),
    ),
  }
}
