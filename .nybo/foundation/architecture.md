# Architecture — kanban-demo

## Stack

```mermaid
graph TD
  Browser([Browser]) --> FE
  FE["React"] --> API
  API["API"] --> DB
  DB[("localStorage (browser)")]
  API --> Auth["Simulated demo login (no backend)"]
```

## Data Model

```mermaid
erDiagram
  Board {
    string id
    string title
    string columnOrder
  }
  Column {
    string id
    string title
    string taskIds
    string order
  }
  Task {
    string id
    string title
    string description
    string columnId
    string order
  }
  DemoUser {
    string id
    string name
    string avatar
  }
```

## Key Decisions

- File structure: feature-based
- Error handling: Result pattern
- Auth model: Auth model: Simulated demo login with no backend. Login accepts a one-click demo button or displayed demo credentials; a session flag is stored in localStorage. No real credential validation occurs.
