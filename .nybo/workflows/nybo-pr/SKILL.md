---
name: nybo-pr
description: "[DEPRECATED] use /nybo-ship instead. /nybo-pr now forwards to /nybo-ship and will be removed in v2.0.0."
---

# nybo-pr — DEPRECATED

This skill is deprecated. `/nybo-pr` is merged into `/nybo-ship`.
Scheduled for removal in v2.0.0.

## Behavior

When invoked, emit exactly one line:

```
DEPRECATED: /nybo-pr is merged into /nybo-ship. Forwarding…
```

Then invoke `/nybo-ship <feature>` with the same arguments and exit. The rest of the work is owned by `/nybo-ship`.

## No-mutation guarantee

The shim does NOT mutate `docs/<feature>/status.yaml` or emit events directly. All status transitions, all event emissions, all Jira transitions, and all git operations happen inside the forwarded `/nybo-ship` invocation. The shim is a thin pass-through:

1. Emit the `DEPRECATED:` line.
2. Invoke `/nybo-ship <feature>` (same args).
3. Exit.

If the spec's `status.yaml` already has a status transitioned past `verified` when `/nybo-pr` is invoked, the forwarded `/nybo-ship` will hit its own resume path. The shim must NOT itself contain a status transition or event-emission code path.

## Migration

- Stop running `/nybo-pr <feature>` — run `/nybo-ship <feature>` directly.
- The canonical 7-step closing flow (CHANGELOG, commit, push, PR creation, Quality Report, CI poll, fix loop, done) lives in `src/templates/md/nybo-ship-skill.md`.
- Status transitions and Jira transition are owned by `/nybo-ship` now.
- See CHANGELOG `## [Unreleased] / ### Deprecated` for the removal timeline.

## Removal target

`v2.0.0` (next major). After removal, this file (`.nybo/workflows/nybo-pr/SKILL.md`) is deleted and `getWorkflowSkill("nybo-pr")` returns `undefined`.
