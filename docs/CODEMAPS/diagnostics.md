# Diagnostics Codemap

**Last Updated:** 2026-01-30
**Backend:** `convex/diagnostics.ts`
**Frontend Page:** `src/pages/student/DiagnosticPage.tsx`
**Frontend Lib:** `src/lib/diagnostic.ts`
**Static Data:** `public/diagnostic/diagnostic-data.json`, `public/diagnostic/diagnostic-sets.json`

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
  -> DiagnosticPage loads diagnostic-data.json + diagnostic-sets.json
  -> Finds matching module by section + moduleIndex
  -> Queries attempt count from Convex (getAttemptCount)
  -> Picks pre-built set: sets[attemptCount % 10]
  -> Resolves question IDs to full objects
  -> Student answers all questions (always 30)
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
| `getAttemptCount` | query | Count diagnostic attempts for user + majorObjective (for set cycling) |
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

**Types:**
- `DiagnosticModule` -- One quiz module (id, name, section, ka_links, standards, questions)
- `DiagnosticQuestion` -- One question (id, topic, stem, visual_html, choices, explanation)
- `DiagnosticGroupConfig` -- Aggregated module group for a major objective
- `DiagnosticSet` -- Pre-built question set (groupPrefix, setIndex, questionIds)

**Key functions:**
| Function | Purpose |
|----------|---------|
| `loadDiagnosticData()` | Fetch + cache diagnostic-data.json |
| `loadDiagnosticSets()` | Fetch + cache diagnostic-sets.json |
| `findDiagnosticGroup()` | Find matching modules by section + moduleIndex |
| `getSetForAttempt()` | Pick pre-built set: `sets[attemptCount % 10]` for the matching group |
| `resolveSetQuestions()` | Map set question IDs to full question objects, preserving set order |
| `shuffleInPlace()` | Fisher-Yates shuffle (used in fallback path) |
| `extractImageSrc()` | Parse img src from visual HTML |

**Question selection:** Uses pre-built deterministic sets (10 per module group, max 30 questions each). The attempt count from Convex (`getAttemptCount`) determines which set to use, cycling back to set 0 after 10 attempts. Falls back to random 30 from pool if sets fail to load.

**Legacy functions (still exported, no longer used by DiagnosticPage):**
- `getQuizLength()` -- was pool/3, replaced by fixed 30-question sets
- `selectQuizQuestions()` -- was random selection with dedup, replaced by pre-built sets
- `getUsedQuestionKey()`, `readUsedQuestionIds()`, `writeUsedQuestionIds()` -- localStorage tracking replaced by Convex attempt counting

## Module Matching

The system maps a major objective to a diagnostic module using:
1. `getCurriculumModuleIndex` query returns `{ section: "dw"|"pyp", moduleIndex: N }`
2. Frontend calls `findDiagnosticGroup(modules, section, moduleIndex)` which finds all modules whose `module_name` starts with `"Module N:"` or `"PYP N:"`

## Pre-Built Question Sets

**Build pipeline:** `diagnostic-check/tools/build_ka_diagnostic.py` generates both `data.js` (question bank) and `data-sets.js` (pre-built sets). The export script `scripts/export-diagnostic-data.mjs` converts both to JSON in `public/diagnostic/`.

**Algorithm:**
1. Group modules by prefix (e.g. "Module 1:" = sub-modules 1.1, 1.2, 1.3)
2. For each of 10 sets per group:
   - Seed PRNG with `SHA256(groupPrefix + setIndex)`
   - Shuffle each sub-module's questions independently
   - Round-robin: pick 1 question from each sub-module in turn until 30 reached
3. Output: `{ groupPrefix, setIndex, questionIds[] }`

**Stats:** 70 sets total (7 groups x 10 sets), each with exactly 30 questions balanced across sub-modules.

**Rebuilding sets:**
```bash
# From diagnostic-check/ directory
python tools/build_ka_diagnostic.py

# From DW/ root (exports JSON for frontend)
node scripts/export-diagnostic-data.mjs
```

## External Diagnostic Tool

The `diagnostic-check/` directory contains a standalone HTML/JS diagnostic tool:
- `index.html` -- Module browser
- `quiz.html` -- Quiz interface
- `data.js` -- Full question bank (9MB)
- `data-sets.js` -- Pre-built question sets (70 sets)
- `Curriculum_Map_Links.html` -- Curriculum map with links
- `tools/` -- Data processing utilities (`build_ka_diagnostic.py`)

This is separate from the main app's diagnostic system but shares the same question bank and set generation.
