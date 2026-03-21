# Codebase Map

Purpose: fast navigation to where behavior actually lives.

## Top-level folders

- `src/`: React frontend and route-level UI.
- `convex/`: backend functions and schema.
- `scripts/`: maintenance and generation tooling.
- `public/`: static runtime assets (including diagnostic payloads).

## Entrypoints

- Frontend bootstrap: `src/main.tsx`
- App routes: `src/App.tsx`
- Schema source of truth: `convex/schema.ts`

## Route map (`src/App.tsx`)

### Public

- `/login`
- `/setup`

### Student

- `/dashboard`
- `/check-in`
- `/sprint`
- `/deep-work`
- `/deep-work/:domainId`
- `/deep-work/mastery/:majorObjectiveId`
- `/deep-work/diagnostic/:majorObjectiveId`
- `/reading`
- `/review`
- `/trust-jar`
- `/vision-board`
- `/character` (feature-flagged)
- `/settings`

### Admin

- `/admin`
- `/admin/students`
- `/admin/students/:studentId`
- `/admin/sprints`
- `/admin/objectives`
- `/admin/viva`
- `/admin/diagnostics`
- `/admin/reviews` (with `/admin/presentations` redirected)
- `/admin/books`
- `/admin/norms`
- `/admin/trust-jar`
- `/admin/settings`

## High-impact files by domain

- Auth/session: `src/hooks/useAuth.tsx`, `convex/auth.ts`
- Deep work/progress: `convex/objectives.ts`, `convex/progress.ts`
- Mastery flow: `src/pages/student/MasteryPage.tsx`, `src/components/mastery/MasteryStatusCard.tsx`, `src/lib/mastery.ts`, `convex/mastery.ts`
- Diagnostics: `src/pages/student/DiagnosticPage.tsx`, `src/pages/admin/DiagnosticsPage.tsx`, `src/lib/diagnostic.ts`, `convex/diagnostics.ts`
- AI actions: `convex/ai.ts`
- Reading flow: `src/pages/student/ReadingPage.tsx`, `src/pages/student/ReviewPage.tsx`, `convex/books.ts` (modal `Read Book` CTA + optimistic Reading list updates + review prompt suggestions)
- Admin shell and queues: `src/components/layout/AdminLayout.tsx`, `src/pages/admin/AdminDashboard.tsx`, `src/pages/admin/*` (including `VivaQueuePage.tsx`, `DiagnosticsPage.tsx`, and `ReviewQueuePage.tsx`), `convex/mastery.ts`, `convex/books.ts`, `convex/diagnostics.ts`
