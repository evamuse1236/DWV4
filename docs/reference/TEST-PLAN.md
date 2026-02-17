# Test Plan (React + TypeScript + Convex + Vitest)

Prioritized checklist of tests to add/expand for this repo. Current tests live in `src/**/*.test.tsx` (and a few `src/**/*.test.ts`).

**Priority legend**
- **P0**: Core user journey / release-blocking regressions
- **P1**: High-value coverage for main features
- **P2**: Nice-to-have, hard-to-test, or mostly regression safety

**Notes on where tests should live**
- Frontend unit/component/page tests: `src/**/*.test.tsx`
- Pure utilities: `src/**/*.test.ts`
- Convex tests: `convex/**/*.test.ts` (use `// @vitest-environment node` if needed)
- Mock helpers already exist for student pages: `src/pages/student/__tests__/test-utils.tsx`

---

## 1) Backend / Convex Functions

### P0 — Auth, integrity, and core learning loops
- [ ] `convex/auth.ts` `checkNeedsBootstrap`: returns `true` when `users` is empty; returns `false` once any user exists.
- [ ] `convex/auth.ts` `initializeAdmin`: succeeds only when no users exist; persists admin with `role="admin"` + `createdAt`; rejects when a user already exists.
- [ ] `convex/auth.ts` `initializeStudent`: allows first student bootstrap only; rejects after any student exists; rejects duplicate usernames.
- [ ] `convex/auth.ts` `createUser`: rejects missing/invalid admin token; rejects non-admin; rejects duplicate usernames; creates user with expected fields (incl. `batch`).
- [ ] `convex/auth.ts` `login`: invalid username/password returns `{success:false}`; valid login deletes prior sessions for that user, creates exactly one session, updates `lastLoginAt`, returns `{success:true, token, user}`.
- [ ] `convex/auth.ts` `getCurrentUser`: returns `null` for missing session, expired session, or missing user; returns expected user shape for valid session.
- [ ] `convex/auth.ts` `logout`: deletes matching session; is idempotent (logging out twice is OK).
- [ ] `convex/auth.ts` `cleanupExpiredSessions`: deletes only expired sessions; returns correct `deletedCount`.

- [ ] `convex/utils.ts` `hashPassword`: deterministic for same input; different for different inputs; matches login verification (auth tests should use real hashing).

- [ ] `convex/emotions.ts` `getCategories`: categories sorted by `order`; each category includes subcategories sorted by `order`; handles empty tables.
- [ ] `convex/emotions.ts` `saveCheckIn`: writes `emotionCheckIns` with required fields and `timestamp`; persists optional `journalEntry`.
- [ ] `convex/emotions.ts` `updateCheckIn`: patches only provided fields; returns `{success:false}` when `checkInId` is missing.
- [ ] `convex/emotions.ts` `getTodayCheckIn`: returns `null` when none today; returns today’s check-in with attached `category` + `subcategory` when present.
- [ ] `convex/emotions.ts` `getHistory`: returns most-recent-first, respects `limit`, attaches category/subcategory for each.
- [ ] `convex/emotions.ts` `getStats`: `totalCheckIns` matches window; `streak` handles multiple check-ins per day; category counts are correct.
- [ ] `convex/emotions.ts` admin: `getTodayCheckIns` includes `user/category/subcategory` and sorts by timestamp desc; `deleteTodayCheckIn` deletes only today and returns `deleted` correctly.

- [ ] `convex/sprints.ts` `create`: deactivates any existing active sprint, creates new active sprint.
- [ ] `convex/sprints.ts` `setActive`: ensures exactly one active sprint after call; no-op behavior is safe when selecting already-active sprint.
- [ ] `convex/sprints.ts` `getAll`: returns sprints sorted by `startDate` desc.
- [ ] `convex/sprints.ts` `update`: patches only provided fields.

- [ ] `convex/goals.ts` `create`: persists SMART fields; sets `status="not_started"`; sets `createdAt/updatedAt`.
- [ ] `convex/goals.ts` `update`: patches only provided fields; always updates `updatedAt`; validates allowed `status` values.
- [ ] `convex/goals.ts` `remove`: deletes goal and all `actionItems` for the goal.
- [ ] `convex/goals.ts` `getByUserAndSprint`: returns all goals for user+sprint and includes `actionItems` sorted by `order`.
- [ ] `convex/goals.ts` `addActionItem`: increments `order` per-goal; sets `isCompleted=false`; persists scheduling fields.
- [ ] `convex/goals.ts` `toggleActionItem`: toggles `isCompleted`; sets `completedAt` when completing; unsets when uncompleting.
- [ ] `convex/goals.ts` `updateActionItem`: patches only provided fields; returns `{success:false}` when item missing.
- [ ] `convex/goals.ts` `removeActionItem`: deletes the item (and does not affect other items).
- [ ] `convex/goals.ts` `getActionItemsByDay`: filters by `userId/weekNumber/dayOfWeek` and includes the parent goal doc.
- [ ] `convex/goals.ts` `getPreviousSprintGoals`: correctly identifies “previous sprint” relative to `currentSprintId`; returns [] when none.
- [ ] `convex/goals.ts` `duplicate` / `importGoal`: missing goal returns `{success:false}`; copies SMART fields; copies action items when `includeActionItems !== false`; resets completion state.

- [ ] `convex/habits.ts` `create/update/remove`: basic CRUD; remove cascades `habitCompletions`.
- [ ] `convex/habits.ts` `toggleCompletion`: creates a completion when none exists; toggles existing without creating duplicates.
- [ ] `convex/habits.ts` `getCompletionsInRange`: inclusive range behavior.
- [ ] `convex/habits.ts` `getStreak`: consecutive-day logic only; 0 when no completed days.

- [ ] `convex/objectives.ts` major CRUD: `create/update/remove` works; remove cascades sub-objectives, activities, progress, student assignments.
- [ ] `convex/objectives.ts` sub CRUD: `createSubObjective` fails when major missing; update/remove behave; remove cascades `activities` and related `activityProgress`.
- [ ] `convex/objectives.ts` `assignToStudent`: creates `studentMajorObjectives` when needed; does not duplicate `studentObjectives`; errors if sub is missing `majorObjectiveId`.
- [ ] `convex/objectives.ts` `assignToMultipleStudents`: returns `created` flags per student and never duplicates assignments.
- [ ] `convex/objectives.ts` `unassignFromStudent`: deletes `studentObjectives` and their `activityProgress`; deletes `studentMajorObjectives` only if no remaining sub-objectives for that major.
- [ ] `convex/objectives.ts` viva workflow: `updateStatus` sets `vivaRequestedAt/masteredAt` appropriately; persists optional `vivaRequestNotes`.
- [ ] `convex/objectives.ts` `getVivaRequests`: returns `user`, `objective`, and `domain` for each request.
- [ ] `convex/objectives.ts` `getAssignedByDomain`: includes activities sorted by `order` and merges `activityProgress` per student objective.
- [ ] `convex/objectives.ts` `getTreeData`: groups objectives by domain (stable keys) and includes activities + progress so the Skill Tree UI can render.
- [ ] `convex/objectives.ts` `migrateObjectivesToMajorSub`: safe to run on already-migrated data; maps legacy statuses to major+sub statuses consistently.

- [ ] `convex/progress.ts` `toggleActivity`: creates a progress record if missing; toggles completion; updates sub-objective `status` (`assigned`/`in_progress`/`completed`) based on activity completion.
- [ ] `convex/progress.ts` `toggleActivity`: updates major assignment status transitions (`assigned` ↔ `in_progress`, `viva_requested` → `in_progress` when incomplete); never downgrades `mastered`.
- [ ] `convex/progress.ts` `getDomainSummary`: correct counts for `mastered`, `inProgress` (`in_progress` + `viva_requested`), and `assigned`.

- [ ] `convex/books.ts` `startReading`: idempotent per `(userId, bookId)`; creates `studentBooks` with `status="reading"` + `startedAt`.
- [ ] `convex/books.ts` `updateStatus`: sets the correct timestamp field for `completed`/`presentation_requested`/`presented`; does not regress timestamps unexpectedly.
- [ ] `convex/books.ts` `getReadingStats`: counts reading/pending/presented correctly; treats legacy `completed` as pending presentation.
- [ ] `convex/books.ts` `getPresentationRequests`: returns pending requests including legacy `completed`; attaches `user` + `book`.
- [ ] `convex/books.ts` `approvePresentationRequest`: approved → `presented` + timestamp; rejected → back to `reading` and clears request timestamp.
- [ ] `convex/books.ts` admin CRUD: `remove` cascades `studentBooks` for that book.

- [ ] `convex/trustJar.ts` `get`: returns defaults when no jar exists.
- [ ] `convex/trustJar.ts` auth: `add/remove/reset` reject invalid admin token and non-admin sessions.
- [ ] `convex/trustJar.ts` bounds: cannot add past max; cannot remove below zero; reset sets count to zero.
- [ ] `convex/trustJar.ts` `reset`: increments `timesCompleted` only when jar was full.

### P1 — Admin/project features & cleanup
- [ ] `convex/users.ts` `getAll/getByBatch/getBatches/getStudentCount`: correct filtering and stable ordering expectations.
- [ ] `convex/users.ts` `getTodayCheckInCount`: counts only “today” consistently (timezone sanity).
- [ ] `convex/users.ts` `remove`: cascades related data across tables (check-ins, objectives, progress, books, goals+actions, habits+completions).

- [ ] `convex/projects.ts` active invariants: `create/setActive` ensure only one active project.
- [ ] `convex/projects.ts` `getWithStats`: counts students and completed reflections accurately.
- [ ] `convex/projects.ts` `remove`: cascades `projectLinks` and `projectReflections`.
- [ ] `convex/projects.ts` `getNextCycleNumber`: returns 1 on empty; returns max+1 otherwise.

- [ ] `convex/projectLinks.ts` CRUD + bulk: `add/addMany/update/remove/removeAllForUser` behave and validate `linkType`.
- [ ] `convex/projectReflections.ts` `getOrCreate`: idempotent; creates incomplete shell with `isComplete=false`.
- [ ] `convex/projectReflections.ts` `update`: merges with existing fields and sets `isComplete` correctly.
- [ ] `convex/projectReflections.ts` `batchUpdate`: matches repeated `update` behavior (including `isComplete`).
- [ ] `convex/projectReflections.ts` `getProjectStats`: totals add up and match reflection data.

### P2 — Seeding & AI actions
- [ ] `convex/seed.ts` `seedAll`: idempotent; creates expected emotions/domains/books; does not reseed when already seeded.
- [ ] `convex/seed.ts` `seedStudents` and other helpers: do not duplicate users; produce expected batches; passwords are hashed.
- [ ] `convex/ai.ts` contract: actions return stable shape and tolerate empty message arrays; prompt builders include required constraints.
- [ ] `convex/ai.ts` resilience: provider failures trigger fallback paths; formatter failures surface an actionable error message.

---

## 2) Authentication Flow

### P0 — Session + routing correctness
- [ ] `src/hooks/useAuth.tsx` `AuthProvider`: reads token from `localStorage` on mount; uses `"skip"` when token is missing.
- [ ] `src/hooks/useAuth.tsx` `AuthProvider`: `isLoading` is `true` only while token exists and currentUser is `undefined`.
- [ ] `src/hooks/useAuth.tsx` clears token when `getCurrentUser` returns `null` (expired/invalid session).
- [ ] `src/hooks/useAuth.tsx` `login`: stores token on success and returns `true`; returns `false` on auth failure; handles thrown errors.
- [ ] `src/hooks/useAuth.tsx` `logout`: calls backend when token exists; always clears local token even on backend error.

- [ ] `src/components/auth/ProtectedRoute.tsx` shows `LoadingSpinner` during auth load.
- [ ] `src/components/auth/ProtectedRoute.tsx` redirects unauthenticated users to `/login` and preserves `location` in `state.from`.
- [ ] `src/components/auth/ProtectedRoute.tsx` enforces `allowedRoles` and redirects to role-appropriate landing (`/admin` vs `/dashboard`).
- [ ] `src/components/auth/ProtectedRoute.tsx` `PublicOnlyRoute` redirects authenticated users away from `/login`.

- [ ] `src/App.tsx` route safety: unknown route redirects to `/login`; `/trust-jar` is student-only; admin routes are admin-only.

### P1 — Login/setup UX and edge cases
- [ ] `src/pages/LoginPage.tsx` shows “Begin Setup” banner only when `api.auth.checkNeedsBootstrap` is `true`.
- [ ] `src/pages/LoginPage.tsx` validation: missing username/password shows correct messages; disables inputs while submitting.
- [ ] `src/pages/LoginPage.tsx` redirect logic: honors `location.state.from` after login; admin lands on `/admin`.
- [ ] `src/pages/SetupPage.tsx` step 1 validation: displayName required; password length; confirm password match.
- [ ] `src/pages/SetupPage.tsx` step transitions: initialize admin success → step 2; seed success → step 3; “Skip for now” reaches step 3.
- [ ] `src/pages/SetupPage.tsx` failure handling: initialize admin failure shows error; seed failure shows error and allows retry.

---

## 3) Page-Level Tests

### P0 — Student core journey
- [ ] `src/pages/student/StudentDashboard.tsx` loading: skeleton behavior and “no data yet” states when queries are empty.
- [ ] `src/pages/student/StudentDashboard.tsx` computed values: `tasksLeft`, `totalMastered`, and “most relevant deep work route” selection logic.
- [ ] `src/pages/student/StudentDashboard.tsx` navigation: clicking cards routes to `/deep-work`, `/sprint`, `/reading`; domain cards route to `/deep-work/:domainId`.

- [ ] `src/pages/student/DeepWorkPage.tsx` loading + empty states: `treeData === undefined` shows loading; `domains.length === 0` shows empty state.
- [ ] `src/pages/student/DeepWorkPage.tsx` interactions: selecting a domain switches to horizontal view; selecting a node opens right panel; backdrop click closes panel; “back” returns to domain selection.

- [ ] `src/pages/student/DomainDetailPage.tsx` guards: invalid `domainId` redirects to `/deep-work`; missing domain shows loading UI.
- [ ] `src/pages/student/DomainDetailPage.tsx` activity toggle calls `api.progress.toggleActivity` with correct args.
- [ ] `src/pages/student/DomainDetailPage.tsx` viva request button enables only when all sub-objectives are complete and major is `in_progress`.
- [ ] `src/pages/student/DomainDetailPage.tsx` status rendering: major/sub statuses map to correct labels/classes.

- [ ] `src/pages/student/SprintPage.tsx` loading: handles no active sprint and skip queries safely.
- [ ] `src/pages/student/SprintPage.tsx` goal lifecycle: create/edit/delete goal flows call the correct mutations and update UI accordingly.
- [ ] `src/pages/student/SprintPage.tsx` task lifecycle: quick-add task, edit task title, toggle completion, delete task.
- [ ] `src/pages/student/SprintPage.tsx` time picker: saving a scheduled time is optimistic and shows error UI on failure.
- [ ] `src/pages/student/SprintPage.tsx` keyboard navigation: arrow/space/enter shortcuts don’t trigger when editing inputs.
- [ ] `src/pages/student/SprintPage.tsx` AI/Muse: handles AI responses that create goals/tasks; duplicate/import goal actions call the right mutations.

- [ ] `src/pages/student/ReadingPage.tsx` tabs: library/reading/finished show correct subsets based on `studentBooks.status`.
- [ ] `src/pages/student/ReadingPage.tsx` start reading: clicking “Read/Start” calls `api.books.startReading` and moves the book into “Reading”.
- [ ] `src/pages/student/ReadingPage.tsx` status changes: “request presentation” and “presented” transitions call `api.books.updateStatus`.
- [ ] `src/pages/student/ReadingPage.tsx` review: rating required; submit calls `api.books.addReview` and updates UI.
- [ ] `src/pages/student/ReadingPage.tsx` cover fallback: `BookCover` shows icon when image fails.
- [ ] `src/pages/student/ReadingPage.tsx` error handling: mutation failures log and keep UI stable (no crashes).

- [ ] `src/pages/student/TrustJarPage.tsx` displays loading state when jar data is undefined; renders read-only jar with count when loaded.

### P1 — Student check-in and history
- [ ] `src/pages/student/EmotionCheckInPage.tsx` shows loading until categories and today’s check-in load.
- [ ] `src/pages/student/EmotionCheckInPage.tsx` happy path: select emotion + journal, save check-in, confirm success UI.
- [ ] `src/pages/student/EmotionCheckInPage.tsx` edit flow: loads existing check-in and updates via `api.emotions.updateCheckIn`.
- [ ] `src/pages/student/EmotionCheckInPage.tsx` error states: save/update failures show retry guidance and don’t lose draft text.

### P0 — Admin core operations
- [ ] `src/pages/admin/AdminDashboard.tsx` renders key cards/counts: students, active sprint, check-ins, viva queue, presentation queue.
- [ ] `src/pages/admin/AdminDashboard.tsx` can approve viva requests (calls `api.objectives.updateStatus`) and updates UI.
- [ ] `src/pages/admin/AdminDashboard.tsx` can approve/reject presentation requests (calls `api.books.approvePresentationRequest`) and updates UI.
- [ ] `src/pages/admin/AdminDashboard.tsx` today check-ins list renders with user/category/subcategory details.

- [ ] `src/pages/admin/StudentsPage.tsx` lists students; batch filter works; empty state renders when no students.
- [ ] `src/pages/admin/StudentsPage.tsx` create student: form validation; calls `api.auth.createUser`; handles “username exists” error.
- [ ] `src/pages/admin/StudentsPage.tsx` update batch: calls `api.users.updateBatch` and updates UI.
- [ ] `src/pages/admin/StudentsPage.tsx` remove student: confirms and calls `api.users.remove`; list updates.

- [ ] `src/pages/admin/SprintsPage.tsx` create/edit/delete sprint; active sprint indicator; set active calls `api.sprints.setActive`.
- [ ] `src/pages/admin/ObjectivesPage.tsx` CRUD majors/subs; domain switching; activity CRUD for sub-objectives.
- [ ] `src/pages/admin/ObjectivesPage.tsx` assign objective to multiple students and displays per-student results.
- [ ] `src/pages/admin/StudentDetailPage.tsx` assign/unassign sub-objectives for a student; reflects changes in assigned list.

- [ ] `src/pages/admin/VivaQueuePage.tsx` lists viva requests; approve/reject flows call `api.objectives.updateStatus` and update UI.
- [ ] `src/pages/admin/PresentationQueuePage.tsx` lists requests; approve/reject flows call `api.books.approvePresentationRequest`.
- [ ] `src/pages/admin/BooksPage.tsx` admin CRUD: add/edit/remove book; validation; handles optional fields.
- [ ] `src/pages/admin/TrustJarPage.tsx` admin controls call add/remove/reset; uses local token; UI updates count and timesCompleted.

### P1 — Admin projects & data entry
- [ ] `src/pages/admin/ProjectsPage.tsx` create/edit/delete/set active project; shows next cycle number; navigates to detail page.
- [ ] `src/pages/admin/ProjectDetailPage.tsx` filters: search, batch filter, status filter (complete/partial/empty).
- [ ] `src/pages/admin/ProjectDetailPage.tsx` expands/collapses a student card and shows links + reflection state correctly.
- [ ] `src/pages/admin/ProjectDetailPage.tsx` AI assistant open/close and safe behavior when AI returns invalid JSON or unknown student names.

---

## 4) Component Edge Cases

### P0 — Components with complex state/UX
- [ ] `src/components/layout/CheckInGate.tsx` delayed skeleton: renders nothing under threshold; shows skeleton only after delay.
- [ ] `src/components/layout/CheckInGate.tsx` selection: multi-select across quadrants; toggling an already-selected shade removes it.
- [ ] `src/components/layout/CheckInGate.tsx` “Enter to proceed” works only when there are selected emotions and journal isn’t open.
- [ ] `src/components/layout/CheckInGate.tsx` category mapping fallback: when no category matches selected emotion name, it falls back to first available category/subcategory.
- [ ] `src/components/layout/CheckInGate.tsx` save error: failed `saveCheckIn` shows retry UI and preserves selections/journal text.

- [ ] `src/components/skill-tree/ObjectivePopover.tsx` renders correctly for both “major” and “sub” node types.
- [ ] `src/components/skill-tree/ObjectivePopover.tsx` optimistic activity toggle: checkbox state updates immediately and clears optimistic state when mutation resolves.
- [ ] `src/components/skill-tree/ObjectivePopover.tsx` keyboard toggles (space/enter) work on focused checkbox and set correct `aria-checked`.
- [ ] `src/components/skill-tree/ObjectivePopover.tsx` resize handle: mouse drag clamps to min/max width and cleans up event listeners.

- [ ] `src/components/student/TaskAssigner.tsx` day/week mapping edge cases (week 1 vs week 2) and empty-state rendering.
- [ ] `src/components/sprint/HabitTracker.tsx` date grid: toggling completion updates UI; streak display matches backend logic.
- [ ] `src/components/reading/BookBuddy.tsx` handles empty history, empty available books, and malformed AI responses gracefully.
- [ ] `src/components/projects/ProjectDataChat.tsx` parses AI JSON blocks, validates student matching, and prevents saving when ambiguous.

### P1 — Shared UI building blocks
- [ ] `src/components/paper/Modal.tsx` focus trap/escape key/close button behaviors.
- [ ] `src/components/paper/Checkbox.tsx` keyboard + `aria-checked` correctness.
- [ ] `src/components/paper/ProgressBar.tsx` clamps percent values (<0, >100) and renders labels consistently.
- [ ] `src/components/layout/Sidebar.tsx` active route highlighting (exact match vs prefix match) for both roles.
- [ ] `src/components/layout/AdminLayout.tsx` Cmd+K search opens/closes; selecting a student navigates and closes dialog.

### P2 — Pure utilities (fast wins)
- [ ] `src/hooks/useDelayedLoading.ts` fake-timer tests for threshold and timer cleanup.
- [ ] `src/lib/status-utils.ts` status label/class mapping functions (goals, objectives, books).
- [ ] `src/lib/domain-utils.ts` icon/color mapping edge cases (unknown domain names).
- [ ] `src/lib/skill-tree-utils.ts` domain config fallback behavior.

---

## 5) Error States

### P0 — Must-not-crash scenarios
- [ ] Convex query `undefined` (loading) vs `null` (not found) is handled distinctly on pages that query `getById` (e.g., Domain/Project).
- [ ] Mutation throws (network/server error): UI shows a stable error message or retry affordance (Login, Setup, CheckInGate, Reading, Sprint).
- [ ] Session expiry mid-session: `useAuth` clears token and routes user back to `/login` without infinite loops.
- [ ] “Unauthorized” backend responses (admin token invalid) are surfaced clearly on admin-only mutation pages (Trust Jar, Create User, etc.).
- [ ] AI failures (timeouts/invalid output): Sprint Muse / BookBuddy / ProjectDataChat show fallback copy and do not corrupt state.

### P1 — Empty/edge datasets
- [ ] No sprints exist: student pages that depend on `activeSprint` handle `"skip"` and render a clear empty state.
- [ ] No domains/objectives assigned: `DeepWorkPage` and `DomainDetailPage` render empty states without errors.
- [ ] No books: `ReadingPage` renders empty library state and search behaves.
- [ ] Large lists: Students/projects/books pages remain responsive (basic render-time smoke tests).

---

## 6) Integration Tests (App-Level Flows)

### P0 — End-to-end user journeys (mocked Convex hooks)
- [ ] **First-run bootstrap**: `LoginPage` detects bootstrap → `SetupPage` creates admin → seeds starter data → returns to login.
- [ ] **Student login + gate**: authenticated student hits `/dashboard` → `CheckInGate` blocks until check-in saved → dashboard renders.
- [ ] **Deep Work mastery**: admin creates domain/objectives/activities → assigns to student → student completes activities → requests viva → admin marks mastered → student sees mastered state.
- [ ] **Sprint loop**: active sprint exists → student creates goal + tasks → schedules tasks → completes tasks → tasks-left counters update on dashboard.
- [ ] **Reading loop**: student starts reading → requests presentation → admin approves → student sees “finished” state and stats update.
- [ ] **Trust Jar**: admin adds/removes/reset with token → student sees updated count; reset increments `timesCompleted` only when full.

### P1 — Admin workflows spanning multiple screens
- [ ] **Student lifecycle**: admin creates student → student appears in Students list and search → admin updates batch → admin deletes student and related data is removed.
- [ ] **Projects data entry**: admin creates project → opens project detail → adds links/reflections (manual or via AI assistant) → stats update (complete/partial/empty).
- [ ] **Queues**: viva queue and presentation queue update when underlying status mutations run (including optimistic UI expectations).

