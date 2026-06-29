/**
 * Unit tests for AuthContext / useAuth (T2: Auth context).
 *
 * Covers TC-002, TC-003, TC-004, TC-005 from spec.md plus edge cases.
 * Vitest globals enabled; @testing-library/react available via setup.ts.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import { SESSION_KEY } from './constants';
import { writeSession } from './session';
import { DEMO_USER } from './constants';

// Probe component to read auth state
function AuthProbe() {
  const { user, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'authed' : 'anon'}</span>
      <span data-testid="user-name">{user?.name ?? 'none'}</span>
    </div>
  );
}

// Probe that exposes login/logout
function LoginProbe() {
  const { login, logout, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'authed' : 'anon'}</span>
      <button onClick={() => login()}>one-click</button>
      <button onClick={() => login({ username: 'demo', password: 'demo' })}>cred-login</button>
      <button onClick={() => login({ username: 'wrong', password: 'bad' })}>bad-login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe('AuthProvider initial state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts unauthenticated when no session stored', () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('auth-status').textContent).toBe('anon');
    expect(screen.getByTestId('user-name').textContent).toBe('none');
  });

  it('TC-004: starts authenticated when a valid session is stored on mount', () => {
    writeSession(DEMO_USER);
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('auth-status').textContent).toBe('authed');
    expect(screen.getByTestId('user-name').textContent).toBe('Demo User');
  });
});

describe('login()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('TC-002: one-click login (no args) signs in', async () => {
    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('auth-status').textContent).toBe('anon');
    await userEvent.click(screen.getByText('one-click'));
    expect(screen.getByTestId('auth-status').textContent).toBe('authed');
    // Session was written
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
  });

  it('TC-003 valid creds: returns true and signs in', async () => {
    let result: boolean | undefined;

    function CredProbe() {
      const { login, isAuthenticated } = useAuth();
      return (
        <div>
          <span data-testid="auth-status">{isAuthenticated ? 'authed' : 'anon'}</span>
          <button onClick={() => { result = login({ username: 'demo', password: 'demo' }); }}>
            cred-login
          </button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <CredProbe />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByText('cred-login'));
    expect(result).toBe(true);
    expect(screen.getByTestId('auth-status').textContent).toBe('authed');
  });

  it('TC-003 wrong creds: returns false and leaves state unchanged', async () => {
    let result: boolean | undefined;

    function WrongProbe() {
      const { login, isAuthenticated } = useAuth();
      return (
        <div>
          <span data-testid="auth-status">{isAuthenticated ? 'authed' : 'anon'}</span>
          <button onClick={() => { result = login({ username: 'wrong', password: 'bad' }); }}>
            bad-login
          </button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <WrongProbe />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByText('bad-login'));
    expect(result).toBe(false);
    expect(screen.getByTestId('auth-status').textContent).toBe('anon');
    // No session written
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});

describe('logout()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('TC-005: logout clears auth state and session key', async () => {
    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByText('one-click'));
    expect(screen.getByTestId('auth-status').textContent).toBe('authed');
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();

    await userEvent.click(screen.getByText('logout'));
    expect(screen.getByTestId('auth-status').textContent).toBe('anon');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('TC-005: logout never deletes board data key', async () => {
    const BOARD_KEY = 'kanban-demo:board';
    const boardData = '{"columns":[]}';
    localStorage.setItem(BOARD_KEY, boardData);

    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByText('one-click'));
    await userEvent.click(screen.getByText('logout'));

    expect(localStorage.getItem(BOARD_KEY)).toBe(boardData);
  });
});

describe('useAuth outside AuthProvider', () => {
  it('throws a descriptive error', () => {
    function Orphan() {
      useAuth();
      return null;
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(/AuthProvider/i);
    consoleSpy.mockRestore();
  });
});
