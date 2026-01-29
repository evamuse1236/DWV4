# Data Model Codemap

**Last Updated:** 2026-01-29
**Schema File:** `convex/schema.ts`
**Total Tables:** 26

## Table Groups

```
AUTH (2)         users, sessions
EMOTIONS (3)     emotionCategories, emotionSubcategories, emotionCheckIns
SPRINTS (1)      sprints
GOALS (2)        goals, actionItems
HABITS (2)       habits, habitCompletions
DEEP WORK (4)    domains, majorObjectives, learningObjectives, activities
ASSIGNMENTS (3)  studentObjectives, studentMajorObjectives, activityProgress
DIAGNOSTICS (3)  diagnosticUnlockRequests, diagnosticUnlocks, diagnosticAttempts
READING (2)      books, studentBooks
PROJECTS (3)     projects, projectLinks, projectReflections
TRUST JAR (1)    trustJar
VISION BOARD (2) visionBoardAreas, visionBoardCards
AI LOGS (1)      chatLogs
```

## Relationship Diagram

```
users ----< sessions
  |
  +----< emotionCheckIns >---- emotionCategories ----< emotionSubcategories
  |
  +----< goals ----< actionItems
  |        |
  |        +---- sprints
  |
  +----< habits ----< habitCompletions
  |        |
  |        +---- sprints
  |
  +----< studentObjectives >---- learningObjectives ----< activities
  |         |                          |
  |         +----< activityProgress    +---- majorObjectives
  |                                              |
  +----< studentMajorObjectives >---- majorObjectives ----< learningObjectives
  |                                        |
  |                                        +---- domains
  |
  +----< diagnosticUnlockRequests >---- majorObjectives
  +----< diagnosticUnlocks >---- majorObjectives
  +----< diagnosticAttempts >---- majorObjectives, domains
  |
  +----< studentBooks >---- books
  |
  +----< projectLinks >---- projects
  +----< projectReflections >---- projects
  |
  +----< visionBoardAreas ----< visionBoardCards

trustJar (per-batch singleton, indexed by "batch")
chatLogs (append-only log)
```

## Key Hierarchy: Deep Work

The deep work system has a 4-level hierarchy:

```
domains (e.g., "Mathematics")
  +-- majorObjectives (e.g., "Module 1: Whole Number Foundations")
       |   curriculum: "MYP Y1" | "PYP Y2" | null
       |   difficulty: beginner | intermediate | advanced
       |
       +-- learningObjectives (e.g., "1.1 Place Value")
            |   difficulty: beginner | intermediate | advanced
            |
            +-- activities (e.g., "Khan Academy: Place Value")
                 |   type: video | exercise | reading | project | game
                 |   url: "https://..."
                 |   platform: "Khan Academy" | "Brilliant" | etc.
```

## Assignment Model

Students are assigned objectives at two levels:

```
studentMajorObjectives      studentObjectives
  userId + majorObjectiveId   userId + objectiveId (learningObjective)
  status: assigned |          status: assigned |
          in_progress |               in_progress |
          viva_requested |            completed |
          mastered                    mastered (legacy) |
                                     viva_requested (legacy)
```

**Key rule:** `studentMajorObjectives` is the authoritative source for viva/mastery status. The legacy statuses on `studentObjectives` exist only for backward compatibility.

## Status Lifecycles

### Major Objective Status
```
assigned -> in_progress -> viva_requested -> mastered
                            |
                            +-> (diagnostic pass auto-masters)
```

### Sub-Objective Status
```
assigned -> in_progress -> completed
```

### Book Status
```
reading -> presentation_requested -> presented
   |
   +-> completed (legacy, treated as pending presentation)
```

### Diagnostic Unlock Lifecycle
```
Request:  pending -> approved | denied | canceled
Unlock:   approved -> consumed | expired | revoked
```

## Index Summary

| Table | Indexes |
|-------|---------|
| users | by_username, by_role, by_batch |
| sessions | by_token, by_user |
| emotionSubcategories | by_category |
| emotionCheckIns | by_user, by_user_date |
| sprints | by_active, by_dates |
| goals | by_user, by_sprint, by_user_sprint |
| actionItems | by_goal, by_user, by_user_day |
| habits | by_user, by_sprint, by_user_sprint |
| habitCompletions | by_habit, by_habit_date, by_user_date |
| majorObjectives | by_domain |
| learningObjectives | by_domain, by_major_objective |
| activities | by_objective |
| studentObjectives | by_user, by_objective, by_user_objective, by_user_major, by_status |
| studentMajorObjectives | by_user, by_major_objective, by_user_major, by_status |
| activityProgress | by_user, by_activity, by_student_objective |
| diagnosticUnlockRequests | by_status, by_user_major |
| diagnosticUnlocks | by_user_major, by_status |
| diagnosticAttempts | by_user_major, by_passed, by_major_passed |
| books | by_grade, by_genre |
| studentBooks | by_user, by_book, by_user_book, by_status |
| trustJar | by_batch |
| projects | by_active, by_cycle |
| projectLinks | by_project, by_project_user |
| projectReflections | by_project, by_project_user |
| visionBoardAreas | by_user |
| visionBoardCards | by_user, by_user_area |
| chatLogs | by_timestamp |

## Full Field Reference

See [docs/DATA-MODEL.md](../DATA-MODEL.md) for the complete field-by-field table reference.
