/**
 * Unit tests for boardLifecycle — load-or-seed + reset demo.
 *
 * Covers TC-011 (first load seeds), TC-012 (saved state wins),
 * TC-013 (corrupt fallback), TC-014 (reset demo), TC-017 (end-to-end reload).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadInitialBoard, resetDemo } from '../boardLifecycle';
import { readBoard, writeBoard } from '../boardStorage';
import { createSeedBoard } from '../../seed/seedData';
import { STORAGE_KEYS } from '../keys';
import type { BoardState } from '../../types/board';

beforeEach(() => {
  localStorage.clear();
});

// ─── TC-011: First load seeds and persists ────────────────────────────────────

describe('loadInitialBoard — empty storage', () => {
  it('TC-011: returns source=seeded when no saved state', () => {
    const result = loadInitialBoard();
    expect(result.source).toBe('seeded');
  });

  it('TC-011: seeded state equals createSeedBoard()', () => {
    const result = loadInitialBoard();
    expect(result.state).toEqual(createSeedBoard());
  });

  it('TC-011: seed is persisted after first load (readBoard returns it)', () => {
    loadInitialBoard();
    expect(readBoard()).toEqual(createSeedBoard());
  });
});

// ─── TC-012: Saved state wins over seed ──────────────────────────────────────

describe('loadInitialBoard — valid saved state', () => {
  it('TC-012: returns source=restored', () => {
    // A valid board that differs from the seed (single task in done only)
    const saved: BoardState = {
      tasks: { 't-x': { id: 't-x', title: 'Kept', description: 'User kept task.' } },
      columns: {
        'todo': { id: 'todo', title: 'To Do', taskIds: [] },
        'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
        'done': { id: 'done', title: 'Done', taskIds: ['t-x'] },
      },
      columnOrder: ['todo', 'in-progress', 'done'],
    };
    writeBoard(saved);
    const result = loadInitialBoard();
    expect(result.source).toBe('restored');
  });

  it('TC-012: restored state matches what was saved', () => {
    const saved: BoardState = {
      tasks: { 't-x': { id: 't-x', title: 'Kept', description: 'User kept task.' } },
      columns: {
        'todo': { id: 'todo', title: 'To Do', taskIds: [] },
        'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
        'done': { id: 'done', title: 'Done', taskIds: ['t-x'] },
      },
      columnOrder: ['todo', 'in-progress', 'done'],
    };
    writeBoard(saved);
    const result = loadInitialBoard();
    expect(result.state).toEqual(saved);
  });

  it('TC-012: seed is NOT applied when valid state exists', () => {
    // Write a board with 0 todo tasks (differs from the 3-task seed)
    const modified: BoardState = {
      tasks: { 't-scaffold': { id: 't-scaffold', title: 'Scaffold', description: 'Done already.' } },
      columns: {
        'todo': { id: 'todo', title: 'To Do', taskIds: [] },
        'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
        'done': { id: 'done', title: 'Done', taskIds: ['t-scaffold'] },
      },
      columnOrder: ['todo', 'in-progress', 'done'],
    };
    writeBoard(modified);
    const result = loadInitialBoard();
    expect(result.source).toBe('restored');
    expect(result.state.columns['todo'].taskIds).toHaveLength(0);
  });
});

// ─── TC-013: Corrupt load falls back to seed ──────────────────────────────────

describe('loadInitialBoard — corrupt storage', () => {
  it('TC-013: returns source=seeded on bad JSON', () => {
    localStorage.setItem(STORAGE_KEYS.board, '{not json');
    const result = loadInitialBoard();
    expect(result.source).toBe('seeded');
    expect(result.state).toEqual(createSeedBoard());
  });

  it('TC-013: returns source=seeded on version mismatch', () => {
    const envelope = { version: 999, data: createSeedBoard() };
    localStorage.setItem(STORAGE_KEYS.board, JSON.stringify(envelope));
    const result = loadInitialBoard();
    expect(result.source).toBe('seeded');
  });

  it('TC-013: never throws', () => {
    localStorage.setItem(STORAGE_KEYS.board, 'null');
    expect(() => loadInitialBoard()).not.toThrow();
  });

  it('TC-013: returned state is non-empty', () => {
    localStorage.setItem(STORAGE_KEYS.board, '{not json');
    const result = loadInitialBoard();
    expect(Object.keys(result.state.tasks).length).toBeGreaterThan(0);
  });
});

// ─── TC-014: Reset demo ────────────────────────────────────────────────────────

describe('resetDemo', () => {
  it('TC-014: returns a fresh seed deep-equal to createSeedBoard()', () => {
    const result = resetDemo();
    expect(result).toEqual(createSeedBoard());
  });

  it('TC-014: overwrites modified saved state with fresh seed', () => {
    const modified: BoardState = {
      tasks: { 't-custom': { id: 't-custom', title: 'Custom', description: 'User added.' } },
      columns: {
        'todo': { id: 'todo', title: 'To Do', taskIds: ['t-custom'] },
        'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
        'done': { id: 'done', title: 'Done', taskIds: [] },
      },
      columnOrder: ['todo', 'in-progress', 'done'],
    };
    writeBoard(modified);
    expect(readBoard()).toEqual(modified); // confirm saved

    resetDemo();

    // After reset, localStorage holds the seed
    expect(readBoard()).toEqual(createSeedBoard());
  });

  it('TC-014: storage holds the seed after reset', () => {
    resetDemo();
    expect(readBoard()).toEqual(createSeedBoard());
  });
});

// ─── TC-017: Reload simulation end-to-end ────────────────────────────────────

describe('TC-017: reload simulation', () => {
  it('restored state equals the mutated state after seed → mutate → write → reload', () => {
    // Start: first load seeds
    const initial = loadInitialBoard();
    expect(initial.source).toBe('seeded');

    // Simulate user adding a task (mutate in-memory, write to storage)
    const mutated: BoardState = {
      ...initial.state,
      tasks: {
        ...initial.state.tasks,
        'user-task': { id: 'user-task', title: 'My Task', description: 'User added.' },
      },
      columns: {
        ...initial.state.columns,
        'todo': {
          ...initial.state.columns['todo'],
          taskIds: [...initial.state.columns['todo'].taskIds, 'user-task'],
        },
      },
    };
    writeBoard(mutated);

    // Fresh "session" — load again
    const reloaded = loadInitialBoard();
    expect(reloaded.source).toBe('restored');
    expect(reloaded.state).toEqual(mutated);
  });
});
