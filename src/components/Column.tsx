/**
 * Column header (title + live count) and task list region.
 *
 * Drag-and-drop additions (T3):
 * - useDroppable: makes the column a valid drop target (empty columns accept drops).
 * - SortableContext: animates sibling cards with verticalListSortingStrategy,
 *   opening the insertion placeholder gap as the user drags over the column.
 * - SortableTaskCard: wraps each TaskCard with useSortable handles.
 *   TaskCard itself is unchanged (no dnd-kit dependency) so its tests remain green.
 *
 * Reads state from useBoard() — never from localStorage directly.
 */
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useBoard } from '../board/BoardContext';
import type { ColumnId } from '../types/board';
import { TaskForm } from './TaskForm';
import { SortableTaskCard } from '../dnd/SortableTaskCard';

interface ColumnProps {
  columnId: ColumnId;
}

export function Column({ columnId }: ColumnProps) {
  const { state, selectColumnTaskCount, selectTasksForColumn } = useBoard();
  const [showAddForm, setShowAddForm] = useState(false);

  const column = state.columns[columnId];
  const tasks = selectTasksForColumn(columnId);
  const count = selectColumnTaskCount(columnId);
  const taskIds = column.taskIds;

  // Register this column as a droppable so empty columns accept cards.
  const { setNodeRef } = useDroppable({ id: columnId });

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

      {/* Task list — SortableContext drives the insertion placeholder gap */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="column-tasks" ref={setNodeRef}>
          {tasks.length === 0 && !showAddForm && (
            <div className="column-empty">No tasks yet</div>
          )}
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} taskId={task.id} />
          ))}
          {showAddForm && (
            <TaskForm
              mode="create"
              columnId={columnId}
              onClose={() => setShowAddForm(false)}
            />
          )}
        </div>
      </SortableContext>

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
