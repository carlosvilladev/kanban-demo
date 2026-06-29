/**
 * Tests for RequireAuth gate and UserMenu (T4).
 *
 * Covers TC-001, TC-005, TC-007 from spec.md.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import { RequireAuth } from './RequireAuth';
import { UserMenu } from './UserMenu';
import { DEMO_USER } from './constants';
import { SESSION_KEY } from './constants';
import { writeSession } from './session';
import { AuthProvider } from './AuthContext';

function makeAuthCtx(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    login: vi.fn().mockReturnValue(true),
    logout: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// RequireAuth gate
// ---------------------------------------------------------------------------

describe('RequireAuth', () => {
  it('TC-001: renders LoginScreen when unauthenticated (children not in DOM)', () => {
    const ctx = makeAuthCtx({ user: null, isAuthenticated: false });
    render(
      <AuthContext.Provider value={ctx}>
        <RequireAuth>
          <div data-testid="board">Board Content</div>
        </RequireAuth>
      </AuthContext.Provider>,
    );

    // LoginScreen rendered
    expect(screen.getByRole('button', { name: /continue as demo user/i })).toBeInTheDocument();
    // Board children NOT in DOM
    expect(screen.queryByTestId('board')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    const ctx = makeAuthCtx({ user: DEMO_USER, isAuthenticated: true });
    render(
      <AuthContext.Provider value={ctx}>
        <RequireAuth>
          <div data-testid="board">Board Content</div>
        </RequireAuth>
      </AuthContext.Provider>,
    );

    expect(screen.getByTestId('board')).toBeInTheDocument();
    // LoginScreen NOT rendered
    expect(screen.queryByRole('button', { name: /continue as demo user/i })).not.toBeInTheDocument();
  });

  it('shows LoginScreen after logout flips isAuthenticated', async () => {
    localStorage.clear();

    // Full integration: start authed, logout, gate flips
    render(
      <AuthProvider>
        <RequireAuth>
          <div data-testid="board">Board</div>
        </RequireAuth>
      </AuthProvider>,
    );

    // Not authed initially → login screen
    expect(screen.getByRole('button', { name: /continue as demo user/i })).toBeInTheDocument();

    // One-click sign in
    await userEvent.click(screen.getByRole('button', { name: /continue as demo user/i }));

    // Board now visible
    expect(screen.getByTestId('board')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// UserMenu
// ---------------------------------------------------------------------------

describe('UserMenu', () => {
  it('TC-007: shows "Logged in as Demo User" and avatar', () => {
    const ctx = makeAuthCtx({ user: DEMO_USER, isAuthenticated: true });
    render(
      <AuthContext.Provider value={ctx}>
        <UserMenu />
      </AuthContext.Provider>,
    );

    expect(screen.getByText(/logged in as demo user/i)).toBeInTheDocument();
    expect(screen.getByText('DU')).toBeInTheDocument(); // avatar initials
  });

  it('renders a Log out button', () => {
    const ctx = makeAuthCtx({ user: DEMO_USER, isAuthenticated: true });
    render(
      <AuthContext.Provider value={ctx}>
        <UserMenu />
      </AuthContext.Provider>,
    );
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('TC-005: clicking Log out calls logout()', async () => {
    const ctx = makeAuthCtx({ user: DEMO_USER, isAuthenticated: true });
    render(
      <AuthContext.Provider value={ctx}>
        <UserMenu />
      </AuthContext.Provider>,
    );

    await userEvent.click(screen.getByRole('button', { name: /log out/i }));
    expect(ctx.logout).toHaveBeenCalledOnce();
  });

  it('TC-005: logout leaves kanban-demo:board key intact', async () => {
    const BOARD_KEY = 'kanban-demo:board';
    const boardData = '{"columns":[]}';
    localStorage.setItem(BOARD_KEY, boardData);

    // Full integration — use real provider to get real logout
    writeSession(DEMO_USER);
    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: /log out/i }));

    // Session gone, board intact
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(BOARD_KEY)).toBe(boardData);
  });
});
