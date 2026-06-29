/**
 * ResetDemoButton — toolbar action that restores the board to seed state.
 *
 * Must be rendered inside <BoardProvider>.
 * On click: calls resetDemo() (clear + re-seed storage), then replaceBoard()
 * to adopt the fresh seed as the new React state.
 */
import { useBoard } from '../board/BoardContext';
import { resetDemo } from '../storage/boardLifecycle';

export function ResetDemoButton() {
  const { replaceBoard } = useBoard();

  function handleReset() {
    const fresh = resetDemo();
    replaceBoard(fresh);
  }

  return (
    <button
      onClick={handleReset}
      style={{
        padding: '4px 12px',
        fontSize: '0.75rem',
        fontWeight: 500,
        background: 'transparent',
        border: '1px solid #6b7280',
        borderRadius: '4px',
        color: '#6b7280',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      title="Clear saved state and restore the original demo board"
    >
      Reset demo
    </button>
  );
}
