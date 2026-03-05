# System Contracts

Purpose: concise architecture and contract rules that must stay true.

## Runtime shape

React (Vite + Router)
-> Convex React hooks
-> Convex queries/mutations/actions
-> Convex DB
-> External AI providers (through actions)

## Architecture boundaries

1. Domain and status transitions live in Convex mutations/actions, not ad-hoc UI logic.
2. External AI calls stay in `convex/ai.ts` actions.
3. Route protection lives in `src/App.tsx` and `ProtectedRoute`.
4. Schema changes must start in `convex/schema.ts`.

## Data model groups (`convex/schema.ts`)

- Identity: `users`, `sessions`
- Daily rhythm: `emotion*`, `sprints`, `goals`, `actionItems`, `habits`, `habitCompletions`
- Learning graph: `domains`, `majorObjectives`, `learningObjectives`, `activities`
- Student progress: `studentMajorObjectives`, `studentObjectives`, `activityProgress`
- Diagnostics: `diagnosticUnlockRequests`, `diagnosticUnlocks`, `diagnosticAttempts`
- Reading: `books`, `studentBooks`
- Admin/community: `studentComments`, `bookReviewComments`, `trustJar`, `studentNorms`
- Character: `character*`, `tarotCards`, `badgeDefinitions`, `studentBadges`
- Projects: `projects`, `projectLinks`, `projectReflections`
- Vision board: `visionBoardAreas`, `visionBoardCards`

## Status lifecycles

- `studentMajorObjectives.status`: `assigned -> in_progress -> viva_requested -> mastered`
- `diagnosticUnlockRequests.status`: `pending -> approved | denied | canceled`
- `diagnosticUnlocks.status`: `approved -> consumed | expired | revoked`
- `studentBooks.status`: `reading -> review_draft -> review_submitted -> review_changes_requested -> review_submitted -> review_approved` (`completed`, `presentation_requested`, and `presented` are legacy-compatible)

## Reading UX contracts

- In `src/pages/student/ReadingPage.tsx`, clicking modal `Read Book` opens `readingUrl` in a new tab and starts reading (`books.startReading`) if needed.
- Newly started books appear immediately in the Reading tab via optimistic UI, then reconcile with Convex query results.
- Reading-card remove (`×`) is a hover/focus affordance and removes the book from visible lists immediately while mutation completes.
- In `src/pages/student/ReviewPage.tsx`, students see book-review prompt suggestions (including coach feedback when changes are requested) in addition to diagnostic review history.
- `ReviewPage` suggestion links deep-link into `ReadingPage` with `?openBook=<bookId>` and auto-open that book's review modal on the Library tab.

## Admin review queue contracts

- In `src/pages/admin/ReviewQueuePage.tsx`, `Request Changes` expands an inline feedback editor inside each card; feedback submission does not open a modal dialog.

## AI response contracts

UI parsers depend on fenced blocks from AI responses:
- `goal-ready`
- `buddy-response`
- `admin-commands`
- `project-data` (legacy fallback support in UI)

If contract shape changes, update both `convex/ai.ts` and consuming UI parsers/tests together.
