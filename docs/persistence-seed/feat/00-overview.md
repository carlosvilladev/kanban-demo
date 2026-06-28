# Persistence & Demo Seed Data - Overview

## Spec Reference

[Spec](../spec/spec.md) · [Requirement](../spec/requirement.md)

## Problem + Solution

- The demo has no backend, yet must keep every change across reloads and look full on first open — without manual saving or crashing on bad data.
- Solution: a single `localStorage` gateway (`src/storage/`) plus a deterministic seed factory (`src/seed/`) wired together by a load-or-seed lifecycle and an auto-persist hook.
- Key technical approach: versioned envelope `{ version, data }` at one namespaced key; safe parse + structural validation; corrupt/missing → seed fallback; write-through on every state change.
- Output: durable board state, believable first-run seed, and a Reset demo action — all client-side.

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Board["kanban-board (consumer)"]
        Provider["Board state provider"]
    end
    subgraph Storage["src/storage/"]
        Keys["keys.ts (key + SCHEMA_VERSION)"]
        Store["boardStorage.ts (read/write/clear + validate)"]
        Life["boardLifecycle.ts (loadInitialBoard / resetDemo)"]
        Hook["useAutoPersist.ts"]
    end
    subgraph Seed["src/seed/"]
        SeedFn["seedData.ts (createSeedBoard)"]
    end
    LS[("localStorage")]

    Provider -->|init| Life
    Provider -->|state changes| Hook
    Life -->|read/validate| Store
    Life -->|fallback / first run| SeedFn
    Hook -->|writeBoard| Store
    Store --> Keys
    Store --> LS

    style Store fill:#e1f5ff
    style Life fill:#e1f5ff
    style SeedFn fill:#e1f5ff
```

## Data Model

No new persisted DB entities. `BoardState` is consumed from `kanban-board`
(`src/types/board.ts`); this feature serializes it inside a versioned envelope.

```mermaid
classDiagram
    class PersistedEnvelope {
        +version: number
        +data: BoardState
    }
    class BoardState {
        +columns: Record~ColumnId,Column~
        +columnOrder: ColumnId[]
        +tasks: Record~string,Task~
    }
    PersistedEnvelope "1" --> "1" BoardState
```

## Task Index

| Task | File | Description | Dependencies |
|------|------|-------------|--------------|
| T1 | [01-plan-01-storage-module.md](./01-plan-01-storage-module.md) | Single `localStorage` gateway: keys, versioned envelope, read/write/clear, validation | None (consumes `BoardState`) |
| T2 | [01-plan-02-seed-factory.md](./01-plan-02-seed-factory.md) | Deterministic demo seed: 3 columns + realistic tasks | None (consumes `BoardState`) |
| T3 | [01-plan-03-load-and-reset.md](./01-plan-03-load-and-reset.md) | `loadInitialBoard` (load-or-seed, persist seed) + `resetDemo` | T1, T2 |
| T4 | [01-plan-04-auto-persist.md](./01-plan-04-auto-persist.md) | `useAutoPersist` hook + Reset demo binding (seam to board provider) | T3 |

## Dependency Graph

```mermaid
flowchart LR
    T1["T1: storage module"]
    T2["T2: seed factory"]
    T3["T3: load + reset"]
    T4["T4: auto-persist hook"]

    T1 --> T3
    T2 --> T3
    T3 --> T4

    style T1 fill:#d4edda
    style T2 fill:#d4edda
    style T3 fill:#d4edda
    style T4 fill:#d4edda
```
