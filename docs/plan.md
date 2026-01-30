# Diagnostic Mastery Checks (Deep Work) — Integration Plan

**Last Updated:** 2026-01-30

> **Implementation status:** The core diagnostic system is live. Tables (`diagnosticUnlockRequests`, `diagnosticUnlocks`, `diagnosticAttempts`) are in `convex/schema.ts`. Backend functions are in `convex/diagnostics.ts`. The student quiz runs at `/deep-work/diagnostic/:majorObjectiveId` via `DiagnosticPage.tsx` + `src/lib/diagnostic.ts`. Pre-built question sets (10 per module group, 30 questions each) replaced the original "random 1/3 of pool" approach. Set selection uses Convex-based attempt counting (`getAttemptCount`) instead of localStorage. See [CODEMAPS/diagnostics.md](./CODEMAPS/diagnostics.md) for the current architecture.
>
> Items marked **[DONE]** below are implemented. Items marked **[CHANGED]** deviate from the original plan. Unmarked items remain as-designed or are not yet implemented.

## Context (current behavior)

- Student Deep Work UX:
  - `/deep-work` (`src/pages/student/DeepWorkPage.tsx`) renders the skill tree and uses `src/components/skill-tree/ObjectivePopover.tsx` for the right panel.
  - The popover currently exposes **Viva request** for a major objective when **all sub-objectives are complete** (sub completion is “all activities complete”).
- Progress + viva:
  - Activity toggles: `convex/progress.ts` recalculates `studentObjectives.status` and updates `studentMajorObjectives.status` to/from `in_progress` as needed.
  - Viva request/approval: `convex/objectives.ts:updateStatus` updates `studentMajorObjectives.status` to `viva_requested` and admins approve to `mastered` in `src/pages/admin/VivaQueuePage.tsx`.
- Diagnostic prototype:
  - `diagnostic-check/index.html` (topic list) → `diagnostic-check/quiz.html?mod=<id>` (quiz runner).
  - `diagnostic-check/data.js` contains `DIAGNOSTIC_DATA`:
    - grouped by `module_name` (e.g. `Module 1: Whole Number Foundations`, `PYP 1: Geometry (Shapes & Angles)`)
    - each “mod” has `id` like `1.1`, `name`, `section` (`dw` or `pyp`), `ka_links`, and `questions[]`.
  - Prototype selects **~1/3 of the pool per attempt**, tracks used IDs in `localStorage`, shows misconceptions and KA remediation links, and stores “best score” in `localStorage`.

## Goal (new behavior)

Replace/augment the current “Request Viva” flow with an **in-app Diagnostic Test**:

1. **Practice Diagnostic**: students can take a diagnostic early (even if not “ready”).
2. **Mastery Diagnostic**: once a major objective is “ready” (all subs complete), the popover offers “Take Diagnostic” as the main next step.
3. **Pass rule**: **100% only**.
4. **On pass**:
   - save the diagnostic attempt,
   - automatically mark the major objective as **mastered**.
5. **On fail**:
   - save the full attempt details (questions + chosen answers + misconceptions + time taken),
   - surface it in the **existing Admin Viva Queue** (as a “Diagnostic Failure” section),
   - student UI changes the primary CTA to **Request Viva** (for directed viva).
6. Keep the `diagnostic-check/` tool **archived and safe** (authoritative question bank + baseline UI).
7. Implementation should be a **full React rebuild** for the student quiz experience (no iframe / no standalone HTML routes).

## Open questions to confirm (blocking details)

1. Early-pass behavior (CONFIRMED): if a student takes a diagnostic **before** completing all sub-objectives and scores **100%**, the system should:
   - auto-complete all remaining sub-objectives + activities for that major, and
   - auto-mark the major as `mastered`.
2. Diagnostic access control (NEW): students should not be able to take a diagnostic quiz without **coach approval** (to prevent brute-force retrying). See “Coach approval gate” below for the proposed mechanism.
3. Should a failed diagnostic appear in the admin queue **even if the student never clicks “Request Viva”**?
   - Current plan assumes **yes** (because you want the failure data for directed viva).

## Mapping strategy (Major Objective → Diagnostic pool)

### What we can infer from seeded curricula
The seeded majors in `convex/seed.ts` (e.g. MYP Y1: Foundations/Fractions/Decimals/Integers/Ratios & Rates/Algebra/Geometry; PYP Y2: Geometry/Arithmetic/Fractions/Measurement & Space/Decimals & Coords) appear to correspond to `diagnostic-check/data.js` groupings:

- `section: "dw"` includes module groups:
  - `Module 1: Whole Number Foundations`
  - `Module 2: The World of Fractions`
  - `Module 3: Decimals`
  - `Module 4: Integers (Negative Numbers)`
  - `Module 5: Ratios, Rates & Percentages`
  - `Module 6: Algebra`
  - `Module 7: Geometry & Data`
- `section: "pyp"` includes:
  - `PYP 1: Geometry (Shapes & Angles)`
  - `PYP 2: Arithmetic`
  - `PYP 3: Fractions`
  - `PYP 4: Measurement & Space`
  - `PYP 5: Decimals & Coords`

### Proposed mapping mechanism (automatic + auditable)
We will map each **major objective** to exactly one **diagnostic module group** (`module_name`), and the quiz pool becomes the union of all questions in that group.

1. Build a lightweight index from `DIAGNOSTIC_DATA`:
   - `module_name -> { section, moduleIds: string[], totalQuestions, ka_links[] }`
2. For each major objective, infer its group:
   - Determine target section:
     - `major.curriculum` starts with `PYP` → `section="pyp"`
     - otherwise → `section="dw"`
   - Choose best `module_name` by fuzzy match against the major title:
     - normalize: lowercase, drop punctuation, drop common filler words (`module`, `the`, `of`, etc.)
     - compute token overlap score between major title and `module_name` suffix (text after `:`)
     - tie-break using KA link affinity:
       - compare major’s activity URLs (Khan/Brilliant) with diagnostic group’s `ka_links[].url` (substring match, ignoring `imp-` differences).
3. Verification script prints:
   - chosen mapping + score per major
   - any majors that fail to map above a confidence threshold
4. Manual override file (only if needed):
   - `docs/diagnostic-mapping-overrides.json` keyed by `{ curriculum, majorTitle } -> module_name`

This satisfies “figure it out” while still giving a safe escape hatch for edge cases.

## Data model changes (Convex) [DONE]

### Coach approval gate (new tables) [DONE]

To prevent brute-force attempts, enforce server-side “unlock” before the student can start/submit an attempt.

#### New table: `diagnosticUnlocks` [DONE]
Purpose: a coach-approved, time-bounded authorization to attempt a diagnostic for a specific student + major objective.

Fields:
- `userId: Id<"users">`
- `majorObjectiveId: Id<"majorObjectives">`
- `approvedBy: Id<"users">`
- `approvedAt: number`
- `expiresAt: number` (default: 24 hours after approval)
- `attemptsRemaining: number` (default: 1)
- `status: "approved" | "consumed" | "expired" | "revoked"`

Indexes:
- `by_user_major` (`userId`, `majorObjectiveId`, `approvedAt`)
- `by_status` (`status`, `approvedAt`)

#### New table: `diagnosticUnlockRequests` [DONE]
Purpose: allow students to request an unlock (so the coach can approve from the queue).

Fields:
- `userId: Id<"users">`
- `majorObjectiveId: Id<"majorObjectives">`
- `requestedAt: number`
- `status: "pending" | "approved" | "denied" | "canceled"`
- `handledBy?: Id<"users">`
- `handledAt?: number`

Indexes:
- `by_status` (`status`, `requestedAt`)
- `by_user_major` (`userId`, `majorObjectiveId`, `requestedAt`)

### New table: `diagnosticAttempts` [DONE]
Purpose: store every diagnostic attempt (practice + mastery attempts), with full detail for admin review.

Fields:
- `userId: Id<"users">`
- `domainId: Id<"domains">`
- `majorObjectiveId: Id<"majorObjectives">`
- `studentMajorObjectiveId: Id<"studentMajorObjectives">` (for easy joins; nullable if no major assignment exists yet)
- `unlockId?: Id<"diagnosticUnlocks">` (if attempt required an unlock)
- `attemptType: "practice" | "mastery"`
- `diagnosticModuleName: string` (the group used)
- `diagnosticModuleIds: string[]` (e.g. `["1.1","1.2","1.3"]`)
- `questionCount: number`
- `score: number`
- `passed: boolean` (pass = score === questionCount)
- `startedAt: number`
- `submittedAt: number`
- `durationMs: number` (soft timer)
- `results: { questionId, topic, chosenLabel, correctLabel, correct, misconception, explanation }[]`

Indexes:
- `by_user_major` (`userId`, `majorObjectiveId`, `submittedAt`)
- `by_major_passed` (`majorObjectiveId`, `passed`, `submittedAt`)
- `by_passed` (`passed`, `submittedAt`) (for queue queries)

### Optional: link last diagnostic on major assignment
If we want fast “show latest failed attempt” UX:
- add `lastDiagnosticAttemptId?: Id<"diagnosticAttempts">` to `studentMajorObjectives`
- or compute it by query + index (preferred if indexes are sufficient).

### Docs update
Update `docs/DATA-MODEL.md` for the new table and indexes.

## Backend API (Convex) additions [DONE]

Implemented in `convex/diagnostics.ts`:

### Queries
- `diagnostics.getPendingUnlockRequests()`
  - returns pending requests for the admin queue UI.
- `diagnostics.getActiveUnlock({ userId, majorObjectiveId })`
  - returns whether the student currently has an active unlock (approved + not expired + attemptsRemaining > 0).
- `diagnostics.getLatestForUserMajor({ userId, majorObjectiveId })`
  - returns latest attempt summary (passed/failed, score, duration, submittedAt).
- `diagnostics.getFailuresForQueue()`
  - returns latest failed attempt per `(userId, majorObjectiveId)` where the corresponding major is not mastered.
- `diagnostics.getAttemptDetails({ attemptId })`
  - returns full results list for admin review UI.

### Mutations
- `diagnostics.requestUnlock({ userId, majorObjectiveId })`
  - student-created request (idempotent if a pending request already exists).
- `diagnostics.approveUnlock({ requestId, approvedBy, expiresInMinutes, attemptsGranted })`
  - admin action: creates a `diagnosticUnlocks` record and marks request approved.
  - defaults: `expiresInMinutes = 1440` (24 hours), `attemptsGranted = 1`
- `diagnostics.revokeUnlock({ unlockId })` (optional)
  - admin action.
- `diagnostics.submitAttempt({ ...attemptPayload })`
  - inserts attempt
  - validates unlock (required) and consumes 1 attempt:
    - reject if no active unlock (approved + not expired + attemptsRemaining > 0)
    - decrement `attemptsRemaining`, set `consumed/expired` when it reaches 0
  - if `passed === true`:
    - set `studentMajorObjectives.status = "mastered"` via `ctx.db.patch(...)`
    - ensure all sub-objectives under that major are assigned + marked `completed`
    - ensure all activities under those sub-objectives have `activityProgress.completed = true`
  - if `passed === false`:
    - no status change by default
    - enables student UI to show “Request Viva” with a link to the attempt

## Student UI changes (React) [DONE]

### Routing [DONE]
Route added in `src/App.tsx`:
- `/deep-work/diagnostic/:majorObjectiveId` → `src/pages/student/DiagnosticPage.tsx`

### UI entry points
Update `src/components/skill-tree/ObjectivePopover.tsx`:
- Replace “Practice Diagnostic” with an unlock-gated flow:
  - Show “Request Diagnostic” when no unlock exists.
  - Show “Start Diagnostic” when an unlock is active.
- When a major is “ready” (all subs complete) and not mastered:
  - show “Start Mastery Diagnostic” as primary CTA (still unlock-gated).
- If latest attempt for that major is failed:
  - show “Request Viva” as primary CTA (as requested).

### Quiz runner (React rebuild) [DONE, CHANGED]
Implemented in `src/pages/student/DiagnosticPage.tsx` + `src/lib/diagnostic.ts`:
- Data loading: `diagnostic-data.json` and `diagnostic-sets.json` fetched from `public/diagnostic/` and cached in memory.
- **[CHANGED]** Question selection uses **pre-built deterministic sets** (10 per module group, 30 questions each) instead of random 1/3 pool selection. Set index = `attemptCount % 10` via Convex `getAttemptCount` query, replacing localStorage-based tracking.
- **[CHANGED]** Quiz length is always 30 (not `round(pool / 3)`).
- Falls back to random 30 from pool if sets fail to load.
- Records: start time, per-question selection, correctness, misconceptions, topic, end time + duration.
- Results: "Mastered" success state on pass, misconceptions + remediation links on fail.

### Submit + post-submit state
On quiz completion:
- call `api.diagnostics.submitAttempt`
- if pass:
  - return user to Deep Work and show “Mastered” for that major (existing UI already renders mastered badge based on `studentMajorObjectives.status`)
- if fail:
  - keep results visible to student,
  - show “Request Viva” CTA that calls `api.objectives.updateStatus({ status: "viva_requested" })`
  - optionally include a short note or attempt ID reference so the coach can jump to the attempt quickly.

## Admin UI changes (Existing Viva Queue)

Update `src/pages/admin/VivaQueuePage.tsx`:
- Keep current “Pending Viva Requests” section as-is.
- Add a “Diagnostic Unlock Requests” section powered by `api.diagnostics.getPendingUnlockRequests`.
  - Approve creates an unlock (configurable attempts + expiry).
- Add a “Diagnostic Failures” section powered by `api.diagnostics.getFailuresForQueue`.
- Each failure card shows:
  - student, domain, major objective, score, duration, submittedAt
  - CTA: “View Details”
- Add a detail view (either modal or dedicated route):
  - show per-question:
    - question image (from `visual_html` or extracted URL),
    - topic, chosen vs correct, misconception, explanation
  - CTA actions:
    - “Approve Mastery” → set `studentMajorObjectives.status = "mastered"`
    - “Start/Request Viva” (optional) → set `viva_requested` if you want that workflow

## Testing plan

### Unit tests (Vitest)
- Mapping:
  - given seeded majors (MYP Y1 + PYP Y2), mapping picks the expected `module_name` groups.
- Quiz selection:
  - 1/3 rule, used ID exclusion, reset when pool exhausted.
- Submission:
  - pass → inserts attempt + updates major to `mastered`
  - fail → inserts attempt, no mastery update
- Viva queue:
  - failure list renders and shows detail data.

### Manual verification checklist
- Student:
  - practice diagnostic works on a not-ready major
  - mastery diagnostic appears only when ready
  - 100% pass auto-masters and Deep Work UI reflects it
  - fail stores attempt and flips CTA to “Request Viva”
- Admin:
  - diagnostic failures appear in Viva Queue
  - detail view shows misconceptions and question context

## Rollout / migration [DONE]

- `diagnostic-check/` retained as the archived source-of-truth.
- Export pipeline: `diagnostic-check/tools/build_ka_diagnostic.py` generates `data.js` + `data-sets.js`; `scripts/export-diagnostic-data.mjs` converts to JSON in `public/diagnostic/`.
- Mapping uses `getCurriculumModuleIndex` query (section + moduleIndex) instead of fuzzy title matching. No override file needed.

## Implementation steps (order) [DONE]

1. **[DONE]** Create diagnostic data export pipeline (`diagnostic-check/` -> `public/diagnostic/`).
2. **[DONE]** Add `diagnosticAttempts`, `diagnosticUnlocks`, `diagnosticUnlockRequests` tables + indexes in `convex/schema.ts`.
3. **[DONE]** Implement `convex/diagnostics.ts` queries/mutations.
4. **[DONE]** Build student diagnostic route + React quiz runner (`DiagnosticPage.tsx`).
5. **[DONE]** Update `VivaQueuePage` to show diagnostic unlock requests + failures.
6. Tests remain to be added (see `docs/TEST-PLAN.md`).
