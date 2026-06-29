/**
 * Column — header (title + count) + ordered TaskCard list + "Add task" form slot.
 *
 * Rule: reads ALL state from useBoard — never from localStorage (BR-004).
 */

import { useState } from 'react'
import type { ColumnId } from '../types/board'
import { useBoard } from '../board/BoardContext'
import { TaskCard } from './TaskCard'
import { TaskForm } from './TaskForm'

interface ColumnProps {
  columnId: ColumnId
}

export function Column({ columnId }: ColumnProps) {
  const { state, selectColumnTaskCount } = useBoard()
  const column = state.columns[columnId]
  const count = selectColumnTaskCount(columnId)

  const [showForm, setShowForm] = useState(false)

  return (
    <div
      className="column"
      data-testid={`column-${columnId}`}
      style={{
        flex: '0 0 280px',
        minWidth: '280px',
        background: '#f4f5f7',
        borderRadius: '8px',
        padding: '0.75rem',
      }}
    >
      {/* ── Header ── */}
      <div
        className="column-header"
        style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}
      >
        <h2 className="column-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
          {column.title}
        </h2>
        <span
          className="task-count"
          data-testid={`count-${columnId}`}
          style={{
            background: '#dfe1e6',
            borderRadius: '50%',
            padding: '0 6px',
            fontSize: '0.8rem',
            lineHeight: '1.6',
          }}
        >
          {count}
        </span>
      </div>

      {/* ── Task list ── */}
      <div className="column-tasks">
        {count === 0 && !showForm ? (
          <div
            className="column-empty"
            data-testid={`empty-${columnId}`}
            style={{ color: '#5e6c84', fontSize: '0.85rem', padding: '0.5rem 0' }}
          >
            No tasks yet
          </div>
        ) : (
          column.taskIds.map(id => (
            <TaskCard key={id} taskId={id} />
          ))
        )}
      </div>

      {/* ── Add task slot ── */}
      <div className="column-add">
        {showForm ? (
          <TaskForm
            mode="create"
            columnId={columnId}
            onClose={() => setShowForm(false)}
          />
        ) : (
          <button
            className="add-task-btn"
            data-testid={`add-task-${columnId}`}
            onClick={() => setShowForm(true)}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.4rem',
              background: 'transparent',
              border: '1px dashed #c1c7d0',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#5e6c84',
              minHeight: '40px',
            }}
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  )
}
