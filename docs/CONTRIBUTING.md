# Contributing

Last updated: 2026-02-17

## Prerequisites

- Node.js 20+
- npm
- Convex CLI via `npx convex`

## Local setup

```bash
npm install
```

Create `.env.local`:

```bash
CONVEX_DEPLOYMENT=dev:ardent-penguin-515
VITE_CONVEX_URL=https://ardent-penguin-515.convex.cloud
```

AI env vars are configured in Convex dashboard, not `.env.local`.

## Daily dev workflow

Terminal 1:

```bash
npx convex dev
```

Terminal 2:

```bash
npm run dev
```

First run routes to `/setup` for admin bootstrap + base seed.

## High-value commands

```bash
npm run lint
npm run test:run
npm run build
npx convex deploy -y
```

## Script families

- Diagnostics sync/export: see `scripts/README.md`
- Curriculum pipeline: see `docs/curriculum/WORKFLOW.md`
- Seed helpers: `npx convex run seed:<function>`

## Coding rules

- Convex files: use `import type` for type-only imports.
- React components: do not annotate `JSX.Element` return types.
- Prefer generated Convex types over duplicated frontend types.

## Tests

- Runner: Vitest
- Tests live near source (`*.test.ts`, `*.test.tsx`)
- Backend mock tests: `src/__tests__/convex/`

Reference backlog: `docs/reference/TEST-PLAN.md`.
