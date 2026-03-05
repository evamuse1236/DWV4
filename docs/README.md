# Documentation (Agent-Facing)

Purpose: minimal, deterministic docs for AI agents and engineers.

## Read Order

1. `docs/CORE.md`
2. `docs/CODEBASE-MAP.md`
3. `docs/SYSTEM.md`
4. `docs/OPERATIONS.md`

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
3. `src/App.tsx`
4. `docs/CORE.md`
5. `docs/SYSTEM.md`
6. `docs/OPERATIONS.md`

## Human Docs

For plain-language explanations, use `docsForMe/`.
