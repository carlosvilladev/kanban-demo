/**
 * useAuth — thin hook that reads the AuthContext.
 *
 * Throws a descriptive error when used outside AuthProvider so component
 * authors get an immediate diagnostic instead of a silent null reference.
 */
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error(
      '[useAuth] must be used inside <AuthProvider>. ' +
        'Wrap your component tree with <AuthProvider> at the app root.',
    );
  }
  return ctx;
}
