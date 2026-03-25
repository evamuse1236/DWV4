# Maintainer Start Here

Purpose: answer the three setup questions fast.

## Which repo is active?

- Active app repo: `C:\WProjects\DW`
- Human-facing name: `deep-work-app`

## Which repo owns the source data?

- Data repo: `C:\WProjects\01DWDATA`
- Human-facing name: `deep-work-data`

## Which repo is legacy only?

- Archive repo: `C:\projects\DWV4`
- Human-facing name: `deep-work-legacy`

Do not split active app work across `DW` and `DWV4`.

## What should I read next?

1. `docs/CORE.md`
2. `docs/CODEBASE-MAP.md`
3. `docs/SYSTEM.md`
4. `docs/OPERATIONS.md`
5. `docs/ROOT-LAYOUT.md`
6. `docs/DATA_FLOW.md`
7. `docs-for-humans/README.md`

## Normal commands

```bash
npm install
npx convex dev
npm run dev
npm run lint
npm run test:run
npm run build
```

## Naming rule

Every folder should answer: "What is this for?"

If it does not, rename it, move it under `workspace/`, or archive it.
