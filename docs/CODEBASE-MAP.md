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
- `/admin/projects`
- `/admin/projects/:projectId`
- `/admin/objectives`
- `/admin/viva`
- `/admin/presentations`
- `/admin/books`
- `/admin/norms`
- `/admin/comments`
- `/admin/character`
- `/admin/trust-jar`
- `/admin/settings`

## High-impact files by domain

- Auth/session: `src/hooks/useAuth.tsx`, `convex/auth.ts`
- Deep work/progress: `convex/objectives.ts`, `convex/progress.ts`
- Diagnostics: `src/pages/student/DiagnosticPage.tsx`, `src/lib/diagnostic.ts`, `convex/diagnostics.ts`
- AI actions: `convex/ai.ts`
- Reading flow: `src/pages/student/ReadingPage.tsx`, `convex/books.ts`
- Admin queues: `src/pages/admin/*`, `convex/objectives.ts`, `convex/books.ts`, `convex/diagnostics.ts`
