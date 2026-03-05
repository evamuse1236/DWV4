# AGENTS.md

Purpose: deterministic routing for AI agents working in this repo.

Single source of truth: this file. `CLAUDE.md` exists only as a compatibility pointer.

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
| Architecture, schema/status contracts, AI contracts | `docs/SYSTEM.md` |
| Deploy, rollback, setup, verification | `docs/OPERATIONS.md` |
| Curriculum pipeline outputs | `docs/curriculum/README.md` |
| Non-jargon human docs | `docsForMe/README.md` |

## Source-of-Truth Priority

1. Runtime code (`src/`, `convex/`, `scripts/`)
2. `convex/schema.ts`
3. `src/App.tsx`
4. `docs/CORE.md`
5. `docs/SYSTEM.md`
6. `docs/OPERATIONS.md`

## Required Agent Rules

1. Do not implement from deleted or historical docs; use current docs + runtime code.
2. Update owner docs instead of creating overlapping docs.
3. If behavior changes, update the matching owner doc.
4. Validate route assumptions in `src/App.tsx`.
5. Validate data assumptions in `convex/schema.ts`.

## UI Workflow Policy

1. For every frontend/UI task, run the frontend design skill first and apply it before coding.
2. Frontend design skill source: `C:/Users/vishw/.codex/skills/claude-code/SKILL.md` (until a dedicated frontend-design skill is added).
3. When invoking Claude for frontend work, append the full frontend design skill content to the Claude prompt.
4. Claude Code is allowed for visual/UX-only frontend tasks using `--dangerously-skip-permissions`.
5. Guardrails: keep edits inside `src/` (and `public/` only if needed); do not edit `convex/`, auth flows, or docs unless explicitly requested.
6. Never read `.env*` files or secrets; require diff-style output from Claude; implementing agent must review and verify locally.
7. If Claude Code is unavailable, use Gemini CLI advisory-only (ideas + suggested diffs), then implement locally.

## Code Simplifier Policy

When asked to simplify code/docs:
1. Lock scope (`git status --short` + requested files).
2. Preserve behavior and public contracts.
3. Remove duplication and indirect/nested complexity.
4. Keep edits surgical and in-scope.
5. Run the smallest relevant verification checks.
