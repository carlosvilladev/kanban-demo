/**
 * Auth context — single source of truth for demo authentication.
 *
 * AuthProvider:
 *  - Initializes from readSession() so a valid persisted session survives reload.
 *  - Exposes login / logout via context (never via localStorage directly).
 *  - login(creds?)  : no args → one-click; with creds → validates against DEMO_CREDENTIALS.
 *  - logout()       : calls clearSession() and sets user to null (board data untouched).
 */
import React, { createContext, useState, useMemo } from 'react';
import type { DemoUser } from './types';
import { readSession, writeSession, clearSession } from './session';
import { DEMO_USER, DEMO_CREDENTIALS } from './constants';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface AuthContextValue {
  user: DemoUser | null;
  isAuthenticated: boolean;
  /** No args → one-click sign in. With creds → returns true on match, false otherwise. */
  login: (creds?: { username: string; password: string }) => boolean;
  logout: () => void;
}

// Context + provider live together (consistent with BoardContext); useAuth is in
// its own file. The provider re-renders fine in dev despite this co-location.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Hydrate from localStorage once on mount (lazy initializer pattern)
  const [user, setUser] = useState<DemoUser | null>(() => {
    const session = readSession();
    return session?.user ?? null;
  });

  const isAuthenticated = user !== null;

  const login = (creds?: { username: string; password: string }): boolean => {
    if (creds !== undefined) {
      // Credential sign-in — only demo/demo is accepted
      if (
        creds.username !== DEMO_CREDENTIALS.username ||
        creds.password !== DEMO_CREDENTIALS.password
      ) {
        return false;
      }
    }
    // One-click or valid credential → sign in
    writeSession(DEMO_USER);
    setUser(DEMO_USER);
    return true;
  };

  const logout = (): void => {
    clearSession(); // removes only kanban.session — board data untouched
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated, login, logout }),
    [user, isAuthenticated], // login/logout are stable arrow functions defined in render
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
