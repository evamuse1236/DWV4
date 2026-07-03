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

- `/dashboard` (Today — the post-check-in home)
- `/check-in`
- `/sprint` (Planner)
- `/deep-work` (Assignments map)
- `/deep-work/:domainId`
- `/deep-work/mastery/:majorObjectiveId` (assignment page; path kept for old links)
- `/reading`
- `/review` (book reviews)
- `/trust-jar`
- `/vision-board`
- `/character` (feature-flagged)
- `/settings`

### Admin

- `/admin` (morning console)
- `/admin/students`
- `/admin/students/:studentId`
- `/admin/sprints`
- `/admin/objectives` (Units & assignments)
- `/admin/confirmations` (done → confirm queue; `/admin/viva` and `/admin/diagnostics` redirect here)
- `/admin/projects` + `/admin/projects/:projectId` (data collection + CSV export)
- `/admin/books`
- `/admin/norms`
- `/admin/trust-jar`
- `/admin/settings`

## High-impact files by domain

- Auth/session: `src/features/auth/hooks/useAuth.tsx`, `convex/auth.ts`
- Deep work/progress: `convex/objectives.ts`, `convex/progress.ts`
- Assignment flow (done → confirm): `convex/assignments.ts`, `src/shared/lib/assignment.ts`, `src/features/assignments/` (AssignmentCard, AssignmentPage), `src/features/admin/pages/ConfirmationsPage.tsx`
- Today home: `src/features/today/pages/TodayPage.tsx` (goals/tasks/habits for the day)
- Vision board (collage v2): `src/features/vision-board/engine/` (packer, size ladder, adapter), `BoardCanvas/BoardCard`, `convex/visionBoard.ts`
- Data collection: `convex/projectReflections.ts`, `convex/projectLinks.ts`, `src/features/admin/pages/ProjectDetailPage.tsx` (CSV export)
- Archived (no UI, historical data only): `convex/diagnostics.ts`, viva fields in `convex/mastery.ts`
- AI actions: `convex/ai.ts`
- Reading flow: `src/features/reading/pages/ReadingPage.tsx`, `src/features/reading/components/BookBuddy.tsx`, `src/features/reading/pages/ReviewPage.tsx`, `convex/books.ts` (student-added draft books, quick `already read`, guided Book Buddy recommendations, finish-book flow, optional community reviews)
- Admin shell and queues: `src/app/shell/AdminLayout.tsx`, `src/features/admin/pages/AdminDashboard.tsx`, `src/features/admin/pages/*` (especially `VivaQueuePage.tsx`, `DiagnosticsPage.tsx`, and `BooksPage.tsx`), `convex/mastery.ts`, `convex/books.ts`, `convex/diagnostics.ts`
