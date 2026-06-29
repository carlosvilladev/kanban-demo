/**
 * Inline form for creating or editing a task.
 * Shared by create and edit paths — one validation path, one component.
 *
 * - Enter (without Shift) submits; Escape cancels.
 * - Submit is disabled when the trimmed title is empty (AC-011).
 */
import { useState, useEffect, useRef } from 'react';
import { useBoard } from '../board/BoardContext';
import type { ColumnId } from '../types/board';

interface TaskFormProps {
  mode: 'create' | 'edit';
  columnId?: ColumnId;
  taskId?: string;
  onClose: () => void;
}

export function TaskForm({ mode, columnId, taskId, onClose }: TaskFormProps) {
  const { state, createTask, editTask } = useBoard();

  const existingTask = taskId ? state.tasks[taskId] : undefined;

  const [title, setTitle] = useState(existingTask?.title ?? '');
  const [description, setDescription] = useState(existingTask?.description ?? '');

  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const trimmedTitle = title.trim();
  const isValid = trimmedTitle.length > 0;

  function handleSubmit() {
    if (!isValid) return;

    if (mode === 'create' && columnId) {
      createTask(columnId, { title: trimmedTitle, description: description.trim() });
    } else if (mode === 'edit' && taskId) {
      editTask(taskId, { title: trimmedTitle, description: description.trim() });
    }

    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div className="task-form" data-testid="task-form">
      <div className="task-form-title">
        {mode === 'create' ? 'Add a task' : 'Edit task'}
      </div>
      <textarea
        ref={titleRef}
        className="form-input"
        placeholder="Task title (required)"
        value={title}
        rows={2}
        aria-label="Task title"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <textarea
        className="form-input"
        placeholder="Description (optional)"
        value={description}
        rows={3}
        aria-label="Task description"
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!isValid}
          aria-label={mode === 'create' ? 'Save task' : 'Save changes'}
        >
          {mode === 'create' ? 'Add' : 'Save'}
        </button>
        <button className="btn btn-ghost" onClick={onClose} aria-label="Cancel">
          Cancel
        </button>
      </div>
    </div>
  );
}
