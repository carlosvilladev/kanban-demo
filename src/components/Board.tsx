/**
 * Renders the three fixed Kanban columns in columnOrder.
 * Reads layout from the store — never from localStorage.
 */
import { useBoard } from '../board/BoardContext';
import { Column } from './Column';

export function Board() {
  const { state } = useBoard();

  return (
    <div className="board-root">
      <header className="board-header">
        <h1 className="board-title">Demo Board</h1>
      </header>
      <div className="board" role="main">
        {state.columnOrder.map((columnId) => (
          <Column key={columnId} columnId={columnId} />
        ))}
      </div>
    </div>
  );
}
