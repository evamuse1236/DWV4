# Maintainer Start Here

This file answers the first three questions a maintainer usually has.

## 1. Which repo should I work in?

- active app repo: `C:\WProjects\DW`
- human name: `deep-work-app`

## 2. Where does source data live?

- data repo: `C:\WProjects\01DWDATA`
- human name: `deep-work-data`

## 3. What is legacy only?

- archive repo: `C:\projects\DWV4`
- human name: `deep-work-legacy`

Do not treat `DWV4` as a second active app repo.

## Read Next

1. `docs/CORE.md`
2. `docs/CODEBASE-MAP.md`
3. `docs/SYSTEM.md`
4. `docs/OPERATIONS.md`
5. `docs/ROOT-LAYOUT.md`
6. `docs/DATA_FLOW.md`
7. `docs-for-humans/README.md`

## Normal Commands

```bash
npm install
npx convex dev
npm run dev
npm run lint
npm run test:run
npm run build
```

## House Rule

Every folder should answer: "What is this for?"

If it does not, rename it, move it under `workspace/`, or archive it.
