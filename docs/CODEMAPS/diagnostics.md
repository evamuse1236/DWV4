# Diagnostics Codemap

**Last Updated:** 2026-01-29
**Backend:** `convex/diagnostics.ts`
**Frontend Page:** `src/pages/student/DiagnosticPage.tsx`
**Frontend Lib:** `src/lib/diagnostic.ts`
**Static Data:** `public/diagnostic/diagnostic-data.json`

## Purpose

The diagnostic system lets students prove mastery of a major objective by passing a quiz. Passing (100% score) auto-completes all sub-objectives and activities under that major, and sets the major to "mastered" status. This provides a fast-track alternative to completing every activity manually.

## Architecture

```
Student requests unlock
  -> diagnosticUnlockRequests (pending)
     |
     v
Admin approves
  -> diagnosticUnlocks (approved, 24h expiry, 1 attempt)
     |
     v
Student takes quiz
  -> DiagnosticPage loads diagnostic-data.json
  -> Finds matching module by section + moduleIndex
  -> Selects questions (pool/3, no repeats via localStorage)
  -> Student answers all questions
     |
     v
Submit attempt
  -> diagnosticAttempts record created
  -> If passed (100%):
     +-> studentMajorObjectives.status = "mastered"
     +-> All learningObjectives auto-completed
     +-> All activities auto-completed
     +-> Unlock consumed
  -> If failed:
     +-> Unlock consumed (attempt used up)
     +-> Attempt recorded for admin review
```

## Unlock Flow (3 Tables)

### `diagnosticUnlockRequests`
Student requests permission to take a diagnostic quiz.

```
pending -> approved (admin approves -> creates diagnosticUnlock)
        -> denied   (admin denies)
        -> canceled (student cancels)
```

### `diagnosticUnlocks`
Admin-created approval token with time limit and attempt count.

```
approved -> consumed (attempt used, attemptsRemaining = 0)
          -> expired  (expiresAt passed)
          -> revoked  (admin revokes)
```

### `diagnosticAttempts`
Record of each quiz attempt with per-question results.

Fields: userId, domainId, majorObjectiveId, attemptType (practice/mastery), diagnosticModuleName, diagnosticModuleIds, questionCount, score, passed, startedAt, submittedAt, durationMs, results[].

## Backend Functions (`convex/diagnostics.ts`)

| Function | Type | Purpose |
|----------|------|---------|
| `getCurriculumModuleIndex` | query | Map majorObjectiveId to section (dw/pyp) + moduleIndex |
| `getUnlockState` | query | Full state: assignment, active unlock, pending request, latest attempt |
| `requestUnlock` | mutation | Student creates pending request (idempotent) |
| `approveUnlock` | mutation | Admin approves -> creates diagnosticUnlock (default 24h, 1 attempt) |
| `denyUnlock` | mutation | Admin denies request |
| `revokeUnlock` | mutation | Admin revokes approved unlock |
| `getPendingUnlockRequests` | query | All pending requests (admin queue) |
| `getFailuresForQueue` | query | Latest failed attempts per student+major (admin review) |
| `getAttemptDetails` | query | Full attempt with user, major, domain context |
| `submitAttempt` | mutation | Record attempt, consume unlock, auto-master on pass |

## Frontend Data Loading (`src/lib/diagnostic.ts`)

**Static data:** Fetched from `/diagnostic/diagnostic-data.json` (served from `public/`).

**Types:**
- `DiagnosticModule` -- One quiz module (id, name, section, ka_links, standards, questions)
- `DiagnosticQuestion` -- One question (id, topic, stem, visual_html, choices, explanation)
- `DiagnosticGroupConfig` -- Aggregated module group for a major objective

**Key functions:**
| Function | Purpose |
|----------|---------|
| `loadDiagnosticData()` | Fetch + cache diagnostic-data.json |
| `findDiagnosticGroup()` | Find matching modules by section + moduleIndex |
| `getQuizLength()` | Calculate quiz length (pool size / 3) |
| `selectQuizQuestions()` | Select questions, avoiding recently-used (localStorage) |
| `shuffleInPlace()` | Fisher-Yates shuffle |
| `extractImageSrc()` | Parse img src from visual HTML |

**Question deduplication:** Uses localStorage key `diag_used_{userId}_{majorId}_{moduleName}` to track previously-seen question IDs, ensuring variety across attempts.

## Module Matching

The system maps a major objective to a diagnostic module using:
1. `getCurriculumModuleIndex` query returns `{ section: "dw"|"pyp", moduleIndex: N }`
2. Frontend calls `findDiagnosticGroup(modules, section, moduleIndex)` which finds all modules whose `module_name` starts with `"Module N:"` or `"PYP N:"`

## External Diagnostic Tool

The `diagnostic-check/` directory contains a standalone HTML/JS diagnostic tool:
- `index.html` -- Module browser
- `quiz.html` -- Quiz interface
- `data.js` -- Full question bank (12MB)
- `Curriculum_Map_Links.html` -- Curriculum map with links
- `tools/` -- Data processing utilities

This is separate from the main app's diagnostic system but shares the same question bank.
