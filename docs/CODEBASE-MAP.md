# Codebase Map

Purpose: fast navigation to where behavior actually lives.

## Top-level folders

- `src/`: React frontend and route-level UI.
- `convex/`: backend functions and schema.
- `scripts/`: maintenance and generation tooling.
- `public/`: static runtime assets (including diagnostic payloads).

## Entrypoints

- Frontend bootstrap: `src/main.tsx`
- App routes: `src/app/router/App.tsx`
- Schema source of truth: `convex/schema.ts`

## Route map (`src/app/router/App.tsx`)

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
- `/admin/books`
- `/admin/norms`
- `/admin/trust-jar`
- `/admin/settings`

## High-impact files by domain

- Auth/session: `src/features/auth/hooks/useAuth.tsx`, `convex/auth.ts`
- Deep work/progress: `convex/objectives.ts`, `convex/progress.ts`
- Mastery flow: `src/features/mastery/pages/MasteryPage.tsx`, `src/features/mastery/components/MasteryStatusCard.tsx`, `src/shared/lib/mastery.ts`, `convex/mastery.ts`
- Diagnostics: `src/features/diagnostics/pages/DiagnosticPage.tsx`, `src/features/admin/pages/DiagnosticsPage.tsx`, `src/shared/lib/diagnostic.ts`, `convex/diagnostics.ts`
- AI actions: `convex/ai.ts`
- Reading flow: `src/features/reading/pages/ReadingPage.tsx`, `src/features/reading/components/BookBuddy.tsx`, `src/features/reading/pages/ReviewPage.tsx`, `convex/books.ts` (student-added draft books, quick `already read`, guided Book Buddy recommendations, finish-book flow, optional community reviews)
- Admin shell and queues: `src/app/shell/AdminLayout.tsx`, `src/features/admin/pages/AdminDashboard.tsx`, `src/features/admin/pages/*` (especially `VivaQueuePage.tsx`, `DiagnosticsPage.tsx`, and `BooksPage.tsx`), `convex/mastery.ts`, `convex/books.ts`, `convex/diagnostics.ts`
