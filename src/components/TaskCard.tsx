/**
 * Renders a single task card with edit and delete affordances.
 *
 * - Edit: opens an inline TaskForm (replaces the card in-place).
 * - Delete: shows a ConfirmDialog; confirm removes, cancel keeps.
 * - Tap targets ≥ 40px; hover/focus reveals action buttons (NFR-5).
 */
import { useState } from 'react';
import { useBoard } from '../board/BoardContext';
import { TaskForm } from './TaskForm';
import { ConfirmDialog } from './ConfirmDialog';

interface TaskCardProps {
  taskId: string;
}

export function TaskCard({ taskId }: TaskCardProps) {
  const { state, deleteTask } = useBoard();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const task = state.tasks[taskId];
  if (!task) return null;

  if (editing) {
    return (
      <TaskForm
        mode="edit"
        taskId={taskId}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <div
        className="task-card"
        data-testid="task-card"
        data-task-id={taskId}
      >
        <div className="task-card-title">{task.title}</div>
        {task.description && (
          <div className="task-card-description">{task.description}</div>
        )}
        <div className="task-card-actions">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setEditing(true)}
            aria-label={`Edit task: ${task.title}`}
          >
            Edit
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setConfirming(true)}
            aria-label={`Delete task: ${task.title}`}
          >
            Delete
          </button>
        </div>
      </div>
      {confirming && (
        <ConfirmDialog
          message={`Delete "${task.title}"?`}
          onConfirm={() => {
            deleteTask(taskId);
            setConfirming(false);
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
