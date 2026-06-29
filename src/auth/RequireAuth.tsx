/**
 * RequireAuth — auth gate via conditional render.
 *
 * When `isAuthenticated` is false: renders <LoginScreen />.
 * When `isAuthenticated` is true: renders children.
 *
 * No router dependency — 2-state app (logged-out vs board) does not need one.
 */
import React from 'react';
import { useAuth } from './useAuth';
import { LoginScreen } from './LoginScreen';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
