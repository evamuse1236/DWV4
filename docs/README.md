# Documentation Hub

Use this folder for the technical source of truth.

## Read Order

1. `docs/MAINTAINER_START_HERE.md`
2. `docs/CORE.md`
3. `docs/CODEBASE-MAP.md`
4. `docs/SYSTEM.md`
5. `docs/OPERATIONS.md`
6. `docs/ROOT-LAYOUT.md`
7. `docs/DATA_FLOW.md`

## If You Need...

| Question | Read |
|---|---|
| What the product is trying to do | `docs/CORE.md` |
| Where code lives and who owns what | `docs/CODEBASE-MAP.md` |
| How the system is wired together | `docs/SYSTEM.md` |
| How to run, deploy, and verify it | `docs/OPERATIONS.md` |
| How curriculum scripts fit together | `docs/curriculum/README.md` |

## When Docs And Code Disagree

Trust these in order:

1. runtime code in `src/`, `convex/`, and `scripts/`
2. `convex/schema.ts`
3. `src/app/router/App.tsx`
4. `docs/CORE.md`
5. `docs/SYSTEM.md`
6. `docs/OPERATIONS.md`

## Plain-English Docs

For simpler explanations, use `docs-for-humans/`.
