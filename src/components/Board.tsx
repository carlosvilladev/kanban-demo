/**
 * Board — top-level layout component.
 *
 * Reads columnOrder from the store and renders one Column per id.
 * Columns are always exactly three, fixed order (BR-001 / BR-002).
 */

import { useBoard } from '../board/BoardContext'
import { Column } from './Column'

export function Board() {
  const { state } = useBoard()

  return (
    <div
      className="board"
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem',
        overflowX: 'auto',
        minHeight: '100vh',
        alignItems: 'flex-start',
      }}
    >
      {state.columnOrder.map(colId => (
        <Column key={colId} columnId={colId} />
      ))}
    </div>
  )
}
