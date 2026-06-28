---
name: clean-code
description: Orchestrates /solid and /cqrs across the current PR/branch, auto-corrects deterministic bad practices in place, and updates the project's accumulating clean-code ADR. Default is auto-fix (no commit); pass --confirm to review proposed diffs first. Use --init on first run for a brownfield bootstrap that scans the whole project and seeds the backlog.
argument-hint: "<scope: 'pr' (default) | 'branch' | <path> | <glob>> [--init] [--confirm] [--solid-only|--cqrs-only] [--apply-suggestions <id...>] [--show-suggestions [filter]] [--dismiss <id> --reason '<text>']"
# --init: seed or refresh the suggestions backlog. Safe to run again — re-runs discovery and merges findings into the existing file.
---

# /clean-code

End-to-end clean-up loop: **review → fix → verify → record**. Wraps `/solid` and `/cqrs`, applies fixable findings in place, then updates `.nybo/foundation/adrs/code-practice.yml` with conventions, patterns, and suggestions so future runs build on prior work. Never commits or pushes.

## Scope

Default: current PR diff if a PR exists for the branch, else branch diff vs base.

Resolution order:
1. User argument (path, glob, commit range, or `branch` / `pr`)
2. `gh pr view --json files -q '.files[].path'` if a PR exists for current branch
3. `git diff --name-only origin/HEAD...HEAD`
4. Staged + unstaged
5. Ask the user

Filters: same as `/solid` (drop generated, vendor, tests-unless-explicit). Hard cap: 30 files per run.

## Modes

- **Default (auto-fix)**: apply every deterministic fix in place. After each batch, run the project test command. Stop on first red. Surface non-fixable findings as advisory output.
- **`--confirm`**: do not edit. Present findings + per-file proposed diff. Wait for approval, then apply.
- **`--solid-only`** / **`--cqrs-only`**: skip the other reviewer. Default runs both (CQRS skipped automatically if no conventions detected).
- **`--init`**: brownfield bootstrap. One-time wholesale scan of selected trees to seed the suggestions backlog. No edits, no fix loop. See § 0.
- **`--apply-suggestions <id...>`**: pull one or more suggestions from the backlog and apply them through the normal fix loop (TDD gate included). On success, remove from main `suggestions:` and append a full record to `code-practice-history.yml#applied[]`; the ID is mirrored in main `last_run.applied_ids`. See § 4b.
- **`--show-suggestions [filter]`**: read-only listing of the open backlog. No scan, no edits. Optional filter is a substring matched against `pattern` or `file`.
- **`--dismiss <id> --reason "<text>"`**: remove a suggestion from main `suggestions:` and append it to `code-practice-history.yml#dismissed[]` with the supplied reason. Never re-suggested as long as the dismissed entry exists.
- **`--apply-pattern <pattern-id> --to <file | suggestion-id | glob>`**: read a saved pattern from the `patterns:` section and apply its `transform:` steps to the named target. Goes through the standard fix loop (TDD gate, baseline + post-batch test runs, revert on red). See § 5c.
- **`--show-patterns [filter]`**: read-only listing of all saved patterns (id, name, decided_in_adr, callers_pattern, examples). No scan, no edits.

## § 0. `--init` mode (brownfield bootstrap)

Run once at project onboarding. Goal: seed `code-practice.yml` with a prioritised backlog of pattern suggestions covering the whole codebase, so subsequent diff-scope runs can chip away at it.

### 0.1 Discovery

- If `code-practice.yml` already exists, **re-run discovery and merge**: preserve all existing `conventions:`, `waivers:`, `patterns:`, and open `suggestions:`; add new suggestions from the scan (skip IDs already in the backlog for the same `(file, smell, pattern)` triple); overwrite `last_run:` with `mode: init`. Never prompt for `--force-init`.
- Walk the repo from the root, **one level deep**, and detect candidate trees:
  - Monorepo signals: `apps/*`, `packages/*`, `services/*`, `libs/*`, `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, root `package.json` with `workspaces:`, `go.work`, `Cargo.toml` with `[workspace]`, `pyproject.toml` with `[tool.poetry.group]`/`[tool.uv.workspace]`.
  - Single-project signals: `src/`, `app/`, `lib/`, `cmd/`, language-root dirs (`pkg/` for Go, `internal/`).
- Auto-detect the project test command exactly as in § 1. If absent, ask once.
- For each candidate tree, count BOTH source and test files separately. Test files = anything matching `*.test.*`, `*.spec.*`, `tests/**`, `__tests__/**`. Source files = all other code files in the tree, with the standard `/solid` filters applied (drop generated, vendor).
- Present a numbered list to the user. Always display source AND test counts so the user can see at a glance whether tests exist — never report "no tests" when the count is zero only because tests were filtered out of the source count. Example:
  ```
  Detected candidate trees:
    1. src/                (TypeScript, 412 source · 108 tests)
    2. packages/api/       (TypeScript, 134 source · 41 tests)
    3. packages/web/       (TypeScript + React, 287 source · 0 tests ⚠)
    4. services/worker/    (Python, 56 source · 12 tests)
  Test command detected: `make test`
  Which trees should I analyse? (comma list of numbers, `all`, or explicit paths)
  ```
- If a tree shows `0 tests`, flag it with ⚠ in the listing — the user should know before they pick it as init scope, since the downstream fix loop will demote behaviour-changing rules to advisory there (§ 1b).
- Wait for the user's answer. Resolve into a final list of root paths.

### 0.2 Scan

- For each selected tree, traverse recursively with the same filters as `/solid` (drop generated, vendor, tests-unless-asked).
- **No file cap.** Init scans every file in the selected trees. Brownfield bootstraps must be exhaustive — sampling produces a backlog with blind spots and gives a false sense of coverage. If the selection is huge (≥ 1000 source files), warn the user once with the count and the expected scan time, but still scan everything unless they explicitly narrow.
- Run the full 41-rule catalog via `/solid` (+ `/cqrs` if convention detected) **with diff-mode disabled** — every file is fair game.
- Detect-only. No fixes. No test runs. No characterization tests.
- Use bulk grep over the tree (one query per smell pattern) rather than reading files one by one — keeps cost flat regardless of file count.
- **Also run pattern-in-use detection** (§ 0.2.1). Smells become `suggestions:`; recurring structural patterns become `patterns:` proposals.

### 0.2.1 Pattern-in-use detection

Init does TWO kinds of detection:
- **Smells** (anti-patterns) — already covered. Output goes to `suggestions:`.
- **Patterns in use** (repeating structures) — propose entries for `patterns:` so future `/clean-code --apply-pattern` runs can re-apply them.

Detection heuristics — a structural signature qualifies as a pattern when:
- ≥ 5 files match the same signature, OR
- ≥ 3 files match AND the signature appears in `.claude/rules/*.md`, `CLAUDE.md`, or `CORE.md` as a documented convention/invariant.

Examples of pattern signatures to surface (project-agnostic — adjust per repo):
| Signature | Pattern name | Evidence threshold |
|---|---|---|
| `static getInstance` + `private constructor` across N classes | Singleton service | N ≥ 5 |
| `deletedAt: null` filter on Prisma queries | Soft-delete | ≥ 5 callsites |
| Two-pass insert (`managerId: null` then UPDATE) | Two-pass-for-circular-FK | ≥ 1 + comment |
| `requireSession` / `requireAnyCapability` at route entry | Guard-first route handler | ≥ 5 routes |
| `container.resolve(...)` or DI container imports | DI-via-container | ≥ 3 callers |
| Repeated `<Method>Params` interface for > 4 params | Param-object extraction | ≥ 3 |
| Adapter / facade / strategy / observer used N times | (corresponding GoF pattern) | ≥ 3 callsites |

Also seed `patterns:` from these knowledge sources (no detection threshold — direct import):
- `CORE.md` Universal Conventions section
- `.claude/rules/nybo-universal.md`, `.claude/rules/nybo-<domain>.md`
- existing `conventions:` entries in `code-practice.yml` (cross-link via `decided_in_adr:` if no ADR yet, create a placeholder ADR-NNN and link both)

Each proposed pattern shows its `match.detector`, `transform:` steps (inferred from the existing examples), and ≥ 2 example files. User confirms before write — never auto-add.

Cost discipline: pattern detection uses the same bulk-grep approach as smell detection. One pass over the tree, multiple signature greps in parallel.

### 0.3 Prioritise + assign IDs

Each finding becomes a suggestion with a stable ID. Sort the list before assigning IDs, so lower IDs are higher impact and the IDs survive across runs.

Priority key (descending):

1. **Lane**: `auto-fix` > `confirm-required` > `advisory`
2. **Clustering**: same `(pattern, file)` with ≥ 3 callsites > scattered single occurrences
3. **File criticality**: recently-touched (top 25% of git-log `--since=90.days` churn) > rest
4. **Pattern severity**: smells that hurt testability (DIP misuse, Singleton misuse, async constructor) > smells that hurt readability (long parameter list, primitive obsession)

Assign IDs `S-001`, `S-002`, … in priority order. Pad to 3 digits so they sort lexicographically. IDs never get reused — when a suggestion is applied or dismissed, its ID retires.

### 0.4 Write `code-practice.yml`

- Seed from the org template (§ 7) on first run; merge into existing file on re-run.
- `last_run.mode: init`.
- `last_run.counts.suggestions`: total suggestions seeded (new ones only on re-run).
- `suggestions:`: the full backlog (additive on re-run).
- `verdict: needs-human-review` (a backlog by definition is open work).
- `verdict_blocks_loop: false` (backlogs don't block the loop; they're already long-running).

### 0.5 Init report

```
# /clean-code --init — done

**Trees analysed:** src/, packages/api/
**Files scanned:** 198 of 200 cap (2 skipped — see below)
**Suggestions seeded:** 47
  - 12 auto-fix · 19 confirm-required · 16 advisory
**Top 10 (by priority):**
| ID | Pattern | Lane | File:Line | Smell |
|---|---|---|---|---|
| S-001 | Strategy | auto-fix | src/lib/billing.ts:88 | switch on `invoiceType` across 6 branches |
| ...

**Next steps:**
- Inspect: `/clean-code --show-suggestions`
- Apply highest-impact batch: `/clean-code --apply-suggestions S-001 S-002 S-003`
- Dismiss something you've decided not to do: `/clean-code --dismiss S-014 --reason "legacy module, scheduled for rewrite"`
- Run as usual on PRs/diffs: `/clean-code` (will add new smells from the diff to the same backlog)
```

### 0.6 Hard rules for init

- **No edits. No test runs. No commits.** Init is detect-only.
- **Safe to re-run.** If the file already exists, merge new findings in — never refuse.
- **No file cap.** Scan every file in the selected trees. Warn at ≥ 1000 files but still scan everything.
- **No suggestions for files outside the trees the user selected.**

## Workflow

### 1. Pre-flight

**Mode routing:** if invoked with `--init` → follow § 0 instead of this section. If invoked with `--show-suggestions` or `--dismiss` → follow § 5b (no scope, no baseline, no fix loop). If invoked with `--apply-suggestions` → run § 1 + § 1b + § 1c + § 4 (skip § 2 review — backlog already names the work).

- Resolve scope. Print: `clean-code: scope=<resolved> · mode=<auto|confirm> · reviewers=<solid,cqrs?>`.
- Read `.nybo/foundation/adrs/code-practice.yml` if present — load `conventions`, `waivers` into working memory. Use waivers to silently skip findings; use conventions to bias the fix toward the project's chosen patterns.
- Verify clean-ish working tree: if there are uncommitted changes in files OUTSIDE the scope, ask before proceeding.
- Identify the project test command: `Makefile` (`make test`) → `package.json` scripts (`test`) → `pytest.ini`/`pyproject.toml` → `pom.xml` → `build.gradle` → `Cargo.toml`. Save as `$TEST_CMD`. If none found, ask once. If still none: **stop** — clean-code refactors are not safe without a test suite. Surface findings as advisory-only, skip auto-fix entirely, write the run to the yaml with `tdd_cycle_completed: false`, and return.
- **Establish the baseline.** Run `$TEST_CMD` (full suite) before any edit. Save the result as `$BASELINE`. If the baseline is red: stop and surface the failure — the skill never refactors on top of a broken suite (no signal to detect regressions). Ask the user to fix the baseline first.

### 1b. TDD discipline (mandatory)

Clean-code refactors must preserve observable behaviour. The skill enforces a per-rule, per-file Red→Green discipline adapted for refactor work:

1. **Coverage check.** Before applying a rule to a file, verify tests exist that exercise the affected behaviour. Use `git grep` for the symbol name across `**/*.test.*`, `**/*.spec.*`, `tests/**`, `__tests__/**`. The check is heuristic but tight — if no test references the symbol or its public callers, treat the area as uncovered.
2. **Characterization tests when uncovered.** If a file is uncovered AND the rule changes any observable behaviour (DTO introduction, return-type change, naming change of an exported symbol, value-object substitution, command/query handler rename), the skill must:
   - Write a characterization test that captures the **current** behaviour (calls the symbol with representative inputs, asserts the existing outputs) at the project's standard test seam.
   - Run it — it must be **green** against the current code (this is the "red→green snapshot" for refactor work: the test is born green and must stay green through the refactor).
   - If the characterization test cannot be written deterministically (e.g. side effects across services, fixtures unavailable), **demote the finding to advisory** for this run. Do not refactor blind.
3. **Pure-refactor exemption.** Rules that do not change any observable behaviour (readonly wrap on a private collection, comment cleanup, in-file param-object extraction with adapter overload, primitive obsession when wrapper has identical equality semantics) may skip step 2 — but must still pass step 1 (some test must cover the area).
4. **Green-after gate.** After each rule's edits are applied, the relevant tests (characterization + pre-existing ones touching the changed files) must pass before the batch is accepted. This is checked inside step 4 below.
5. **Refactor classification.** For each applied rule, record in the yaml: `tdd: { coverage: pre-existing | characterization-added | exempt, characterization_tests: [<paths>] }`.

This is a hard gate. The skill never edits behavioural code without a passing test that would catch a regression.

### 1c. Backlog hygiene (open `suggestions:` reconciliation)

Runs at the start of every non-init run, before § 2. Goal: keep the backlog honest by retiring suggestions whose smell has disappeared without going through `--apply-suggestions`.

For each entry in `suggestions:`:

1. **File existence.** If `file` no longer exists → move to `dismissed:` with `reason: file deleted`, `resolved_externally: true`. Record `resolved_in_run: <last_run.timestamp>` and the current `head_sha`.
2. **Smell still present.** Re-run the rule's red-flag detector on the file (cheap — single grep against the rule's pattern). If the smell is gone → move to `dismissed:` with `reason: smell no longer present`, `resolved_externally: true`. Record the SHA where it vanished by walking `git log --follow <file>` for the most recent commit that touched the affected lines.
3. **File moved.** If the file path no longer exists but `git log --follow` finds a rename → update `file:` in place, keep the suggestion open, log `renamed_from:` for traceability.
4. **Symptom changed.** If the rule fires but on a different line, update `line:` in place. Don't move to dismissed.

Cap: process at most 100 open suggestions per run to bound cost. If backlog > 100, rotate — process oldest-untouched first (use a `last_checked_at` field; round-robin). The `last_checked_at` field lives on each suggestion entry; bump on every check.

Report the hygiene outcome in the final report (§ 8) under a new line: `Backlog hygiene: <X> resolved externally · <Y> renamed · <Z> line-shifted · <K> unchanged`. If `X > 0`, list the resolved IDs.

### 2. Review

Run `/solid` against scope. Capture findings.

Detect CQRS conventions across the repo: grep for `**/commands/**`, `**/queries/**`, `**/handlers/**`, `*Command*`, `*Query*`, `*Handler*`, `*Bus*`. If present (and not `--solid-only`): run `/cqrs`, capture findings. If `--cqrs-only`: run only `/cqrs`.

Merge findings, dedupe by `(file, line, rule)`. Subtract anything matching a waiver in `code-practice.yml`.

### 3. Classify — fixable vs advisory

**Fixable** = deterministic mechanical edit. **Advisory** = needs human architectural call.

**Pattern-suggestion flow.** Every bad-practice smell (long switch-on-type, if/else handler ladder, subclass-per-feature chain, N×M class explosion, etc.) is mapped to a GoF pattern. If the rewrite is mechanical, the pattern goes into the **Fixable** lane and gets applied automatically (subject to the TDD gate). If the rewrite needs design judgment, the pattern goes into the **Pattern Suggestions** lane — surfaced in the report, recorded in the yaml `suggestions:` array, but never auto-edited. A suggestion can be promoted to a fix in a later run with `--apply-suggestions <pattern>` once the human has approved the design.

#### Auto-fixable

| Rule | Fix |
|---|---|
| Long parameter list (> 4) | Extract parameter object `<MethodName>Params`. Update callers in scope. |
| Direct `new` of injectable concrete (PrismaClient, HttpClient, fetch, fs) in business logic | Constructor injection. Add interface/port only if project already uses DI; else advisory. |
| Constructor I/O / side effect | Extract to static factory `create()` returning `Promise<T>`. |
| Returning mutable internal collection | Wrap in `Readonly<...>` / `Collections.unmodifiableList(...)`. |
| Public mutable field | Private + getter; setter only if previously written externally. |
| `null` return where `Optional`/`?` fits | Change return type, update internal returns + direct callers in scope. |
| Imperative command-handler name | Rename file + class to imperative form. Update imports in scope. |
| Query handler returning domain entity | Introduce `<Name>ReadDto`, map fields, change return type. |
| Mutation in a query handler | Move write to a new command + dispatch, or to a projector. **Confirm-required** unless `--auto-aggressive`. |
| Direct `new` of a handler | Replace with bus dispatch / DI lookup. Confirm-required if bus shape absent. |
| Handler-to-handler call | Replace with bus dispatch or domain event. Confirm-required. |
| `switch`/`isinstance` on type tag (> 3 cases) | **Strategy pattern**: polymorphic dispatch via `Map<tag, handler>` when handlers are pure; else advisory. |
| Primitive obsession (≥ 3 occurrences in scope) | Introduce value object. Replace usages in scope. Confirm-required. |
| Comment-only "what" noise | Delete (matches global convention). |

#### GoF — fixable when smell is mechanical

The skill suggests a GoF pattern whenever the code smell that signals it is mechanically rewritable. Severity = the badness of the smell, not the elegance of the pattern.

| Smell (red flag) | Pattern suggested | Fix |
|---|---|---|
| `switch`/`if`-ladder on enum/type-tag (≥ 3 cases) selecting algorithm body | **Strategy** | Extract one function per case → `Map<tag, fn>`; dispatch via lookup. Auto-fix when cases are pure; confirm-required if any case touches I/O. |
| `if/else if` ladder of handler calls ending in `else throw/return null` (≥ 3 links) | **Chain of Responsibility** | Extract handler interface + ordered chain; each handler returns `next.handle(req)` or result. Confirm-required. |
| `switch`/`if` on `state`/`status` field repeated in ≥ 3 methods of same class | **State** | One class per state, transitions return next state. Confirm-required (requires closed state set). |
| Near-duplicate methods across subclasses differing in 1–2 steps | **Template Method** | Lift skeleton to abstract base; subclasses override only the differing hooks. Confirm-required. |
| Chained `instanceof` / type-tag dispatch for adding operations | **Visitor** | Add `accept(visitor)` to type hierarchy; introduce visitor interface. Confirm-required. |
| Inline per-callsite translation between two interfaces (≥ 3 callsites) | **Adapter** | Extract `<Source>To<Target>Adapter` implementing target interface; replace callsites. Auto-fix when translation is pure. |
| Client orchestrates ≥ 4 subsystem objects to perform one operation, repeated ≥ 2 places | **Facade** | Extract `<Subsystem>Facade.<operation>()`; replace callsites. Confirm-required. |
| Constructor with > 4 optional params OR chained setters to assemble an immutable | **Builder** | Generate `<Type>Builder` with fluent setters + `build()`. Confirm-required. |
| Index/key-based traversal of a collection accessor (`for (let i...) obj.items[i]`) | **Iterator** | Replace with `for...of` over an `Iterable`; expose iterator on owner type. Auto-fix when collection access is read-only. |
| Repeated inline lazy-init or access-check at every callsite | **Proxy** | Wrap the resource in a Proxy class with the same interface; route callers through it. Confirm-required. |
| Subclass-per-feature chain (`LoggingX extends BaseX`, `CachingLoggingX extends LoggingX`, ...) | **Decorator** | Convert features to stackable decorators sharing the interface. Confirm-required. |
| Tree code with leaf-vs-branch `if (isLeaf)` duplicated everywhere | **Composite** | Common interface for leaf + branch; recursion lives on the type. Confirm-required. |
| N×M class explosion from variant combos | **Bridge** | Split abstraction from implementation; compose at runtime. Confirm-required. |
| Repeated manual deep-copy code for one type (≥ 3 callsites) | **Prototype** | Add `clone()` to the type; replace callsites. Auto-fix. |
| `new` of concrete type inside a class that branches on input to pick subtype | **Factory Method** | Extract `create<X>(input)` factory function or method; route construction through it. Confirm-required. |
| Hidden global state via `static getInstance()` / module-level mutable accessed by ≥ 3 callers | **Singleton (remove misuse)** | Convert to injected dependency; constructor takes the instance. Confirm-required (touches DI wiring). |
| Caller polls/loops to detect change in another object | **Observer** | Introduce `subscribe(handler)` / `unsubscribe`; emit on change. Confirm-required. |
| Rollback logic mutating state back, OR internal state exposed via getters/setters for external rollback | **Memento** | Replace exposed setters with `save(): Memento` / `restore(m)`. Confirm-required. |

#### GoF — advisory only (architectural)

Suggest the pattern, never auto-edit. These require human design judgment:

- **Abstract Factory** — family-of-types factories
- **Flyweight** — needs memory profile evidence
- **Mediator** — N² coupling redesign
- **Command** — undo/queueing/audit infra
- **Interpreter** — DSL/grammar design
- **Active Object** / **Half-Sync-Half-Async** / **Monitor** — concurrency redesigns; suggest only, never rewrite
- Singleton removal that touches > 5 files outside scope

#### Advisory only (never auto-edit)

- SRP god-object split · ISP fat-interface split · LSP subtype redesign
- Composition-vs-inheritance swap
- Read-then-return command, read-model write outside projector, missing staleness contract, missing correlation id
- Public-API naming changes (callers outside scope)
- Any change touching > 5 files OUTSIDE resolved scope

Print: `<F> fixable · <A> advisory`.

### 4. Apply (auto mode)

Process fixable findings in **risk order**:
1. In-file single-symbol edits (param object, readonly wrap, null→Optional)
2. Multi-symbol in-file (constructor I/O, primitive obsession)
3. Cross-file in scope (DI rewiring, handler renames, DTO introduction)
4. Cross-file with new files (value objects, DTOs, projectors)

Batching (TDD-driven):
- Group edits by rule. For each rule:
  1. Run pre-flight TDD checks (§ 1b) on every file the rule will touch.
  2. Add any required characterization tests; confirm they are green against the current code.
  3. Apply the rule's edits across all files in the batch.
  4. Run **the targeted tests** for the changed files first (fast feedback). If red → revert that batch (`git checkout -- <files>` for that batch only, including any characterization tests written for it), mark `failed`, record the failure summary in the yaml, continue to the next rule.
  5. If targeted tests pass, run `$TEST_CMD` (**full project suite**) to catch cross-module regressions. If red → revert the batch, record `reverted_by: full-suite`, continue.
  6. If both pass, keep the batch and move on.
- Never `git add`, never commit, never push.

Per-file edit policy:
- `Edit` with unique anchors, not `Write`. Preserve formatting + import order.
- No unrelated reformatting.
- Skip generated files even if in scope.

### 5. Apply (confirm mode)

Render unified-diff previews per fixable finding. After all previews:

> Apply N fixes across M files? Reply `yes`, `no`, or list rules to apply (e.g. `dip, naming`).

Apply selectively, run `$TEST_CMD`, same revert-on-fail behaviour.

### 5b. Backlog-driven flows

These three flags operate on the persisted `suggestions:` array in `code-practice.yml`. They bypass the diff-scope resolver because the backlog already names the files.

#### `--apply-suggestions <id...>`

- Read the named suggestion IDs from the backlog. Refuse if any ID is unknown, dismissed, or already applied (print which one + suggest `--show-suggestions`).
- For each suggestion, resolve `(file, line, pattern)` and verify the smell is still present. If gone (file deleted, code rewritten manually) → mark `resolved_externally: true`, move to `dismissed:` with `reason: smell-no-longer-present`, skip.
- Run the standard fix loop (§ 4) treating each suggestion as a fixable finding. The lane recorded on the suggestion determines behaviour:
  - `lane: auto-fix` → applied through the auto-fix path.
  - `lane: confirm-required` → if invoked in auto mode, surface preview + ask for confirmation per suggestion (single-batch). In `--confirm` mode it's already preview-first.
  - `lane: advisory` → refuse. Print: *"Suggestion `S-014` is advisory-only — it needs human design judgment, not a mechanical rewrite. Implement manually and dismiss with `--dismiss S-014 --reason '<text>'`."*
- TDD gate applies as in § 4 (characterization tests if uncovered).
- On success per suggestion: remove from main `suggestions:`; append the full record to `code-practice-history.yml#applied[]` with the same ID; record `applied_at`, `applied_in_run: <last_run.timestamp>`; mirror the ID in main `last_run.applied_ids`. ID retires.
- On failed batch: leave the suggestion in `suggestions:`; bump `attempts` counter and append a short `last_failure: { run, reason }` field. If `attempts >= 3`, append `needs_human: true`.

#### `--show-suggestions [filter]`

Read-only. No scan, no edits, no full-suite run. Print:

```
# /clean-code suggestions — <N> open · <M> dismissed · <K> retired

## Open (priority order)
| ID | Lane | Pattern | File:Line | Smell |
|---|---|---|---|---|
| S-001 | auto-fix | Strategy | src/lib/billing.ts:88 | switch on invoiceType across 6 branches |

## Recently dismissed (last 10)
| ID | Pattern | Reason | Dismissed at |
|---|---|---|---|

## Retired (last 10 applied)
| ID | Pattern | File | Applied in run |
|---|---|---|---|
```

Filter syntax: substring match against `pattern` (`strategy`), `file` (`src/lib`), or `lane` (`auto-fix`). Combine with commas.

#### `--dismiss <id> --reason "<text>"`

- Require both args. Reason must be ≥ 8 characters.
- Remove the entry from main `suggestions:` and append it to `code-practice-history.yml#dismissed[]` preserving the ID.
- Add `dismissed_at`, `reason`. Do not delete; dismissed IDs are remembered so the skill never re-suggests them.
- If the suggestion ID is already in history `applied[]` or `dismissed[]`, refuse with a clear error.

### 5c. Pattern-driven flows

The `patterns:` section of `code-practice.yml` is the project's saved playbook of mechanical transformations. Patterns get into the section via two routes:

1. **`/pattern-discover` skill** — captures a decision made in conversation (e.g. "from now on use awilix DI"). One-shot, manual.
2. **`/clean-code --init` pattern-in-use detection** (§ 0.2.1) — scans the codebase, proposes patterns that already recur across ≥ 5 files. Confirmed before write.

Once recorded, a pattern can be re-applied to new targets:

#### `--apply-pattern <pattern-id> --to <target>`

- `<target>` accepts a file path, a glob (`src/lib/services/leave-request-service.ts`), or a suggestion id (`S-009`).
- Read the pattern from `patterns:`. Refuse if id is unknown.
- Read the pattern's `match.detector` to verify the target actually matches the pattern's signature. If not, refuse with: "Target does not match pattern signature. Detector: `<detector>`."
- Run the pattern's `transform:` steps in order through the standard fix loop (§ 1b TDD gate, baseline run, per-rule batch with revert-on-red, full suite after).
- If the pattern's `callers_pattern` is `bridge`, also generate the deprecated bridge method as part of the transform.
- On success: append an entry to `last_run.applied` with `pattern: <pattern-id>` and the target. The pattern itself stays in `patterns:` (it's a recipe, not a single-use item).
- On failed batch: revert, record `last_failure` on the pattern, continue. After 3 failures on the same target, append `needs_human: true`.

#### `--show-patterns [filter]`

Read-only. Lists patterns from `code-practice.yml` with the columns: `id`, `name`, `decided_in_adr`, `lane`, `callers_pattern`, `examples`.

#### Lifecycle

- Patterns are NEVER auto-deleted. Retiring a pattern is an explicit user action: `/clean-code --retire-pattern <id> --reason "<text>"` moves the entry to a `retired_patterns:` section (audit trail).
- When a pattern is retired or its decided_in_adr is superseded, ALL future scans skip suggesting it. Already-applied callsites are not reverted automatically — that's a separate refactor.

### 6. Verify

- Run `$TEST_CMD` (**full project suite**) one final time, regardless of whether any batch reverted. This is the final regression gate — if it fails here despite per-batch passes, something escaped the per-batch check (interaction effect across rules); halt, revert the most recent batch, and re-run until green or until no more batches can be reverted.
- Re-run `/solid` (and `/cqrs` if it ran) against scope — count remaining findings.
- Capture `git status` summary.
- Record final state in the yaml: `last_run.full_suite_status: passed | failed`. A `failed` final suite must not be hidden — surface it prominently in the report and recommend `git stash` / `git restore` to the user.

### 6.5 Standards verdict (gate)

Before writing the yaml or printing the report, compute a verdict against the curated standards loaded in §1. The verdict tells the user (and any caller — including `/loop`) whether this run cleared the bar.

Inputs to the verdict:
- `conventions[]` with `enforce: auto-fix` (the org + project standards)
- `waivers[]` (already-respected, do not count against the verdict)
- Run state: `last_run.applied`, `last_run.reverted`, `last_run.advisory_open`, `last_run.full_suite_status`, post-fix `/solid` + `/cqrs` rescan counts

Compute one of three verdicts:

| Verdict | When |
|---|---|
| `in-standards` ✅ | full suite green · zero remaining violations of any `enforce: auto-fix` convention · zero reverted batches · suggestion backlog is either empty OR all open entries are `lane: advisory` (architectural) |
| `needs-human-review` 🟡 | full suite green · zero remaining `auto-fix` convention violations · BUT either: advisory findings exist (architectural — SRP split, ISP fat interface, LSP redesign, etc.) OR open suggestion backlog contains `lane: auto-fix` / `lane: confirm-required` items requiring human judgment to schedule |
| `out-of-standards` 🔴 | any of: full suite red · remaining `auto-fix` convention violations the skill could not apply · reverted batches that did not get re-applied |

Write `last_run.verdict`, `verdict_reasons` (≤ 3 short strings, ≤ 60 chars each), `verdict_blocks_loop` (bool).

`verdict_blocks_loop` is `true` ONLY when `verdict == out-of-standards`. The other two verdicts are stable end states.

### 6.6 Loop-mode awareness

When `/clean-code` runs under `/loop`, it must avoid spinning on a stable codebase. Before doing any work in §1, check the previous run's verdict:

1. Read `last_run.verdict`, `last_run.timestamp`, and `last_run.suggestion_backlog` from the yaml.
2. The loop short-circuits ONLY when **all three** are true:
   - `verdict ∈ {in-standards, needs-human-review}`
   - Resolved scope unchanged since `last_run.timestamp` (compare `git rev-parse HEAD` against `last_run.head_sha`)
   - Suggestion backlog is unchanged: `len(open suggestions:) == last_run.suggestion_backlog` AND no entry has `last_checked_at < last_run.timestamp - 7d` (force a hygiene pass at least weekly to catch externally-resolved smells)
3. When short-circuiting:
   - Print: `clean-code: standards already met · scope unchanged · backlog unchanged (verdict: <state>, last run: <ISO>, backlog: <N>). Nothing to do. Exiting loop.`
   - Skip §1c through §6.5 entirely. No `/solid`, no `/cqrs`, no hygiene, no tests.
   - Write a minimal update: touch `updated_at` in `code-practice.yml`, prepend a row to `code-practice-history.yml#history` with `status: skipped-stable`, then print the exit message and stop.
4. If `verdict == out-of-standards` OR scope changed OR backlog state changed OR weekly-hygiene due: proceed with a normal run — the loop has work to do.
5. If no prior verdict exists (first run): proceed normally. Suggest the user runs `--init` first if the repo is brownfield.

Scope fingerprint lives in `last_run.head_sha`. Backlog fingerprint is `last_run.suggestion_backlog`. The weekly hygiene tick ensures `--loop` doesn't sit forever on a backlog whose entries have been silently resolved.

This makes `/loop 1h /clean-code` cheap: 99% of iterations short-circuit in <1 second; the loop only does real work when the diff, standards, or backlog changes — or once a week to reconcile the backlog.

### 7. Record — write two files

Skill state is split across two files so the working ADR stays lean and the audit trail can grow without bound.

| File | What lives here | Lifetime | Read by skill? |
|---|---|---|---|
| `.nybo/foundation/adrs/code-practice.yml` | Current state: `last_run`, OPEN `suggestions`, `patterns`, `retired_patterns`, `conventions`, `waivers` | Lean: only what the next run needs to decide | Yes — every run |
| `.nybo/foundation/adrs/code-practice-history.yml` | Append-only audit: `history[]`, `applied[]`, `dismissed[]` | Grows forever | Only when the user asks for retrospectives, or for the 3-runs-in-a-row promotion check (last 3 entries) |

Both files must exist before the skill writes — if `code-practice-history.yml` is missing, create it with the skeleton in § Template (history). Never inline history rows into `code-practice.yml`; reject the run with a clear error if a previous version of the skill wrote them there (auto-migrate on first run; see § Migration).

#### Templates

Seed `code-practice.yml` on first run from `~/.claude/skills/clean-code/references/code-practice.template.yml`. Top-level keys: `schema_version`, `tier`, `project`, `updated_at`, `last_run` (managed), `patterns` (additive), `retired_patterns`, `suggestions` (additive), `conventions` (human-editable), `waivers` (human-editable). History/applied/dismissed live ONLY in `code-practice-history.yml` — never inline these in the main file.

`code-practice-history.yml` keys: `schema_version`, `tier`, `project`, `created_at`, `updated_at`, `history[]` (newest first, no cap), `applied[]` (append-only), `dismissed[]` (append-only).

Atomically write both files per run. If either fails YAML parse, abort with no writes. If legacy main file contains `history:`/`applied[]`/`dismissed[]`, migrate them to the history file first.

#### Merge rules

- `last_run` — overwrite every run.
- `suggestions` — additive. IDs (`S-001`…) are monotonic, never reused. Skill never silently removes entries.
- `patterns`, `conventions`, `waivers` — additive. Never modify or delete without explicit user instruction.
- `history`, `applied`, `dismissed` — append-only in history file.

#### Promotion prompts (opt-in, after run)

1. Same rule auto-applied 3+ runs → offer `conventions:` entry.
2. Same `(rule, glob)` suppressed 3+ runs → offer `waivers:` entry.
3. Local convention not in org template → offer to lift to `~/.claude/skills/clean-code/references/code-practice.template.yml`.

### 8. Final report

Print a single Markdown block:

```
# /clean-code — done
Scope: <resolved> · Mode: <mode> · Reviewers: solid<, cqrs?>
Baseline: ✅ | Final suite: ✅/⛔ | Backlog hygiene: <X ext-resolved · Y renamed · Z shifted>
Open backlog: <N> (<a> auto-fix · <b> confirm-required · <c> advisory)
ADR: .nybo/foundation/adrs/code-practice.yml + code-practice-history.yml

## Applied / Reverted / Advisory / Skipped
(tables — see § 4 format)

## What you should do next
- git diff to review edits; address advisory findings manually; commit when ready.
```

## Cost discipline

- Inherits `/solid` and `/cqrs` cost rules: scope-first, no full-file Reads, no subagents, no doc lookups.
- The yaml is small — read once at start, write once at end.
- If scope > 30 files: split, announce batch N/M, finish batch, ask before next.

## Hard rules

- **No commit. No push. No PR creation.**
- **No refactor without a passing test.** Coverage check + characterization tests mandatory for behaviour-changing rules (§ 1b).
- **No refactor on a red baseline.**
- **Full suite runs at least twice** — baseline (pre-flight) and final (§ 6) — plus once per accepted batch.
- **No file deletion** without explicit `--allow-delete` flag.
- **No dependency adds.** Fix requiring a new package → advisory.
- **No migrations.** Fix that would require a schema migration → advisory.
- **Respect `.solidignore` and `.cqrsignore`** silently.

## Files in this skill folder

- `SKILL.md` — this file
- `references/code-practice.template.yml` — accumulating org knowledge base. The skill seeds new projects from this file and prompts to lift project-tier wins back into it after every run, so the team's clean-code standards compound over time.
