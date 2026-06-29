/**
 * TC-013 (statistical): applyMove settle time on a demo-sized board.
 * Soft assertion — verifies NFR-2 (~100 ms) at the pure-logic layer.
 * Real-world timing depends on React render; jsdom is always well under limit.
 */
import { describe, it, expect } from 'vitest';
import { createEmptyBoard, createTask } from '../board/operations';
import type { BoardState, ColumnId } from '../types/board';
import { applyMove } from './applyMove';

function makeDemoBoard(): BoardState {
  // Seed board size representative of the demo (12 tasks across 3 columns)
  let board = createEmptyBoard();
  const columns: ColumnId[] = ['todo', 'in-progress', 'done'];
  for (let i = 0; i < 12; i++) {
    board = createTask(board, columns[i % 3], { title: `Task ${i + 1}` });
  }
  return board;
}

describe('TC-013 (perf): applyMove timing on demo board', () => {
  it('1000 sequential moves complete well under 100 ms total (< 0.1 ms each)', () => {
    let board = makeDemoBoard();
    const columns: ColumnId[] = ['todo', 'in-progress', 'done'];

    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
      const allTaskIds = Object.keys(board.tasks);
      const taskId = allTaskIds[i % allTaskIds.length];
      const toColumnId = columns[i % 3];
      const colLen = board.columns[toColumnId].taskIds.length;
      const toIndex = colLen > 0 ? i % colLen : 0;

      board = applyMove(board, { taskId, toColumnId, toIndex });
    }
    const elapsed = performance.now() - t0;

    console.log(`[perf] 1000 applyMove calls: ${elapsed.toFixed(2)} ms (${(elapsed / 1000).toFixed(4)} ms/op)`);
    // Hard assertion: 1000 moves must complete in under 100 ms total
    expect(elapsed).toBeLessThan(100);
  });

  it('single move dispatch is effectively synchronous (< 5 ms)', () => {
    const board = makeDemoBoard();
    const [t1] = board.columns['todo'].taskIds;

    const t0 = performance.now();
    applyMove(board, { taskId: t1, toColumnId: 'done', toIndex: 0 });
    const elapsed = performance.now() - t0;

    console.log(`[perf] single applyMove: ${elapsed.toFixed(4)} ms`);
    expect(elapsed).toBeLessThan(5);
  });
});
