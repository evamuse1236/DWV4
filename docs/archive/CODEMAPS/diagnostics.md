# Diagnostics Codemap

**Last Updated:** 2026-02-17
**Backend:** `convex/diagnostics.ts`
**Frontend Page:** `src/pages/student/DiagnosticPage.tsx`
**Frontend Lib:** `src/lib/diagnostic.ts`
**Runtime Data Source:** `public/diagnostic_v2/mastery_data.json`

## Purpose

Diagnostics let a student prove mastery of a major objective through a quiz.
Passing auto-masters the major and marks all related sub-objectives/activities complete.

## Key Policy

- Pass threshold: **90%** (`PASS_THRESHOLD_PERCENT` in `convex/diagnostics.ts`)
- First attempt can start directly when module is not mastered
- After a failed attempt:
  - student must request viva (`studentMajorObjectives.status = "viva_requested"`)
  - coach must approve a diagnostic unlock
  - unlock defaults to 24h and 1 attempt

## Runtime Flow

```
Student opens DiagnosticPage
  -> getCurriculumModuleIndex (maps major objective to section + module index)
  -> getUnlockState (gate policy + latest attempt + unlock state)
  -> loadDiagnosticData() from /diagnostic_v2/mastery_data.json
  -> findDiagnosticGroup() resolves module question pool
  -> getAttemptCount() from Convex
  -> selectDeterministicQuestions(seed = userId:majorObjectiveId:attemptCount)
  -> submitAttempt()
     -> scorePercent + passThresholdPercent saved
     -> passed if scorePercent >= 90
     -> on pass: major mastered + all sub-objectives/activities auto-completed
```

## Data Tables

### `diagnosticUnlockRequests`
Pending student requests for coach unlocks.

### `diagnosticUnlocks`
Coach approvals with expiry + attempts remaining.

### `diagnosticAttempts`
Attempt history, including:
- score + scorePercent
- passThresholdPercent (snapshot of policy at submission time)
- passed
- detailed per-question results

## Backend API (`convex/diagnostics.ts`)

| Function | Type | Purpose |
|----------|------|---------|
| `getCurriculumModuleIndex` | query | Map major objective -> `{ section, moduleIndex }` |
| `getUnlockState` | query | Returns major assignment, active unlock, latest attempt, and gate policy |
| `requestUnlock` | mutation | Student requests unlock after failed attempt + viva request |
| `approveUnlock` | mutation | Coach approves pending request and issues unlock |
| `denyUnlock` | mutation | Coach denies unlock request |
| `revokeUnlock` | mutation | Coach revokes active unlock |
| `getPendingUnlockRequests` | query | Admin queue of pending unlock requests |
| `getFailuresForQueue` | query | Latest failed attempts per student/major for admin triage |
| `getAllAttemptsForAdmin` | query | Full recent attempts feed for admin views |
| `getAttemptCount` | query | Attempts count used for deterministic question seed |
| `getAttemptDetails` | query | Attempt detail for admin review dialog |
| `submitAttempt` | mutation | Records attempt, enforces policy, applies mastery updates on pass |

## Frontend Helpers (`src/lib/diagnostic.ts`)

| Function | Purpose |
|----------|---------|
| `loadDiagnosticData()` | Load/normalize Diagnostic V2 payload from `mastery_data.json` |
| `findDiagnosticGroup()` | Find module group by section + module index |
| `selectDeterministicQuestions()` | Deterministic shuffle + slice using stable seed |
| `extractImageSrc()` | Extract image URLs from `visual_html` |

Legacy exports (`loadDiagnosticSets`, `getSetForAttempt`, `selectQuizQuestions`) still exist but are not used by `DiagnosticPage`.

