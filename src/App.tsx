/**
 * Root composition for the Kanban demo.
 *
 * Persistence wiring (unchanged from persistence-seed):
 * - loadInitialBoard() determines the initial state (restored or seeded).
 * - BoardProvider receives that state via initialState.
 * - <PersistenceSyncer> auto-persists every state change to localStorage.
 * - <ResetDemoButton> clears saved state and re-applies the seed.
 *
 * Auth wiring added by demo-auth:
 * - <AuthProvider> is the outermost wrapper so auth state is available everywhere.
 * - <RequireAuth> gates the board: logged-out → LoginScreen; logged-in → board.
 * - <UserMenu> appears in the header alongside ResetDemoButton (visible when authed).
 *
 * Composition structure:
 *   AuthProvider
 *     RequireAuth
 *       BoardProvider (initialState from localStorage / seed)
 *         PersistenceSyncer
 *         shell
 *           header: [h1] [UserMenu] [ResetDemoButton]
 *           main:   Board
 */
import { useMemo } from 'react';
import { BoardProvider } from './board/BoardContext';
import { Board } from './components/Board';
import { PersistenceSyncer } from './components/PersistenceSyncer';
import { ResetDemoButton } from './components/ResetDemoButton';
import { loadInitialBoard } from './storage/boardLifecycle';
import { AuthProvider, RequireAuth, UserMenu } from './auth';

export default function App() {
  // Compute initial state once at mount. useMemo with [] dependency ensures
  // this runs exactly once — subsequent re-renders do not re-read localStorage.
  const initialState = useMemo(() => loadInitialBoard().state, []);

  return (
    <AuthProvider>
      <RequireAuth>
        <BoardProvider initialState={initialState}>
          {/* Zero-UI syncer: persists on every state change */}
          <PersistenceSyncer />

          {/* App shell */}
          <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
            {/* Toolbar — only visible when authenticated (inside RequireAuth) */}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <UserMenu />
                <ResetDemoButton />
              </div>
            </header>

            {/* Board */}
            <main style={{ padding: '24px' }}>
              <Board />
            </main>
          </div>
        </BoardProvider>
      </RequireAuth>
    </AuthProvider>
  );
}
