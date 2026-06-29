/**
 * Wraps TaskCard with dnd-kit sortable behaviour.
 *
 * This component calls useSortable and spreads drag handles onto the wrapper div.
 * TaskCard itself stays presentational (no dnd-kit dependency), so its existing
 * tests continue to work without a DndContext ancestor.
 */
import { TaskCard } from '../components/TaskCard';
import { useSortableTask } from './useSortableTask';

interface SortableTaskCardProps {
  taskId: string;
}

export function SortableTaskCard({ taskId }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, style, isDragging } = useSortableTask(taskId);

  // Exclude `role` from the attributes spread.
  // dnd-kit sets role="button" to support keyboard activation, but keyboard
  // DnD is out of scope (spec Assumption / ADR-DND). Spreading role="button"
  // onto the card wrapper makes RTL interpret it as a button whose accessible
  // name contains every text descendant — breaking the cancel-button query in
  // existing column/card tests.  tabIndex + aria-* are kept for accessibility.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role: _role, ...restAttributes } = attributes;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging || undefined}
      {...restAttributes}
      {...listeners}
    >
      <TaskCard taskId={taskId} />
    </div>
  );
}
