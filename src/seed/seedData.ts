/**
 * Deterministic demo seed factory.
 *
 * createSeedBoard() returns a fresh BoardState on every call — distinct object
 * references so callers can mutate the result without poisoning future seeds.
 *
 * Constraints (NFR-T03 / BR-008):
 * - No Date.now(), Math.random(), crypto — stable literal ids only.
 * - Calling twice must return deeply-equal but independent objects.
 *
 * Seed layout: 8 demo-themed tasks — To Do (3) / In Progress (2) / Done (3).
 * Task descriptions are self-referential and believable for a live walkthrough.
 */
import type { BoardState, ColumnId } from '../types/board';

export function createSeedBoard(): BoardState {
  return {
    tasks: {
      // To Do (3)
      't-design-login': {
        id: 't-design-login',
        title: 'Design login screen',
        description: 'Sketch the demo sign-in with a one-click "Continue as Demo User".',
      },
      't-dark-mode': {
        id: 't-dark-mode',
        title: 'Add a dark-mode toggle',
        description: 'Optional polish: respect prefers-color-scheme plus a manual switch.',
      },
      't-demo-script': {
        id: 't-demo-script',
        title: 'Write the demo script',
        description: 'Draft the 60-second walkthrough narration for the live demo.',
      },
      // In Progress (2)
      't-dnd': {
        id: 't-dnd',
        title: 'Wire up drag & drop',
        description: 'Integrate dnd-kit sensors, the ghost preview, and the insertion placeholder.',
      },
      't-task-card': {
        id: 't-task-card',
        title: 'Build the task card',
        description: 'Title + description layout with edit and delete affordances.',
      },
      // Done (3)
      't-scaffold': {
        id: 't-scaffold',
        title: 'Scaffold React + Vite + TS',
        description: 'Project bootstrapped with Vitest and ESLint.',
      },
      't-persistence': {
        id: 't-persistence',
        title: 'Set up localStorage persistence',
        description: 'Single storage module with a versioned envelope and seed fallback.',
      },
      't-normalize': {
        id: 't-normalize',
        title: 'Define normalized board state',
        description: 'Tasks keyed by id; columns hold ordered taskIds.',
      },
    },
    columns: {
      'todo': {
        id: 'todo' as ColumnId,
        title: 'To Do',
        taskIds: ['t-design-login', 't-dark-mode', 't-demo-script'],
      },
      'in-progress': {
        id: 'in-progress' as ColumnId,
        title: 'In Progress',
        taskIds: ['t-dnd', 't-task-card'],
      },
      'done': {
        id: 'done' as ColumnId,
        title: 'Done',
        taskIds: ['t-scaffold', 't-persistence', 't-normalize'],
      },
    },
    columnOrder: ['todo', 'in-progress', 'done'],
  };
}
