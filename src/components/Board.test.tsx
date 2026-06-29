/**
 * Board + Column rendering tests (TC-008).
 *
 * Asserts: 3 columns, correct order (To Do → In Progress → Done),
 * correct titles and counts, empty-state region for zero-task columns.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BoardProvider } from '../board/BoardContext'
import { Board } from './Board'
import { createEmptyBoard, createTask } from '../board/operations'
import type { BoardState } from '../types/board'

function renderBoard(initialState?: BoardState) {
  return render(
    <BoardProvider initialState={initialState}>
      <Board />
    </BoardProvider>,
  )
}

// ─── TC-008: Column structure ─────────────────────────────────────────────────

describe('Board — column structure (TC-008)', () => {
  it('renders exactly three columns', () => {
    const { container } = renderBoard()
    const columns = container.querySelectorAll('[data-testid^="column-"]')
    expect(columns).toHaveLength(3)
  })

  it('renders columns in order: To Do → In Progress → Done', () => {
    const { container } = renderBoard()
    const titles = Array.from(container.querySelectorAll('.column-title')).map(
      el => el.textContent,
    )
    expect(titles).toEqual(['To Do', 'In Progress', 'Done'])
  })

  it('each column header shows the correct title', () => {
    const { getByTestId } = renderBoard()
    expect(getByTestId('column-todo').querySelector('.column-title')?.textContent).toBe('To Do')
    expect(getByTestId('column-in-progress').querySelector('.column-title')?.textContent).toBe('In Progress')
    expect(getByTestId('column-done').querySelector('.column-title')?.textContent).toBe('Done')
  })
})

// ─── TC-008: Task count display ───────────────────────────────────────────────

describe('Board — task counts (TC-008)', () => {
  it('shows count 0 for all columns on an empty board', () => {
    const { getByTestId } = renderBoard()
    expect(getByTestId('count-todo').textContent).toBe('0')
    expect(getByTestId('count-in-progress').textContent).toBe('0')
    expect(getByTestId('count-done').textContent).toBe('0')
  })

  it('reflects correct count per column when tasks exist', () => {
    let state = createEmptyBoard()
    state = createTask(state, 'todo', { title: 'A' })
    state = createTask(state, 'todo', { title: 'B' })
    state = createTask(state, 'in-progress', { title: 'C' })

    const { getByTestId } = renderBoard(state)
    expect(getByTestId('count-todo').textContent).toBe('2')
    expect(getByTestId('count-in-progress').textContent).toBe('1')
    expect(getByTestId('count-done').textContent).toBe('0')
  })
})

// ─── AC-004: Empty-column styled region ──────────────────────────────────────

describe('Board — empty column state (AC-004)', () => {
  it('renders a non-blank empty region when a column has zero tasks', () => {
    const { getByTestId } = renderBoard()
    // Each empty column should have an empty-state element (not blank)
    const emptyEl = getByTestId('empty-todo')
    expect(emptyEl).toBeDefined()
    expect(emptyEl.textContent?.trim().length).toBeGreaterThan(0)
  })

  it('does not render the empty region when a column has tasks', () => {
    let state = createEmptyBoard()
    state = createTask(state, 'todo', { title: 'T' })
    const { queryByTestId } = renderBoard(state)
    expect(queryByTestId('empty-todo')).toBeNull()
  })
})

// ─── Task display in columns ──────────────────────────────────────────────────

describe('Board — task display', () => {
  it('shows a TaskCard for each task in a column', () => {
    let state = createEmptyBoard()
    state = createTask(state, 'done', { title: 'Done task' })
    const taskId = state.columns['done'].taskIds[0]
    const { getByTestId } = renderBoard(state)
    // TaskCard renders with data-testid="task-card-{id}"
    expect(getByTestId(`task-card-${taskId}`)).toBeDefined()
  })
})
