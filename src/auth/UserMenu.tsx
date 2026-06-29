/**
 * UserMenu — signed-in badge + logout control.
 *
 * Renders the demo user's initials avatar, "Logged in as Demo User" label,
 * and a "Log out" button. Calls useAuth().logout() on click.
 *
 * Only visible when authenticated (render only inside the RequireAuth / gated subtree).
 */
import { useAuth } from './useAuth';
import { DEMO_USER } from './constants';
import './UserMenu.css';

export function UserMenu() {
  const { logout } = useAuth();

  return (
    <div className="user-menu">
      <span className="user-menu__avatar" aria-hidden="true">
        {DEMO_USER.avatar}
      </span>
      <span className="user-menu__label">Logged in as Demo User</span>
      <button type="button" className="user-menu__logout" onClick={logout}>
        Log out
      </button>
    </div>
  );
}
