/**
 * Root composition for the Kanban demo.
 *
 * Wiring added by persistence-seed:
 * - loadInitialBoard() determines the initial state (restored or seeded).
 * - BoardProvider receives that state via initialState.
 * - <PersistenceSyncer> auto-persists every state change to localStorage.
 * - <ResetDemoButton> clears saved state and re-applies the seed.
 *
 * Note: demo-auth will wrap this with an AuthProvider + login gate.
 */
import { useMemo } from 'react';
import { BoardProvider } from './board/BoardContext';
import { Board } from './components/Board';
import { PersistenceSyncer } from './components/PersistenceSyncer';
import { ResetDemoButton } from './components/ResetDemoButton';
import { loadInitialBoard } from './storage/boardLifecycle';

export default function App() {
  // Compute initial state once at mount. useMemo with [] dependency ensures
  // this runs exactly once — subsequent re-renders do not re-read localStorage.
  const initialState = useMemo(() => loadInitialBoard().state, []);

  return (
    <BoardProvider initialState={initialState}>
      {/* Zero-UI syncer: persists on every state change */}
      <PersistenceSyncer />

      {/* App shell */}
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        {/* Minimal toolbar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.01em',
            }}
          >
            Kanban Demo
          </h1>
          <ResetDemoButton />
        </header>

        {/* Board */}
        <main style={{ padding: '24px' }}>
          <Board />
        </main>
      </div>
    </BoardProvider>
  );
}
