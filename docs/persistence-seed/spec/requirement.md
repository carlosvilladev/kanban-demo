# Kanban Demo — Persistence & Demo Seed Data
## Feature Breakdown by Deliverable

**Version:** 1.0.0
**Project:** kanban-demo
**Date:** June 2026
**Owner:** Demo team

---

## 1. Requirement Overview

This requirement covers how the Kanban demo **keeps its data** and how it **looks
full on first open**. All board state lives in `localStorage` (no backend), saves
automatically on every change, and restores exactly on reload. When no valid saved
state exists — first run or corruption — the app falls back to believable **demo
seed data** so the board is never empty and never crashes. A **Reset demo** action
returns the board to its original seed for a clean replay.

| Axis | What it solves | For whom |
|---|---|---|
| Persistence | Every change survives a reload with zero manual save | Demo user |
| Resilience | Missing/corrupt storage degrades gracefully to seed, never empty | Demo user |
| First impression | Board opens "lived-in" with realistic seeded tasks | Demo user |
| Replayability | One-click reset to the original seed | Presenter |

---

## 2. Detailed Features

> Two atomic features in one spec; both are System-driven with a single user-facing
> action (Reset demo). Source of truth for [spec.md](./spec.md).

---

### F-01: localStorage Persistence (System)

**Description**
All board state (columns, their order, and tasks) is persisted to `localStorage`
through a single persistence module. Every create/edit/delete/move/reorder auto-saves;
a reload restores the exact saved state. Missing or corrupt state never crashes the
app — it falls back to seed.

**Actor:** System (automated persistence layer)
**Priority:** Must
**Screen:** — (no dedicated UI; integrates with the board)

#### Business Rules

| ID | Rule |
|---|---|
| BR-001 | All board state persists to `localStorage` under one namespaced, versioned key (`kanban-demo:board`, envelope `{ version, data }`). (FR-P1) |
| BR-002 | Every state change (create, edit, delete, move, reorder) auto-saves; there is no explicit "save" action. (FR-P2) |
| BR-003 | On load, valid saved board state is restored exactly — same columns, tasks, and order. (FR-P3) |
| BR-004 | Missing, unparseable, version-mismatched, or structurally invalid saved state falls back to seed data; the app never crashes or renders an empty board. (FR-P4) |
| BR-005 | All `localStorage` access goes through the one persistence module; components never touch `localStorage` directly. (domain convention) |

#### Acceptance Criteria

| ID | Criterion | Expected Result |
|---|---|---|
| AC-001 | After the user makes changes, reloading restores the exact saved board | PASS: columns, tasks, and order match pre-reload state |
| AC-002 | Any state change is persisted without a manual save | PASS: the stored value reflects the new state immediately |
| AC-003 | App loads with no saved state present | PASS: seed board renders (not empty) |
| AC-004 | App loads with corrupt saved state (bad JSON / wrong version / invalid shape) | PASS: falls back to seed; no crash, no empty board |
| AC-005 | Components obtain state from the in-memory source of truth, not `localStorage` | PASS: only the persistence module reads/writes `localStorage` |

---

### F-02: Demo Seed Data & Reset (System / Demo User)

**Description**
On first run the app seeds a default board with three fixed columns (To Do /
In Progress / Done) and realistic demo tasks distributed across them. Seeding runs
only when no valid saved state exists; once the user has saved changes, that state
takes precedence. A Reset demo action clears saved state and restores the original
seed.

**Actor:** System (seeding) · Demo User (triggers Reset demo)
**Priority:** Must
**Screen:** — (Reset demo is a single control surfaced by the app shell)

#### Business Rules

| ID | Rule |
|---|---|
| BR-006 | On first load (no valid saved state), seed a board with the three fixed columns and realistic demo tasks distributed across them. (DD-1, DD-2) |
| BR-007 | Every seed task has a non-empty title and a short description so cards look realistic. (DD-3) |
| BR-008 | The seed factory is deterministic — identical output on every call (stable ids, no randomness or timestamps) so "original seed" is well-defined. (DD-4 enabler) |
| BR-009 | "Reset demo" clears saved state and re-applies the original seed, then persists it. (DD-4) |
| BR-010 | Seeding runs only when no valid saved state exists; restored user state always takes precedence over the seed. (DD-5) |
| BR-011 | Each task belongs to exactly one column — never zero, never two. (invariant-1) |

#### Acceptance Criteria

| ID | Criterion | Expected Result |
|---|---|---|
| AC-006 | First load with no saved state | PASS: To Do / In Progress / Done shown, ≥6 tasks distributed, ≥1 per column |
| AC-007 | Inspect the seed board | PASS: every task has non-empty title + description and appears in exactly one column |
| AC-008 | User modified state exists, then app reloads | PASS: saved state shown; seed does NOT overwrite it |
| AC-009 | User triggers Reset demo on a modified board | PASS: saved state cleared, original seed shown and persisted |
| AC-010 | `createSeedBoard()` called twice | PASS: outputs are deeply equal (deterministic) |

---

## 4. Non-Functional Requirements

| ID | Category | Description | Threshold | Measurement Condition |
|---|---|---|---|---|
| NFR-1 | Zero setup | Runs as a static frontend; no server, DB, or config to persist data | 0 backend calls; storage is `localStorage` only | App opened from a static build |
| NFR-4 | Reliability | No data loss on reload; corrupt state degrades to seed; board never empty/crashed | 0 data-loss reloads; 0 crashes on corrupt input | Reload + fuzzed/corrupt storage values |

---

## 6. Flags and Pending Items

| Flag | Description | Responsible | Blocks |
|---|---|---|---|
| ℹ Shared type | `BoardState`/`Column`/`Task` is owned by the `kanban-board` feature (`src/types/board.ts`). If persistence is implemented first, it creates a minimal interim type to be reconciled. | Dev | F-01 (type import) |
| ℹ Session restore | The login-session half of FR-P3 is owned by `demo-auth`; this spec restores board state only. Both read `localStorage` on app init. | Dev | — |

---

*This document is the product input for the SDD — see [spec.md](./spec.md).*
