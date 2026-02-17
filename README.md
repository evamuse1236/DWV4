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
2. `docs/CORE.md`
3. `docs/CODEBASE-MAP.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DATA-MODEL.md`
6. `docs/RUNBOOK.md`
7. `docs/CONTRIBUTING.md`
8. `docs/AI-SYSTEM.md` (only when touching AI features)

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
