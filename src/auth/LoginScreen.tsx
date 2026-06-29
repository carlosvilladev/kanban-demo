/**
 * LoginScreen — the demo app's sign-in page.
 *
 * Two entry paths:
 *  1. "Continue as Demo User" button → calls login() with no args (one-click).
 *  2. Username + password form → calls login({ username, password }).
 *     - Returns false → shows an inline error and stays on screen.
 *     - Returns true  → isAuthenticated flips; RequireAuth shows the board.
 *
 * SRP: this component owns presentation and intent only.
 * It never touches localStorage or session state directly.
 */
import { useState } from 'react';
import { useAuth } from './useAuth';
import { DEMO_CREDENTIALS } from './constants';
import './LoginScreen.css';

export function LoginScreen() {
  const { login } = useAuth();

  const [username, setUsername] = useState<string>(DEMO_CREDENTIALS.username);
  const [password, setPassword] = useState<string>(DEMO_CREDENTIALS.password);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = login({ username, password });
    if (!ok) {
      setError('Use demo / demo (or click Continue as Demo User).');
    }
  }

  function handleOneClick() {
    setError(null);
    login();
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <h1 className="login-title">Kanban Demo</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <div className="login-hint">
          Demo credentials: <code>demo</code> / <code>demo</code>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="login-btn-primary">
            Sign in
          </button>
        </form>

        <div className="login-divider">or</div>

        <button type="button" className="login-btn-secondary" onClick={handleOneClick}>
          Continue as Demo User
        </button>
      </div>
    </div>
  );
}
