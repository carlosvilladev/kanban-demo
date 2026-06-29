/**
 * Auth module — public API barrel.
 *
 * Import auth components and hooks exclusively via this barrel
 * to keep the internal module structure refactorable without
 * rippling import changes across the app.
 */
export { AuthProvider } from './AuthContext';
export { useAuth } from './useAuth';
export { LoginScreen } from './LoginScreen';
export { RequireAuth } from './RequireAuth';
export { UserMenu } from './UserMenu';
export { SESSION_KEY, DEMO_USER, DEMO_CREDENTIALS } from './constants';
export type { DemoUser, Session } from './types';
