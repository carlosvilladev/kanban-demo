/**
 * TaskCard / TaskForm / ConfirmDialog integration tests (TC-009 through TC-011).
 *
 * Drives create/edit/delete flows end-to-end through the BoardProvider
 * and asserts DOM + store changes.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BoardProvider } from '../board/BoardContext'
import { Board } from './Board'
import { createEmptyBoard, createTask } from '../board/operations'
import type { BoardState } from '../types/board'

function renderBoard(state?: BoardState) {
  return render(
    <BoardProvider initialState={state}>
      <Board />
    </BoardProvider>,
  )
}

// ─── TC-009: Create task ──────────────────────────────────────────────────────

describe('Create task (TC-009)', () => {
  it('opens a form when "Add task" is clicked in a column', () => {
    renderBoard()
    fireEvent.click(screen.getByTestId('add-task-todo'))
    expect(screen.getByTestId('task-form')).toBeDefined()
  })

  it('adds a card to the column immediately after submit', () => {
    renderBoard()
    fireEvent.click(screen.getByTestId('add-task-todo'))
    fireEvent.change(screen.getByTestId('task-title-input'), {
      target: { value: 'My new task' },
    })
    fireEvent.click(screen.getByTestId('task-form-submit'))
    expect(screen.getByText('My new task')).toBeDefined()
  })

  it('does not add a card when title is empty (submit is disabled)', () => {
    renderBoard()
    fireEvent.click(screen.getByTestId('add-task-todo'))
    // Submit button should be disabled
    const submitBtn = screen.getByTestId('task-form-submit') as HTMLButtonElement
    expect(submitBtn.disabled).toBe(true)
  })

  it('closes the form after a successful create', () => {
    renderBoard()
    fireEvent.click(screen.getByTestId('add-task-todo'))
    fireEvent.change(screen.getByTestId('task-title-input'), {
      target: { value: 'Task title' },
    })
    fireEvent.click(screen.getByTestId('task-form-submit'))
    expect(screen.queryByTestId('task-form')).toBeNull()
  })

  it('cancels create without adding a task', () => {
    const state = createEmptyBoard()
    renderBoard(state)
    fireEvent.click(screen.getByTestId('add-task-todo'))
    fireEvent.click(screen.getByTestId('task-form-cancel'))
    // Form closed, empty column region still shows
    expect(screen.queryByTestId('task-form')).toBeNull()
    expect(screen.getByTestId('empty-todo')).toBeDefined()
  })
})

// ─── TC-010: Edit task ────────────────────────────────────────────────────────

describe('Edit task (TC-010)', () => {
  function boardWithTask() {
    let state = createEmptyBoard()
    state = createTask(state, 'todo', { title: 'Original title', description: 'Original desc' })
    return state
  }

  it('opens an edit form with existing values pre-filled', () => {
    const state = boardWithTask()
    const taskId = state.columns['todo'].taskIds[0]
    renderBoard(state)
    fireEvent.click(screen.getByTestId(`edit-task-${taskId}`))
    const input = screen.getByTestId('task-title-input') as HTMLInputElement
    expect(input.value).toBe('Original title')
  })

  it('updates the task title after saving', () => {
    const state = boardWithTask()
    const taskId = state.columns['todo'].taskIds[0]
    renderBoard(state)
    fireEvent.click(screen.getByTestId(`edit-task-${taskId}`))
    fireEvent.change(screen.getByTestId('task-title-input'), {
      target: { value: 'Updated title' },
    })
    fireEvent.click(screen.getByTestId('task-form-submit'))
    expect(screen.getByText('Updated title')).toBeDefined()
  })

  it('closes the form without changes when Cancel is clicked', () => {
    const state = boardWithTask()
    const taskId = state.columns['todo'].taskIds[0]
    renderBoard(state)
    fireEvent.click(screen.getByTestId(`edit-task-${taskId}`))
    fireEvent.click(screen.getByTestId('task-form-cancel'))
    expect(screen.queryByTestId('task-form')).toBeNull()
    // Original title still visible
    expect(screen.getByText('Original title')).toBeDefined()
  })
})

// ─── TC-011: Delete task ──────────────────────────────────────────────────────

describe('Delete task (TC-011)', () => {
  function boardWithTask() {
    let state = createEmptyBoard()
    state = createTask(state, 'todo', { title: 'Delete me' })
    return state
  }

  it('shows a confirmation dialog when Delete is clicked', () => {
    const state = boardWithTask()
    const taskId = state.columns['todo'].taskIds[0]
    renderBoard(state)
    fireEvent.click(screen.getByTestId(`delete-task-${taskId}`))
    expect(screen.getByTestId('confirm-dialog')).toBeDefined()
  })

  it('removes the task when Confirm is clicked', () => {
    const state = boardWithTask()
    const taskId = state.columns['todo'].taskIds[0]
    renderBoard(state)
    fireEvent.click(screen.getByTestId(`delete-task-${taskId}`))
    fireEvent.click(screen.getByTestId('confirm-yes'))
    expect(screen.queryByTestId(`task-card-${taskId}`)).toBeNull()
    expect(screen.queryByText('Delete me')).toBeNull()
  })

  it('keeps the task when Cancel is clicked in the confirm dialog', () => {
    const state = boardWithTask()
    const taskId = state.columns['todo'].taskIds[0]
    renderBoard(state)
    fireEvent.click(screen.getByTestId(`delete-task-${taskId}`))
    fireEvent.click(screen.getByTestId('confirm-cancel'))
    // Task still visible
    expect(screen.getByTestId(`task-card-${taskId}`)).toBeDefined()
    expect(screen.getByText('Delete me')).toBeDefined()
  })
})

// ─── AC-014: Task in exactly one column ──────────────────────────────────────

describe('Invariant: task in exactly one column (AC-014)', () => {
  it('a created task appears in only the target column', () => {
    renderBoard()
    fireEvent.click(screen.getByTestId('add-task-in-progress'))
    fireEvent.change(screen.getByTestId('task-title-input'), {
      target: { value: 'Invariant check' },
    })
    fireEvent.click(screen.getByTestId('task-form-submit'))
    // Task is in the in-progress column list
    expect(screen.getByTestId('column-in-progress')).toContainElement(
      screen.getByText('Invariant check'),
    )
    // Task is NOT in todo or done columns
    expect(screen.getByTestId('column-todo')).not.toContainElement(
      screen.getByText('Invariant check'),
    )
  })
})
