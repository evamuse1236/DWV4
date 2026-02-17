# Deep Work Tracker Core Guide

Last updated: 2026-02-17

## What this product is

Deep Work Tracker is a student learning platform with an admin coaching console.
- Student UX is calm and guided.
- Admin UX is dense and operational.

Both surfaces share one Convex backend and schema.

## Why it exists

The product balances:
1. Daily momentum (check-in, sprint tasks, reading)
2. Mastery evidence (activities, diagnostics, viva)
3. Coach leverage (queues, fast intervention, AI-assisted entry)

## Core product loop

1. Student checks in
2. Student works assigned objectives and sprint tasks
3. Student requests mastery checks (viva/diagnostic)
4. Coach reviews queues and advances mastery states

## Non-negotiable invariants

1. `studentMajorObjectives.status` is the authoritative major-objective status.
2. `studentObjectives.status` is legacy-compatible state.
3. Diagnostic pass policy is backend-enforced in `convex/diagnostics.ts`.
4. Student routes under `DashboardLayout` are check-in gated.
5. AI actions must return parseable structured outputs consumed by UI.

## System shape

```text
React (Vite) frontend
  -> Convex hooks
  -> Convex functions + schema
  -> Convex DB
  -> AI providers via Convex actions
```

## Current direction (2026)

1. Keep mastery flows deterministic and auditable.
2. Improve accessibility and mobile reliability in core flows.
3. Keep AI contracts strict with robust fallbacks.
4. Keep docs low-overlap and agent-friendly.

## Read next

- `docs/CODEBASE-MAP.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA-MODEL.md`
