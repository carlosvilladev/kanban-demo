/**
 * BoardProvider + useBoard hook tests (TC-007).
 *
 * Drives state changes through dispatch and asserts re-render / state shape.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { BoardProvider, useBoard } from './BoardContext'
import { createEmptyBoard } from './operations'
import type { BoardState, ColumnId } from '../types/board'

// ─── Test consumer components ─────────────────────────────────────────────────

/** Captures the latest state via callback; renders task titles as testid elements. */
function TestBoardDisplay({ onState }: { onState?: (s: BoardState) => void }) {
  const { state } = useBoard()
  onState?.(state)
  return (
    <ul>
      {Object.values(state.tasks).map(t => (
        <li key={t.id} data-testid={`task-${t.id}`}>{t.title}</li>
      ))}
    </ul>
  )
}

function TestCreateButton({ columnId, title = 'New Task' }: { columnId: ColumnId; title?: string }) {
  const { createTask } = useBoard()
  return (
    <button data-testid="create-btn" onClick={() => createTask(columnId, { title })}>
      Create
    </button>
  )
}

function TestEditButton({ taskId, title }: { taskId: string; title: string }) {
  const { editTask } = useBoard()
  return (
    <button data-testid="edit-btn" onClick={() => editTask(taskId, { title })}>
      Edit
    </button>
  )
}

function TestDeleteButton({ taskId }: { taskId: string }) {
  const { deleteTask } = useBoard()
  return (
    <button data-testid="delete-btn" onClick={() => deleteTask(taskId)}>
      Delete
    </button>
  )
}

// ─── TC-007: BoardProvider + useBoard ────────────────────────────────────────

describe('BoardProvider — initial state', () => {
  it('defaults to an empty board when no initialState is provided', () => {
    let captured: BoardState | undefined
    render(
      <BoardProvider>
        <TestBoardDisplay onState={s => { captured = s }} />
      </BoardProvider>,
    )
    expect(captured).toBeDefined()
    expect(Object.keys(captured!.tasks)).toHaveLength(0)
    expect(captured!.columnOrder).toEqual(['todo', 'in-progress', 'done'])
  })

  it('uses the provided initialState', () => {
    const taskId = 'preset-task'
    const initial: BoardState = {
      ...createEmptyBoard(),
      tasks: { [taskId]: { id: taskId, title: 'Preset', description: '' } },
      columns: {
        ...createEmptyBoard().columns,
        todo: { id: 'todo', title: 'To Do', taskIds: [taskId] },
      },
    }

    let captured: BoardState | undefined
    render(
      <BoardProvider initialState={initial}>
        <TestBoardDisplay onState={s => { captured = s }} />
      </BoardProvider>,
    )
    expect(captured?.tasks[taskId]?.title).toBe('Preset')
  })
})

describe('BoardProvider — createTask action', () => {
  it('creates a task and re-renders consumers', async () => {
    let captured: BoardState | undefined
    const { getByTestId } = render(
      <BoardProvider>
        <TestBoardDisplay onState={s => { captured = s }} />
        <TestCreateButton columnId="todo" title="Created Task" />
      </BoardProvider>,
    )

    expect(Object.keys(captured!.tasks)).toHaveLength(0)

    await act(async () => { getByTestId('create-btn').click() })

    expect(Object.keys(captured!.tasks)).toHaveLength(1)
    const task = Object.values(captured!.tasks)[0]
    expect(task.title).toBe('Created Task')
    expect(captured!.columns['todo'].taskIds).toContain(task.id)
  })

  it('ignores createTask with an empty title', async () => {
    let captured: BoardState | undefined
    const { getByTestId } = render(
      <BoardProvider>
        <TestBoardDisplay onState={s => { captured = s }} />
        <TestCreateButton columnId="todo" title="" />
      </BoardProvider>,
    )

    await act(async () => { getByTestId('create-btn').click() })
    expect(Object.keys(captured!.tasks)).toHaveLength(0)
  })
})

describe('BoardProvider — editTask action', () => {
  it('updates a task title and re-renders', async () => {
    const taskId = 'edit-me'
    const initial: BoardState = {
      ...createEmptyBoard(),
      tasks: { [taskId]: { id: taskId, title: 'Old', description: '' } },
      columns: {
        ...createEmptyBoard().columns,
        todo: { id: 'todo', title: 'To Do', taskIds: [taskId] },
      },
    }

    let captured: BoardState | undefined
    const { getByTestId } = render(
      <BoardProvider initialState={initial}>
        <TestBoardDisplay onState={s => { captured = s }} />
        <TestEditButton taskId={taskId} title="Updated" />
      </BoardProvider>,
    )

    await act(async () => { getByTestId('edit-btn').click() })
    expect(captured?.tasks[taskId]?.title).toBe('Updated')
  })
})

describe('BoardProvider — deleteTask action', () => {
  it('removes a task and re-renders', async () => {
    const taskId = 'del-me'
    const initial: BoardState = {
      ...createEmptyBoard(),
      tasks: { [taskId]: { id: taskId, title: 'Delete Me', description: '' } },
      columns: {
        ...createEmptyBoard().columns,
        todo: { id: 'todo', title: 'To Do', taskIds: [taskId] },
      },
    }

    let captured: BoardState | undefined
    const { getByTestId } = render(
      <BoardProvider initialState={initial}>
        <TestBoardDisplay onState={s => { captured = s }} />
        <TestDeleteButton taskId={taskId} />
      </BoardProvider>,
    )

    expect(captured?.tasks[taskId]).toBeDefined()

    await act(async () => { getByTestId('delete-btn').click() })

    expect(captured?.tasks[taskId]).toBeUndefined()
    expect(captured?.columns['todo'].taskIds).not.toContain(taskId)
  })
})

describe('BoardProvider — selectors via useBoard', () => {
  it('selectColumnTaskCount returns correct count from the hook', () => {
    const taskId = 'count-me'
    const initial: BoardState = {
      ...createEmptyBoard(),
      tasks: { [taskId]: { id: taskId, title: 'T', description: '' } },
      columns: {
        ...createEmptyBoard().columns,
        todo: { id: 'todo', title: 'To Do', taskIds: [taskId] },
      },
    }

    let countTodo = -1
    function Counter() {
      const { selectColumnTaskCount } = useBoard()
      countTodo = selectColumnTaskCount('todo')
      return null
    }

    render(
      <BoardProvider initialState={initial}>
        <Counter />
      </BoardProvider>,
    )

    expect(countTodo).toBe(1)
  })

  it('getTaskColumn returns the correct column from the hook', () => {
    const taskId = 'locate-me'
    const initial: BoardState = {
      ...createEmptyBoard(),
      tasks: { [taskId]: { id: taskId, title: 'T', description: '' } },
      columns: {
        ...createEmptyBoard().columns,
        'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [taskId] },
      },
    }

    let foundColumn: string | undefined
    function Locator() {
      const { getTaskColumn } = useBoard()
      foundColumn = getTaskColumn(taskId)
      return null
    }

    render(
      <BoardProvider initialState={initial}>
        <Locator />
      </BoardProvider>,
    )

    expect(foundColumn).toBe('in-progress')
  })
})

describe('useBoard — outside provider error', () => {
  it('throws a clear error when called outside BoardProvider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function BadConsumer() {
      useBoard()
      return null
    }

    expect(() => render(<BadConsumer />)).toThrow('useBoard must be used within a BoardProvider')
    errorSpy.mockRestore()
  })
})
