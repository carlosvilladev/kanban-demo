/**
 * Unit tests for createSeedBoard — deterministic demo seed factory.
 *
 * Covers TC-008 (shape), TC-009 (content), TC-010 (determinism).
 * Also cross-checks that isValidBoardState accepts the seed.
 */
import { describe, it, expect } from 'vitest';
import { createSeedBoard } from '../seedData';
import { isValidBoardState } from '../../storage/boardStorage';

// ─── TC-008: Seed shape and distribution ─────────────────────────────────────

describe('createSeedBoard — shape', () => {
  it('TC-008: columnOrder is exactly [todo, in-progress, done]', () => {
    const seed = createSeedBoard();
    expect(seed.columnOrder).toEqual(['todo', 'in-progress', 'done']);
  });

  it('TC-008: columns have correct titles', () => {
    const seed = createSeedBoard();
    expect(seed.columns['todo'].title).toBe('To Do');
    expect(seed.columns['in-progress'].title).toBe('In Progress');
    expect(seed.columns['done'].title).toBe('Done');
  });

  it('TC-008: has at least 6 tasks total', () => {
    const seed = createSeedBoard();
    expect(Object.keys(seed.tasks).length).toBeGreaterThanOrEqual(6);
  });

  it('TC-008: each column has at least 1 task', () => {
    const seed = createSeedBoard();
    expect(seed.columns['todo'].taskIds.length).toBeGreaterThanOrEqual(1);
    expect(seed.columns['in-progress'].taskIds.length).toBeGreaterThanOrEqual(1);
    expect(seed.columns['done'].taskIds.length).toBeGreaterThanOrEqual(1);
  });

  it('TC-008: has exactly 8 tasks (3/2/3 distribution)', () => {
    const seed = createSeedBoard();
    expect(Object.keys(seed.tasks).length).toBe(8);
    expect(seed.columns['todo'].taskIds).toHaveLength(3);
    expect(seed.columns['in-progress'].taskIds).toHaveLength(2);
    expect(seed.columns['done'].taskIds).toHaveLength(3);
  });
});

// ─── TC-009: Seed content ─────────────────────────────────────────────────────

describe('createSeedBoard — content', () => {
  it('TC-009: every task has a non-empty title', () => {
    const seed = createSeedBoard();
    for (const task of Object.values(seed.tasks)) {
      expect(task.title.trim()).not.toBe('');
    }
  });

  it('TC-009: every task has a non-empty description', () => {
    const seed = createSeedBoard();
    for (const task of Object.values(seed.tasks)) {
      expect(task.description.trim()).not.toBe('');
    }
  });

  it('TC-009: passes isValidBoardState (every task in exactly one column)', () => {
    const seed = createSeedBoard();
    expect(isValidBoardState(seed)).toBe(true);
  });

  it('every task id matches its entry key', () => {
    const seed = createSeedBoard();
    for (const [key, task] of Object.entries(seed.tasks)) {
      expect(task.id).toBe(key);
    }
  });
});

// ─── TC-010: Determinism ──────────────────────────────────────────────────────

describe('createSeedBoard — determinism', () => {
  it('TC-010: two calls return deeply equal values', () => {
    const a = createSeedBoard();
    const b = createSeedBoard();
    expect(a).toEqual(b);
  });

  it('TC-010: two calls return distinct object references', () => {
    const a = createSeedBoard();
    const b = createSeedBoard();
    expect(a).not.toBe(b);
    expect(a.tasks).not.toBe(b.tasks);
    expect(a.columns).not.toBe(b.columns);
    expect(a.columnOrder).not.toBe(b.columnOrder);
  });

  it('mutating one result does not affect a subsequent call', () => {
    const a = createSeedBoard();
    a.columnOrder.push('extra' as never);
    const b = createSeedBoard();
    expect(b.columnOrder).toEqual(['todo', 'in-progress', 'done']);
  });
});
