# Data Model and Contracts

Last updated: 2026-02-17

Source of truth: `convex/schema.ts`.

Use this document for table roles, status lifecycles, and cross-table contracts.
For exact field validators and index definitions, always verify in schema.

## Table groups

| Area | Tables | Purpose |
|---|---|---|
| Auth | `users`, `sessions` | Identity and session lifecycle |
| Emotions | `emotionCategories`, `emotionSubcategories`, `emotionCheckIns` | Daily check-in gate |
| Sprint | `sprints`, `goals`, `actionItems`, `habits`, `habitCompletions` | Planning and daily execution |
| Learning graph | `domains`, `majorObjectives`, `learningObjectives`, `activities` | Curriculum structure |
| Assignment and progress | `studentMajorObjectives`, `studentObjectives`, `activityProgress` | Per-student state and completion |
| Diagnostics | `diagnosticUnlockRequests`, `diagnosticUnlocks`, `diagnosticAttempts` | Mastery checks and approval gate |
| Reading | `books`, `studentBooks` | Library and reading/presentation state |
| Projects | `projects`, `projectLinks`, `projectReflections` | Project cycle and evidence |
| Other systems | `trustJar`, `visionBoardAreas`, `visionBoardCards`, `chatLogs` | Shared incentives, personal board, AI logs |

## Critical contracts

1. `studentMajorObjectives.status` is authoritative for major mastery state.
2. `studentObjectives.status` contains legacy-compatible values.
3. Activity completion updates can propagate objective status changes.
4. Diagnostic pass/fail is backend-derived from score percent and threshold.
5. Diagnostic retake unlock consumption tolerates legacy unlock rows by defaulting missing `attemptsRemaining` to `1` and missing `expiresAt` to `approvedAt + 24h`.
6. Reading queue logic still treats `studentBooks.status = "completed"` as legacy-compatible.

## Status lifecycles

### Major objective (`studentMajorObjectives.status`)

`assigned -> in_progress -> viva_requested -> mastered`

### Diagnostic unlock (`diagnosticUnlocks.status`)

`approved -> consumed` or `approved -> expired` or `approved -> revoked`

### Diagnostic request (`diagnosticUnlockRequests.status`)

`pending -> approved | denied | canceled`

### Student book (`studentBooks.status`)

`reading -> presentation_requested -> presented`

`completed` exists for legacy compatibility.

## Relationship map (high-level)

```text
users
  -> sessions
  -> emotionCheckIns
  -> goals -> actionItems
  -> habits -> habitCompletions
  -> studentObjectives -> activityProgress <- activities <- learningObjectives <- majorObjectives <- domains
  -> studentMajorObjectives -> majorObjectives
  -> studentBooks -> books
  -> projectLinks -> projects
  -> projectReflections -> projects
```

## Practical guidance

- When changing status logic, edit backend functions first.
- When adding fields, update schema and generated types before UI assumptions.
- Prefer generated Convex types over ad-hoc frontend types.

## Related docs

- `docs/CODEBASE-MAP.md`
- `docs/ARCHITECTURE.md`
- `docs/PATTERNS.md`
