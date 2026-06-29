/**
 * Column header (title + live count) and task list region.
 *
 * T3: renders header and task stubs.
 * T4 extends this file to render full <TaskCard> and wire the Add-task form.
 *
 * Reads state from useBoard() — never from localStorage directly.
 */
import { useState } from 'react';
import { useBoard } from '../board/BoardContext';
import type { ColumnId } from '../types/board';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';

interface ColumnProps {
  columnId: ColumnId;
}

export function Column({ columnId }: ColumnProps) {
  const { state, selectColumnTaskCount, selectTasksForColumn } = useBoard();
  const [showAddForm, setShowAddForm] = useState(false);

  const column = state.columns[columnId];
  const tasks = selectTasksForColumn(columnId);
  const count = selectColumnTaskCount(columnId);

  return (
    <div className="column" data-testid={`column-${columnId}`}>
      {/* Header: title + live count */}
      <div className="column-header">
        <span className="column-title">{column.title}</span>
        <span
          className="column-count"
          data-testid={`count-${columnId}`}
          aria-label={`${count} task${count !== 1 ? 's' : ''} in ${column.title}`}
        >
          {count}
        </span>
      </div>

      {/* Task list */}
      <div className="column-tasks">
        {tasks.length === 0 && !showAddForm && (
          <div className="column-empty">No tasks yet</div>
        )}
        {tasks.map((task) => (
          <TaskCard key={task.id} taskId={task.id} />
        ))}
        {showAddForm && (
          <TaskForm
            mode="create"
            columnId={columnId}
            onClose={() => setShowAddForm(false)}
          />
        )}
      </div>

      {/* Add-task affordance */}
      {!showAddForm && (
        <button
          className="add-task-btn"
          data-testid={`add-task-btn-${columnId}`}
          onClick={() => setShowAddForm(true)}
          aria-label={`Add a task to ${column.title}`}
        >
          + Add a task
        </button>
      )}
    </div>
  );
}
