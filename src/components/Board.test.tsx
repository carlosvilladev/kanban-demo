/**
 * Integration tests for Board and Column rendering.
 * Covers TC-008: 3 columns in order, titles, live counts.
 */
import { render, screen, within } from '@testing-library/react';
import { BoardProvider } from '../board/BoardContext';
import { createEmptyBoard, createTask } from '../board/operations';
import { Board } from './Board';

function renderBoard(initialState = createEmptyBoard()) {
  return render(
    <BoardProvider initialState={initialState}>
      <Board />
    </BoardProvider>,
  );
}

// ─── TC-008 ──────────────────────────────────────────────────────────────────

describe('Board (TC-008)', () => {
  it('renders exactly 3 columns', () => {
    renderBoard();
    const columns = screen.getAllByTestId(/^column-/);
    expect(columns).toHaveLength(3);
  });

  it('renders columns in fixed order: To Do → In Progress → Done', () => {
    renderBoard();
    const columns = screen.getAllByTestId(/^column-/);
    expect(columns[0]).toHaveAttribute('data-testid', 'column-todo');
    expect(columns[1]).toHaveAttribute('data-testid', 'column-in-progress');
    expect(columns[2]).toHaveAttribute('data-testid', 'column-done');
  });

  it('displays correct column titles', () => {
    renderBoard();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('shows 0 count for all empty columns', () => {
    renderBoard();
    expect(screen.getByTestId('count-todo')).toHaveTextContent('0');
    expect(screen.getByTestId('count-in-progress')).toHaveTextContent('0');
    expect(screen.getByTestId('count-done')).toHaveTextContent('0');
  });

  it('shows correct counts when board has tasks', () => {
    let state = createEmptyBoard();
    state = createTask(state, 'todo', { title: 'A' });
    state = createTask(state, 'todo', { title: 'B' });
    state = createTask(state, 'in-progress', { title: 'C' });

    renderBoard(state);

    expect(screen.getByTestId('count-todo')).toHaveTextContent('2');
    expect(screen.getByTestId('count-in-progress')).toHaveTextContent('1');
    expect(screen.getByTestId('count-done')).toHaveTextContent('0');
  });

  it('column count is the same as its taskIds length', () => {
    let state = createEmptyBoard();
    state = createTask(state, 'done', { title: 'X' });
    state = createTask(state, 'done', { title: 'Y' });
    state = createTask(state, 'done', { title: 'Z' });

    renderBoard(state);

    const doneColumn = screen.getByTestId('column-done');
    const countEl = within(doneColumn).getByTestId('count-done');
    expect(countEl).toHaveTextContent('3');
  });
});

// ─── AC-004: empty column has a styled region (not blank) ────────────────────

describe('Column empty state', () => {
  it('AC-004: shows a non-blank placeholder when column has no tasks', () => {
    renderBoard();
    const todoColumn = screen.getByTestId('column-todo');
    // Should show some non-empty text in the empty state region
    expect(within(todoColumn).getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('hides the empty placeholder once a task exists', () => {
    let state = createEmptyBoard();
    state = createTask(state, 'todo', { title: 'Task' });

    renderBoard(state);

    const todoColumn = screen.getByTestId('column-todo');
    expect(within(todoColumn).queryByText(/no tasks yet/i)).not.toBeInTheDocument();
  });
});

// ─── Column-scoped count updates ─────────────────────────────────────────────

describe('Column live count', () => {
  it('each column shows only its own task count', () => {
    let state = createEmptyBoard();
    state = createTask(state, 'todo', { title: 'A' });
    state = createTask(state, 'in-progress', { title: 'B' });
    state = createTask(state, 'in-progress', { title: 'C' });

    renderBoard(state);

    const todoColumn = screen.getByTestId('column-todo');
    const wipColumn = screen.getByTestId('column-in-progress');
    const doneColumn = screen.getByTestId('column-done');

    expect(within(todoColumn).getByTestId('count-todo')).toHaveTextContent('1');
    expect(within(wipColumn).getByTestId('count-in-progress')).toHaveTextContent('2');
    expect(within(doneColumn).getByTestId('count-done')).toHaveTextContent('0');
  });
});
