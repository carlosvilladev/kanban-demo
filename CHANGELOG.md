# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- feat(kanban-board): three fixed columns (To Do / In Progress / Done) with full task create, edit, and delete — the board foundation and single source-of-truth store consumed by every other feature.
- feat(persistence-seed): localStorage gateway, deterministic demo seed, and auto-save on every change — a zero-setup board that survives reload and restores cleanly via reset-demo.
- feat(demo-auth): simulated login, session store, route gate, and logout — gated demo entry with no backend; logout clears the session but never touches board data.
- feat(drag-and-drop): dnd-kit reorder within a column and move across columns with ghost preview and insertion placeholder — the core showcase interaction, with cancel semantics that never duplicate or lose a task.
