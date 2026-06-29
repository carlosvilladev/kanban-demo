/**
 * Ghost card rendered inside DragOverlay during a drag.
 *
 * Reuses TaskCard's presentational layer with an elevated/lifted visual style.
 * Rendered by BoardDndContext when activeId is set.
 */
import { TaskCard } from '../components/TaskCard';

interface DragOverlayCardProps {
  taskId: string;
}

export function DragOverlayCard({ taskId }: DragOverlayCardProps) {
  return (
    <div
      className="task-card-overlay"
      style={{
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        borderRadius: '6px',
        cursor: 'grabbing',
        rotate: '1.5deg',
        opacity: 0.95,
      }}
    >
      <TaskCard taskId={taskId} />
    </div>
  );
}
