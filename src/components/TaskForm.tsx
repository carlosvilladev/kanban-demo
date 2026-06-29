/**
 * TaskForm — shared create/edit form.
 *
 * Mode "create": calls createTask(columnId, { title, description }).
 * Mode "edit":   calls editTask(taskId, { title, description }).
 *
 * Guards:
 *   - Submit disabled / blocked when trimmed title is empty (AC-011).
 *   - Esc key cancels (NFR-5).
 *   - Enter submits (keyboard-friendly).
 */

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import type { ColumnId } from '../types/board'
import { useBoard } from '../board/BoardContext'

interface TaskFormProps {
  mode: 'create' | 'edit'
  columnId?: ColumnId
  taskId?: string
  onClose: () => void
}

export function TaskForm({ mode, columnId, taskId, onClose }: TaskFormProps) {
  const { state, createTask, editTask } = useBoard()

  const existingTask = taskId ? state.tasks[taskId] : undefined
  const [title, setTitle] = useState(existingTask?.title ?? '')
  const [description, setDescription] = useState(existingTask?.description ?? '')

  const isValid = title.trim().length > 0

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    if (mode === 'create' && columnId) {
      createTask(columnId, { title: title.trim(), description: description.trim() })
    } else if (mode === 'edit' && taskId) {
      editTask(taskId, { title: title.trim(), description: description.trim() })
    }
    onClose()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <form
      className="task-form"
      data-testid="task-form"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      style={{ marginBottom: '0.5rem' }}
    >
      <input
        type="text"
        aria-label="Task title"
        data-testid="task-title-input"
        placeholder="Task title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
        style={{
          width: '100%',
          padding: '0.4rem',
          marginBottom: '0.4rem',
          border: '1px solid #dfe1e6',
          borderRadius: '4px',
          boxSizing: 'border-box',
          minHeight: '40px',
        }}
      />
      <textarea
        aria-label="Task description"
        data-testid="task-description-input"
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={2}
        style={{
          width: '100%',
          padding: '0.4rem',
          marginBottom: '0.4rem',
          border: '1px solid #dfe1e6',
          borderRadius: '4px',
          boxSizing: 'border-box',
          resize: 'vertical',
        }}
      />
      <div className="task-form-actions" style={{ display: 'flex', gap: '0.4rem' }}>
        <button
          type="submit"
          disabled={!isValid}
          data-testid="task-form-submit"
          style={{
            padding: '0.4rem 0.8rem',
            background: isValid ? '#0052cc' : '#dfe1e6',
            color: isValid ? '#fff' : '#a5adba',
            border: 'none',
            borderRadius: '4px',
            cursor: isValid ? 'pointer' : 'not-allowed',
            fontWeight: 500,
            minHeight: '40px',
          }}
        >
          {mode === 'create' ? 'Add task' : 'Save'}
        </button>
        <button
          type="button"
          data-testid="task-form-cancel"
          onClick={onClose}
          style={{
            padding: '0.4rem 0.8rem',
            background: 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            minHeight: '40px',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
