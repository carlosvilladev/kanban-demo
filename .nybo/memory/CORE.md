# CORE.md — kanban-demo
# Always loaded by every nybo skill. Keep under 50 lines.

## Project
A frontend-only demo drag-and-drop Kanban board. Showcases a simulated login, a board pre-seeded with realistic demo tasks, full task CRUD, and fluid drag-and-drop across fixed columns. All state persists to localStorage; there is no backend. Purpose is to impress in a short, zero-setup walkthrough.

## Working Directory
.

## Key Commands
- Dev: npm run dev
- Build: npm run build
- Test: npm run test
- Lint: npm run lint

## Stack
- Runtime: Node.js
- Framework: React
- Language: TypeScript
- Database: localStorage (browser)
- Auth: Simulated demo login (no backend)

## Universal Conventions
- This is a demo — prioritize zero setup, believable seed data, and visual polish over completeness.
- No backend and no real auth; the entire app runs client-side.
- TypeScript throughout; functional React components with hooks.
- A task belongs to exactly one column at any time.
- No drag-and-drop outcome (success or cancel) may duplicate or lose a task.
- Demo seed data is applied only when no saved state exists in localStorage.
- Once the user modifies state, their saved state takes precedence over the seed.
- Corrupt or missing localStorage state must fall back to seed data — never crash or show an empty board.
- Every state change (create, edit, delete, move, reorder) auto-persists to localStorage; there is no manual save.
- Logging out clears the session but never deletes board data.

## Active Domains
Source: `.nybo/memory/domains/<name>.md`
board · drag-and-drop · persistence · auth

## Notes
- requirements.md already exists and defines the demo scope (login, seeded board, task CRUD, drag-and-drop, localStorage, reset demo).
- Greenfield — no source code yet; stack chosen as React + Vite + TypeScript with dnd-kit and Vitest.
- localStorage is the only persistence layer; there is intentionally no backend or database.
