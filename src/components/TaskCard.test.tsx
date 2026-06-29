/**
 * Integration tests for TaskCard, TaskForm, and ConfirmDialog.
 * Covers TC-009 (create), TC-010 (edit), TC-011 (delete), AC-014.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardProvider } from '../board/BoardContext';
import { createEmptyBoard, createTask } from '../board/operations';
import type { BoardState } from '../types/board';
import { Column } from './Column';

function renderColumn(
  columnId: 'todo' | 'in-progress' | 'done',
  initialState?: BoardState,
) {
  return render(
    <BoardProvider initialState={initialState ?? createEmptyBoard()}>
      <Column columnId={columnId} />
    </BoardProvider>,
  );
}

// ─── TC-009: Create task ─────────────────────────────────────────────────────

describe('TC-009: Create task via the Add form', () => {
  it('adds a card immediately to the target column after form submit', async () => {
    const user = userEvent.setup();
    renderColumn('todo');

    await user.click(screen.getByTestId('add-task-btn-todo'));
    await user.type(screen.getByRole('textbox', { name: /task title/i }), 'New Task');
    await user.click(screen.getByRole('button', { name: /save task/i }));

    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('increments the column count after create', async () => {
    const user = userEvent.setup();
    renderColumn('in-progress');

    expect(screen.getByTestId('count-in-progress')).toHaveTextContent('0');

    await user.click(screen.getByTestId('add-task-btn-in-progress'));
    await user.type(screen.getByRole('textbox', { name: /task title/i }), 'WIP Task');
    await user.click(screen.getByRole('button', { name: /save task/i }));

    expect(screen.getByTestId('count-in-progress')).toHaveTextContent('1');
  });

  it('TC-003: submit button is disabled when title is empty', async () => {
    const user = userEvent.setup();
    renderColumn('todo');

    await user.click(screen.getByTestId('add-task-btn-todo'));

    const submitBtn = screen.getByRole('button', { name: /save task/i });
    expect(submitBtn).toBeDisabled();
  });

  it('submit button is disabled when title is whitespace only', async () => {
    const user = userEvent.setup();
    renderColumn('todo');

    await user.click(screen.getByTestId('add-task-btn-todo'));
    await user.type(screen.getByRole('textbox', { name: /task title/i }), '   ');

    const submitBtn = screen.getByRole('button', { name: /save task/i });
    expect(submitBtn).toBeDisabled();
  });

  it('closes the form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderColumn('todo');

    await user.click(screen.getByTestId('add-task-btn-todo'));
    expect(screen.getByTestId('task-form')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
  });

  it('does NOT add a task if the form is cancelled', async () => {
    const user = userEvent.setup();
    renderColumn('todo');

    await user.click(screen.getByTestId('add-task-btn-todo'));
    await user.type(screen.getByRole('textbox', { name: /task title/i }), 'Cancelled');
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
    expect(screen.getByTestId('count-todo')).toHaveTextContent('0');
  });

  it('can add multiple tasks in sequence', async () => {
    const user = userEvent.setup();
    renderColumn('todo');

    for (const title of ['Task A', 'Task B', 'Task C']) {
      await user.click(screen.getByTestId('add-task-btn-todo'));
      await user.type(screen.getByRole('textbox', { name: /task title/i }), title);
      await user.click(screen.getByRole('button', { name: /save task/i }));
    }

    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Task B')).toBeInTheDocument();
    expect(screen.getByText('Task C')).toBeInTheDocument();
    expect(screen.getByTestId('count-todo')).toHaveTextContent('3');
  });
});

// ─── TC-010: Edit task ───────────────────────────────────────────────────────

describe('TC-010: Edit task', () => {
  it('updates title and description in place after save', async () => {
    const user = userEvent.setup();
    const board = createTask(createEmptyBoard(), 'todo', {
      title: 'Original',
      description: 'Old desc',
    });
    renderColumn('todo', board);

    await user.click(
      screen.getByRole('button', { name: /edit task: original/i }),
    );

    const titleInput = screen.getByRole('textbox', { name: /task title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getByText('Updated Title')).toBeInTheDocument();
    expect(screen.queryByText('Original')).not.toBeInTheDocument();
  });

  it('pre-fills the form with existing title and description', async () => {
    const user = userEvent.setup();
    const board = createTask(createEmptyBoard(), 'todo', {
      title: 'Pre-filled Title',
      description: 'Pre-filled Desc',
    });
    renderColumn('todo', board);

    await user.click(
      screen.getByRole('button', { name: /edit task: pre-filled title/i }),
    );

    const titleInput = screen.getByRole('textbox', { name: /task title/i });
    const descInput = screen.getByRole('textbox', { name: /task description/i });
    expect(titleInput).toHaveValue('Pre-filled Title');
    expect(descInput).toHaveValue('Pre-filled Desc');
  });

  it('save button is disabled when title is cleared', async () => {
    const user = userEvent.setup();
    const board = createTask(createEmptyBoard(), 'todo', { title: 'Task' });
    renderColumn('todo', board);

    await user.click(screen.getByRole('button', { name: /edit task: task/i }));

    const titleInput = screen.getByRole('textbox', { name: /task title/i });
    await user.clear(titleInput);

    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
  });

  it('cancelling edit restores the original title', async () => {
    const user = userEvent.setup();
    const board = createTask(createEmptyBoard(), 'todo', { title: 'Unchanged' });
    renderColumn('todo', board);

    await user.click(
      screen.getByRole('button', { name: /edit task: unchanged/i }),
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByText('Unchanged')).toBeInTheDocument();
  });
});

// ─── TC-011: Delete task ─────────────────────────────────────────────────────

describe('TC-011: Delete task', () => {
  it('shows a confirmation dialog when Delete is clicked', async () => {
    const user = userEvent.setup();
    const board = createTask(createEmptyBoard(), 'todo', { title: 'Delete Me' });
    renderColumn('todo', board);

    await user.click(
      screen.getByRole('button', { name: /delete task: delete me/i }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('removes the card when confirm Delete is clicked', async () => {
    const user = userEvent.setup();
    const board = createTask(createEmptyBoard(), 'todo', { title: 'Remove Me' });
    renderColumn('todo', board);

    await user.click(
      screen.getByRole('button', { name: /delete task: remove me/i }),
    );
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(screen.queryByText('Remove Me')).not.toBeInTheDocument();
    expect(screen.getByTestId('count-todo')).toHaveTextContent('0');
  });

  it('keeps the card when Cancel is clicked in the dialog', async () => {
    const user = userEvent.setup();
    const board = createTask(createEmptyBoard(), 'todo', { title: 'Keep Me' });
    renderColumn('todo', board);

    await user.click(
      screen.getByRole('button', { name: /delete task: keep me/i }),
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByText('Keep Me')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismisses the dialog after a successful delete', async () => {
    const user = userEvent.setup();
    const board = createTask(createEmptyBoard(), 'todo', { title: 'Gone' });
    renderColumn('todo', board);

    await user.click(
      screen.getByRole('button', { name: /delete task: gone/i }),
    );
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ─── AC-014: exactly-one-column invariant ────────────────────────────────────

describe('AC-014: task remains in exactly one column across all CRUD ops', () => {
  it('after create, task appears in the target column only', () => {
    const board = createTask(createEmptyBoard(), 'in-progress', { title: 'WIP' });
    const taskId = board.columns['in-progress'].taskIds[0];

    expect(board.columns['todo'].taskIds).not.toContain(taskId);
    expect(board.columns['in-progress'].taskIds).toContain(taskId);
    expect(board.columns['done'].taskIds).not.toContain(taskId);
  });

  it('after delete, task is absent from all columns', async () => {
    const user = userEvent.setup();
    const board = createTask(createEmptyBoard(), 'todo', { title: 'Task' });

    render(
      <BoardProvider initialState={board}>
        <Column columnId="todo" />
        <Column columnId="in-progress" />
        <Column columnId="done" />
      </BoardProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: /delete task: task/i }),
    );
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    const allCards = screen.queryAllByTestId('task-card');
    expect(allCards).toHaveLength(0);
  });
});

// ─── TaskCard display ────────────────────────────────────────────────────────

describe('TaskCard display', () => {
  it('shows task title', () => {
    const board = createTask(createEmptyBoard(), 'todo', { title: 'My Task' });
    renderColumn('todo', board);
    expect(screen.getByText('My Task')).toBeInTheDocument();
  });

  it('shows description when present', () => {
    const board = createTask(createEmptyBoard(), 'todo', {
      title: 'Task',
      description: 'A description',
    });
    renderColumn('todo', board);
    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('does not render a description element when description is empty', () => {
    const board = createTask(createEmptyBoard(), 'todo', { title: 'Task' });
    renderColumn('todo', board);
    expect(
      within(screen.getByTestId('task-card')).queryByRole('article'),
    ).not.toBeInTheDocument();
  });
});
