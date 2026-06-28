# Domain: auth

Simulated demo login and session handling.

## Conventions
- No real authentication; a one-click "Continue as Demo User" plus visible demo credentials.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->
- Session is a flag persisted to localStorage; logout clears it but never deletes board data.
<!-- added: 2026-06-28 | feature: smart-init | confidence: medium | verified: 2026-06-28 -->

## Patterns
- Route gating — unauthenticated users see the login screen; authenticated users see the board.

## Key Files
- `src/auth/`

## Gotchas
- Reload must keep the user logged in and land them back on the board.
