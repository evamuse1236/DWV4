# Architecture Overview

Last updated: 2026-02-17

## System design

Deep Work Tracker intentionally separates user experiences:
- Student experience optimized for focus and rhythm.
- Admin experience optimized for operational speed and visibility.

Both use a shared Convex backend.

## Runtime shape

```text
Browser (React + Router)
  -> Convex React client
  -> Convex queries/mutations/actions
  -> Convex DB
  -> External AI providers (actions only)
```

## Key architectural decisions

1. Keep domain rules in Convex, not ad-hoc in UI.
2. Keep external AI calls isolated in actions (`convex/ai.ts`).
3. Keep student/admin UI systems distinct (paper vs shadcn) to match user intent.
4. Keep deterministic mastery and queue states on the backend.

## Important boundaries

- Route and role control: `src/App.tsx`, `ProtectedRoute.tsx`
- Daily gate policy: `CheckInGate.tsx` + `api.emotions.getTodayCheckIn`
- Status transitions: `convex/objectives.ts`, `convex/progress.ts`, `convex/diagnostics.ts`
- Seed/bootstrap lifecycle: `convex/seed.ts`, `src/pages/SetupPage.tsx`

## Environments

- Dev deployment: `ardent-penguin-515`
- Prod deployment: `greedy-marten-449`

`VITE_CONVEX_URL` controls which backend the frontend connects to.

## Failure modes to remember

1. Frontend deploy can reference missing Convex functions if backend is not deployed first.
2. Legacy statuses in `studentObjectives` can conflict with assumptions if you ignore `studentMajorObjectives`.
3. Diagnostic policy changes must happen in backend, not UI-only logic.

## Related docs

- `docs/CORE.md`
- `docs/DATA-MODEL.md`
- `docs/RUNBOOK.md`
- `docs/PATTERNS.md`
