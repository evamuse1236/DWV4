# Deep Work Tracker

Deep Work Tracker is the active app repo for the Deep Work system.

It has two main surfaces:
- students: daily learning flow, check-ins, deep work, sprint, reading
- coaches/admins: students, objectives, queues, projects, and operations

## Start Here

Install and run the app:

```bash
npm install
npx convex dev
npm run dev
```

Open `http://localhost:5173`.

## Read These Next

1. `docs/README.md`
2. `docs/MAINTAINER_START_HERE.md`
3. `docs/CORE.md`
4. `docs/CODEBASE-MAP.md`
5. `docs/SYSTEM.md`
6. `docs/OPERATIONS.md`
7. `docs/ROOT-LAYOUT.md`
8. `docs/DATA_FLOW.md`
9. `docs-for-humans/README.md`

## How The App Is Built

```text
React + Vite frontend
  -> Convex hooks
  -> Convex backend functions
  -> Convex database
  -> external AI calls through Convex actions
```

## Important Commands

```bash
npm run lint
npm run test:run
npm run build
npx convex deploy -y
```

## Convex Environments

- dev: `ardent-penguin-515`
- prod: `greedy-marten-449`

If you add or change Convex functions, deploy Convex before shipping the frontend.

## About `workspace/`

`workspace/` is for non-runtime material. Keep the app root clean.

- `workspace/manual-tests/`: sandboxes and manual checks
- `workspace/diagnostic-reports/`: readable exports and sync reports
- `workspace/diagnostic-source-assets/`: mirrored source inputs for diagnostic sync work
- `workspace/reports/`: generated reports that are not runtime assets
- `workspace/reference-projects/`: outside code kept only for reference
- `workspace/legacy-web-assets/`: old standalone web material not used by the app
