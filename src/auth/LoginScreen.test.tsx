/**
 * Component tests for LoginScreen (T3).
 *
 * Rendered inside a mock AuthProvider to control login() behavior.
 * Covers TC-001, TC-002, TC-003 from spec.md.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import { LoginScreen } from './LoginScreen';
import { DEMO_CREDENTIALS } from './constants';

function makeAuthCtx(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    login: vi.fn().mockReturnValue(true),
    logout: vi.fn(),
    ...overrides,
  };
}

function renderLogin(ctx: AuthContextValue = makeAuthCtx()) {
  return render(
    <AuthContext.Provider value={ctx}>
      <LoginScreen />
    </AuthContext.Provider>,
  );
}

describe('LoginScreen rendering', () => {
  it('shows the credentials hint', () => {
    renderLogin();
    expect(screen.getByText(/demo credentials/i)).toBeInTheDocument();
  });

  it('prefills username with demo credentials value', () => {
    renderLogin();
    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    expect(usernameInput.value).toBe(DEMO_CREDENTIALS.username);
  });

  it('prefills password with demo credentials value', () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput.value).toBe(DEMO_CREDENTIALS.password);
  });

  it('password field uses type="password"', () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
  });

  it('renders the "Continue as Demo User" button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /continue as demo user/i })).toBeInTheDocument();
  });

  it('renders the "Sign in" submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });
});

describe('LoginScreen interactions', () => {
  it('TC-002: clicking Continue as Demo User calls login() with no args', async () => {
    const ctx = makeAuthCtx();
    renderLogin(ctx);
    await userEvent.click(screen.getByRole('button', { name: /continue as demo user/i }));
    expect(ctx.login).toHaveBeenCalledWith();
    expect(ctx.login).not.toHaveBeenCalledWith(expect.anything());
  });

  it('TC-003 valid creds: submitting calls login with username/password', async () => {
    const ctx = makeAuthCtx({ login: vi.fn().mockReturnValue(true) });
    renderLogin(ctx);
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(ctx.login).toHaveBeenCalledWith({
      username: DEMO_CREDENTIALS.username,
      password: DEMO_CREDENTIALS.password,
    });
  });

  it('TC-003 wrong creds: shows inline error when login returns false', async () => {
    const ctx = makeAuthCtx({ login: vi.fn().mockReturnValue(false) });
    renderLogin(ctx);

    // Clear prefilled and enter wrong creds
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await userEvent.clear(usernameInput);
    await userEvent.type(usernameInput, 'wrong');
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'bad');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    // LoginScreen still mounted
    expect(screen.getByRole('button', { name: /continue as demo user/i })).toBeInTheDocument();
  });

  it('no error shown before any submit attempt', () => {
    renderLogin();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('error clears after a successful login attempt', async () => {
    const loginFn = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    const ctx = makeAuthCtx({ login: loginFn });
    renderLogin(ctx);

    // First submit fails → error shown
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Second submit succeeds (one-click) → error cleared
    await userEvent.click(screen.getByRole('button', { name: /continue as demo user/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
