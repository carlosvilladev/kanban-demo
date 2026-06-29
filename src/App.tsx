/**
 * App — root component.
 *
 * Wiring:
 *   1. loadInitialBoard() is called once on first render (useState initializer)
 *      — returns the seed on first load, restored state on subsequent loads.
 *   2. BoardProvider receives that state as initialState.
 *   3. AppContent calls useAutoPersist(state) so every state change persists
 *      automatically (no manual save — invariant-6 / FR-P2).
 *   4. Board renders the three columns populated with tasks.
 */

import { useState } from 'react'
import { BoardProvider, useBoard } from './board/BoardContext'
import { Board } from './components/Board'
import { loadInitialBoard } from './storage/boardLifecycle'
import { useAutoPersist } from './storage/useAutoPersist'

/** Inner component — must be inside BoardProvider to call useBoard. */
function AppContent() {
  const { state } = useBoard()
  useAutoPersist(state)
  return <Board />
}

function App() {
  // useState initializer runs exactly once — safe for one-time localStorage read.
  const [initialState] = useState(() => loadInitialBoard().state)

  return (
    <BoardProvider initialState={initialState}>
      <AppContent />
    </BoardProvider>
  )
}

export default App
