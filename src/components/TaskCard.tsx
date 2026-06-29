/**
 * TaskCard — renders a single task with edit and delete affordances.
 *
 * Clicking Edit → inline TaskForm (edit mode).
 * Clicking Delete → ConfirmDialog → on confirm calls deleteTask.
 *
 * Rule: reads from useBoard only — no localStorage (BR-004).
 */

import { useState } from 'react'
import { useBoard } from '../board/BoardContext'
import { TaskForm } from './TaskForm'
import { ConfirmDialog } from './ConfirmDialog'

interface TaskCardProps {
  taskId: string
}

export function TaskCard({ taskId }: TaskCardProps) {
  const { state, deleteTask } = useBoard()
  const task = state.tasks[taskId]

  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (!task) return null

  if (editing) {
    return (
      <TaskForm
        mode="edit"
        taskId={taskId}
        onClose={() => setEditing(false)}
      />
    )
  }

  if (confirming) {
    return (
      <ConfirmDialog
        message={`Delete "${task.title}"?`}
        onConfirm={() => {
          deleteTask(taskId)
          setConfirming(false)
        }}
        onCancel={() => setConfirming(false)}
      />
    )
  }

  return (
    <div
      className="task-card"
      data-testid={`task-card-${taskId}`}
      style={{
        background: '#fff',
        borderRadius: '4px',
        padding: '0.5rem',
        marginBottom: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}
    >
      <div className="task-content">
        <p
          className="task-title"
          style={{ margin: '0 0 0.25rem', fontWeight: 500, fontSize: '0.9rem' }}
        >
          {task.title}
        </p>
        {task.description && (
          <p
            className="task-description"
            style={{ margin: 0, fontSize: '0.8rem', color: '#5e6c84' }}
          >
            {task.description}
          </p>
        )}
      </div>
      <div
        className="task-actions"
        style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}
      >
        <button
          aria-label="Edit task"
          data-testid={`edit-task-${taskId}`}
          onClick={() => setEditing(true)}
          style={{
            padding: '0.2rem 0.5rem',
            fontSize: '0.75rem',
            border: '1px solid #dfe1e6',
            borderRadius: '3px',
            background: 'transparent',
            cursor: 'pointer',
            minHeight: '40px',
          }}
        >
          Edit
        </button>
        <button
          aria-label="Delete task"
          data-testid={`delete-task-${taskId}`}
          onClick={() => setConfirming(true)}
          style={{
            padding: '0.2rem 0.5rem',
            fontSize: '0.75rem',
            border: '1px solid #dfe1e6',
            borderRadius: '3px',
            background: 'transparent',
            cursor: 'pointer',
            color: '#de350b',
            minHeight: '40px',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
