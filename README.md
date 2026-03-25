# Deep Work Tracker

Deep Work Tracker is a dual-surface learning platform:
- Student surface: calm daily learning flow (check-in, deep work, sprint, reading).
- Coach/Admin surface: operational control (students, objectives, queues, projects).

This README is intentionally short. Use the docs hub for full context.

## Quick Start

```bash
npm install
npx convex dev
npm run dev
```

Open `http://localhost:5173`.

## Core Documentation (Read In Order)

1. `docs/README.md`
2. `docs/MAINTAINER_START_HERE.md`
3. `docs/CORE.md`
4. `docs/CODEBASE-MAP.md`
5. `docs/SYSTEM.md`
6. `docs/OPERATIONS.md`
7. `docs/ROOT-LAYOUT.md`
8. `docs/DATA_FLOW.md`
9. `docs-for-humans/README.md` (plain-language guide)

## Architecture Snapshot

```text
React (Vite) frontend
  -> Convex hooks (query/mutation/action)
  -> Convex backend (schema + functions)
  -> Convex database
  -> External AI providers via Convex actions
```

## Environments

- Dev Convex: `ardent-penguin-515`
- Prod Convex: `greedy-marten-449`

Deploy Convex before shipping frontend code that calls new Convex functions.

## Commands

```bash
npm run lint
npm run test:run
npm run build
npx convex deploy -y
```

## Workspace Layout

Non-runtime artifacts live under `workspace/` to keep the project root clean.

- `workspace/manual-tests/`: manual harnesses and sandboxes
- `workspace/diagnostic-reports/`: readable exports and misconception reports
- `workspace/diagnostic-source-assets/`: mirror inputs used to sync runtime diagnostic assets
- `workspace/reports/`: generated reports and exports that are not runtime assets
- `workspace/reference-projects/`: outside code kept only for reference
- `workspace/legacy-web-assets/`: old standalone web material not used by the app runtime
