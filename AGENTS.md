# AGENTS.md

Purpose: deterministic routing for AI agents working in this repo.

## Boot Sequence (Always)

1. Read `docs/README.md`
2. Read `docs/CORE.md`
3. Read `docs/CODEBASE-MAP.md`
4. Load only task-specific docs from the table below

## Task Routing

| Task | Read |
|---|---|
| Product intent, invariants, direction | `docs/CORE.md` |
| Code/file ownership and route locations | `docs/CODEBASE-MAP.md` |
| Architecture decisions and boundaries | `docs/ARCHITECTURE.md` |
| Schema/status contracts and data rules | `docs/DATA-MODEL.md` |
| Deploy, rollback, operations | `docs/RUNBOOK.md` |
| Local setup and contributor workflow | `docs/CONTRIBUTING.md` |
| AI prompts/contracts/providers | `docs/AI-SYSTEM.md` |
| Curriculum mapping pipeline | `docs/curriculum/README.md`, `docs/curriculum/WORKFLOW.md` |
| Test planning priorities | `docs/reference/TEST-PLAN.md` |
| Historical context only | `docs/archive/README.md` |

## Source-of-Truth Priority

1. Runtime code (`src/`, `convex/`, `scripts/`)
2. `convex/schema.ts`
3. `docs/DATA-MODEL.md`
4. `docs/CORE.md`
5. `docs/RUNBOOK.md`
6. `docs/archive/` (historical only)

## Required Agent Rules

1. Do not implement from `docs/archive/` unless explicitly requested.
2. Update owner docs instead of creating overlapping docs.
3. If behavior changes, update the matching owner doc.
4. Validate route assumptions in `src/App.tsx`.
5. Validate data assumptions in `convex/schema.ts`.

## UI Workflow Policy

1. Do not use Claude Code workflows in this repository.
2. If external UI ideation is needed, use Gemini CLI only.
3. Gemini is advisory-only: ideas and suggested diffs.
4. Implementing agent must apply edits and verify locally.

## Code Simplifier Policy

When asked to simplify code/docs:
1. Lock scope (`git status --short` + requested files).
2. Preserve behavior and public contracts.
3. Remove duplication and indirect/nested complexity.
4. Keep edits surgical and in-scope.
5. Run the smallest relevant verification checks.
