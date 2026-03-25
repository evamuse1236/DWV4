# Documentation (Agent-Facing)

Purpose: minimal, deterministic docs for AI agents and engineers.

## Read Order

1. `docs/MAINTAINER_START_HERE.md`
2. `docs/CORE.md`
3. `docs/CODEBASE-MAP.md`
4. `docs/SYSTEM.md`
5. `docs/OPERATIONS.md`
6. `docs/ROOT-LAYOUT.md`
7. `docs/DATA_FLOW.md`

## Task Routing

| Task | Read |
|---|---|
| Product intent and invariants | `docs/CORE.md` |
| Routes, file ownership, navigation | `docs/CODEBASE-MAP.md` |
| Architecture, schema contracts, AI contracts | `docs/SYSTEM.md` |
| Setup, deploy, rollback, verification | `docs/OPERATIONS.md` |
| Curriculum script outputs | `docs/curriculum/README.md` |

## Source of Truth Priority

1. Runtime code (`src/`, `convex/`, `scripts/`)
2. `convex/schema.ts`
3. `src/app/router/App.tsx`
4. `docs/CORE.md`
5. `docs/SYSTEM.md`
6. `docs/OPERATIONS.md`

## Human Docs

For plain-language explanations, use `docs-for-humans/`.
