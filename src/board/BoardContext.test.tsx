/**
 * Integration tests for BoardProvider + useBoard hook.
 * Covers TC-007.
 */
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardProvider, useBoard } from './BoardContext';
import { createEmptyBoard, createTask } from './operations';
import type { ColumnId } from '../types/board';

// ─── Test consumer components ────────────────────────────────────────────────

function CountDisplay({ columnId }: { columnId: ColumnId }) {
  const { selectColumnTaskCount } = useBoard();
  return <span data-testid="count">{selectColumnTaskCount(columnId)}</span>;
}

function AddTaskButton({ columnId }: { columnId: ColumnId }) {
  const { createTask } = useBoard();
  return (
    <button onClick={() => createTask(columnId, { title: 'Test Task' })}>Add Task</button>
  );
}

function DeleteTaskButton({ taskId }: { taskId: string }) {
  const { deleteTask } = useBoard();
  return <button onClick={() => deleteTask(taskId)}>Delete</button>;
}

function EditTaskButton({ taskId }: { taskId: string }) {
  const { editTask } = useBoard();
  return (
    <button onClick={() => editTask(taskId, { title: 'Updated' })}>Edit</button>
  );
}

function StateInspector() {
  const { state } = useBoard();
  return (
    <>
      <span data-testid="column-count">{state.columnOrder.length}</span>
      <span data-testid="task-count">{Object.keys(state.tasks).length}</span>
    </>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BoardProvider', () => {
  it('TC-007: dispatching createTask updates state and re-renders the consumer', async () => {
    const user = userEvent.setup();
    render(
      <BoardProvider>
        <CountDisplay columnId="todo" />
        <AddTaskButton columnId="todo" />
      </BoardProvider>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: 'Add Task' }));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('starts with createEmptyBoard() when no initialState is given', () => {
    render(
      <BoardProvider>
        <StateInspector />
      </BoardProvider>,
    );

    expect(screen.getByTestId('column-count')).toHaveTextContent('3');
    expect(screen.getByTestId('task-count')).toHaveTextContent('0');
  });

  it('uses the provided initialState when given', () => {
    const seeded = createTask(createEmptyBoard(), 'done', { title: 'Seed Task' });
    render(
      <BoardProvider initialState={seeded}>
        <StateInspector />
        <CountDisplay columnId="done" />
      </BoardProvider>,
    );

    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('dispatching deleteTask removes the task and re-renders', async () => {
    const user = userEvent.setup();
    const seeded = createTask(createEmptyBoard(), 'todo', { title: 'To Delete' });
    const taskId = seeded.columns['todo'].taskIds[0];

    render(
      <BoardProvider initialState={seeded}>
        <CountDisplay columnId="todo" />
        <DeleteTaskButton taskId={taskId} />
      </BoardProvider>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('dispatching editTask updates the task', async () => {
    const user = userEvent.setup();
    const seeded = createTask(createEmptyBoard(), 'todo', { title: 'Original' });
    const taskId = seeded.columns['todo'].taskIds[0];

    function TitleDisplay() {
      const { state } = useBoard();
      return <span data-testid="title">{state.tasks[taskId]?.title}</span>;
    }

    render(
      <BoardProvider initialState={seeded}>
        <TitleDisplay />
        <EditTaskButton taskId={taskId} />
      </BoardProvider>,
    );

    expect(screen.getByTestId('title')).toHaveTextContent('Original');
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByTestId('title')).toHaveTextContent('Updated');
  });

  it('throws when useBoard is called outside a BoardProvider', () => {
    function BadComponent() {
      useBoard();
      return null;
    }

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadComponent />)).toThrow(
      'useBoard must be used within a BoardProvider',
    );
    spy.mockRestore();
  });

  it('selectColumnTaskCount selector reflects current state', () => {
    function SelectorTest() {
      const { selectColumnTaskCount, createTask } = useBoard();
      const count = selectColumnTaskCount('in-progress');
      return (
        <>
          <span data-testid="count">{count}</span>
          <button onClick={() => createTask('in-progress', { title: 'New' })}>Add</button>
        </>
      );
    }

    render(
      <BoardProvider>
        <SelectorTest />
      </BoardProvider>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    act(() => {
      screen.getByRole('button', { name: 'Add' }).click();
    });
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
