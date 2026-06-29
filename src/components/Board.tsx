/**
 * Renders the three fixed Kanban columns in columnOrder,
 * wrapped in BoardDndContext so all columns share one DnD context.
 *
 * BoardDndContext mounts inside the board subtree (under BoardProvider),
 * so it can read board state via useBoard() and dispatch MOVE_TASK actions.
 * Auth gating is handled by RequireAuth upstream — the board only renders
 * for an authenticated user.
 */
import { useBoard } from '../board/BoardContext';
import { Column } from './Column';
import { BoardDndContext } from '../dnd/BoardDndContext';

export function Board() {
  const { state } = useBoard();

  return (
    <div className="board-root">
      <header className="board-header">
        <h1 className="board-title">Demo Board</h1>
      </header>
      <BoardDndContext>
        <div className="board" role="main">
          {state.columnOrder.map((columnId) => (
            <Column key={columnId} columnId={columnId} />
          ))}
        </div>
      </BoardDndContext>
    </div>
  );
}
