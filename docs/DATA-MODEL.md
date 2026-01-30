# Data Model and Contracts

**Last Updated:** 2026-01-30

## Source of truth
- Schema: `convex/schema.ts` defines 26 tables and indexes.
- Generated types: `convex/_generated/dataModel.d.ts` should be used when available.
- Frontend types in `src/types/index.ts` are temporary and do not cover all fields.

## Table inventory (26 total)

| Area | Tables | Purpose |
| --- | --- | --- |
| Auth | `users`, `sessions` | Credentials, role, and session tokens |
| Emotions | `emotionCategories`, `emotionSubcategories`, `emotionCheckIns` | Daily mood check-ins |
| Sprints | `sprints` | Active sprint lifecycle |
| Goals | `goals`, `actionItems` | SMART goals and daily tasks |
| Habits | `habits`, `habitCompletions` | Habit routines and completion tracking |
| Deep work | `domains`, `majorObjectives`, `learningObjectives`, `activities` | Skills, objectives, and activities |
| Assignments | `studentObjectives`, `studentMajorObjectives`, `activityProgress` | Student progress through objectives |
| Diagnostics | `diagnosticUnlockRequests`, `diagnosticUnlocks`, `diagnosticAttempts` | Coach-approved mastery checks + attempt history |
| Reading | `books`, `studentBooks` | Library and reading progress |
| Projects | `projects`, `projectLinks`, `projectReflections` | 6-week projects and submissions |
| Trust jar | `trustJar` | Shared reward state (per batch) |
| Vision Board | `visionBoardAreas`, `visionBoardCards` | Personal goal visualization |
| AI Logs | `chatLogs` | AI chat interaction logs (dev) |

## Tables (fields + indexes)

### Auth

#### `users`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"users">` | Primary key |
| `username` | `string` | Login identifier, unique |
| `passwordHash` | `string` | Hashed password |
| `role` | `"student" | "admin"` | Role gating |
| `displayName` | `string` | Display name |
| `avatarUrl` | `string?` | Optional avatar |
| `batch` | `string?` | Student cohort (e.g. "2156") |
| `createdAt` | `number` | Unix ms timestamp |
| `lastLoginAt` | `number?` | Unix ms timestamp |

Indexes: `by_username`, `by_role`, `by_batch`

#### `sessions`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"sessions">` | Primary key |
| `userId` | `Id<"users">` | Session owner |
| `token` | `string` | Stored in localStorage |
| `expiresAt` | `number` | Unix ms timestamp |

Indexes: `by_token`, `by_user`

### Emotions

#### `emotionCategories`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"emotionCategories">` | Primary key |
| `name` | `string` | Category name |
| `emoji` | `string` | Display emoji string |
| `color` | `string` | CSS color |
| `order` | `number` | Display order |

#### `emotionSubcategories`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"emotionSubcategories">` | Primary key |
| `categoryId` | `Id<"emotionCategories">` | Parent category |
| `name` | `string` | Subcategory name |
| `emoji` | `string` | Display emoji |
| `order` | `number` | Display order |

Indexes: `by_category`

#### `emotionCheckIns`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"emotionCheckIns">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `categoryId` | `Id<"emotionCategories">` | Selected category |
| `subcategoryId` | `Id<"emotionSubcategories">` | Selected subcategory |
| `journalEntry` | `string?` | Optional journal text |
| `timestamp` | `number` | Unix ms timestamp |

Indexes: `by_user`, `by_user_date` (`userId`, `timestamp`)

### Sprints

#### `sprints`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"sprints">` | Primary key |
| `name` | `string` | Sprint name |
| `startDate` | `string` | ISO date string |
| `endDate` | `string` | ISO date string |
| `isActive` | `boolean` | Only one should be active |
| `createdBy` | `Id<"users">` | Admin creator |

Indexes: `by_active`, `by_dates` (`startDate`, `endDate`)

### Goals

#### `goals`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"goals">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `sprintId` | `Id<"sprints">` | Sprint |
| `title` | `string` | Goal title |
| `specific` | `string` | SMART: Specific |
| `measurable` | `string` | SMART: Measurable |
| `achievable` | `string` | SMART: Achievable |
| `relevant` | `string` | SMART: Relevant |
| `timeBound` | `string` | SMART: Time-bound |
| `status` | `"not_started" | "in_progress" | "completed"` | Goal status |
| `createdAt` | `number` | Unix ms timestamp |
| `updatedAt` | `number` | Unix ms timestamp |

Indexes: `by_user`, `by_sprint`, `by_user_sprint`

#### `actionItems`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"actionItems">` | Primary key |
| `goalId` | `Id<"goals">` | Parent goal |
| `userId` | `Id<"users">` | Student |
| `title` | `string` | Task title |
| `description` | `string?` | Optional details |
| `weekNumber` | `number` | Sprint week index |
| `dayOfWeek` | `number` | 0-6 (Sun-Sat) |
| `scheduledTime` | `string?` | Optional time block |
| `isCompleted` | `boolean` | Completion state |
| `completedAt` | `number?` | Unix ms timestamp |
| `order` | `number` | Display order |

Indexes: `by_goal`, `by_user`, `by_user_day` (`userId`, `weekNumber`, `dayOfWeek`)

### Habits

#### `habits`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"habits">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `sprintId` | `Id<"sprints">` | Sprint |
| `name` | `string` | Habit name |
| `description` | `string?` | Optional description |
| `whatIsHabit` | `string` | Definition |
| `howToPractice` | `string` | Instructions |
| `cue` | `string?` | Optional cue |
| `reward` | `string?` | Optional reward |
| `createdAt` | `number` | Unix ms timestamp |

Indexes: `by_user`, `by_sprint`, `by_user_sprint`

#### `habitCompletions`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"habitCompletions">` | Primary key |
| `habitId` | `Id<"habits">` | Parent habit |
| `userId` | `Id<"users">` | Student |
| `date` | `string` | ISO date string |
| `completed` | `boolean` | Completion state |

Indexes: `by_habit`, `by_habit_date` (`habitId`, `date`), `by_user_date` (`userId`, `date`)

### Deep work domains

#### `domains`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"domains">` | Primary key |
| `name` | `string` | Domain name |
| `icon` | `string` | Emoji/icon token |
| `color` | `string` | CSS color |
| `description` | `string` | Domain description |
| `order` | `number` | Display order |

#### `majorObjectives`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"majorObjectives">` | Primary key |
| `domainId` | `Id<"domains">` | Parent domain |
| `title` | `string` | Objective title |
| `description` | `string` | Objective description |
| `difficulty` | `"beginner" | "intermediate" | "advanced"?` | Optional difficulty |
| `estimatedHours` | `number?` | Optional estimate |
| `createdBy` | `Id<"users">` | Admin creator |
| `createdAt` | `number` | Unix ms timestamp |

Indexes: `by_domain`

#### `learningObjectives`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"learningObjectives">` | Primary key |
| `domainId` | `Id<"domains">` | Parent domain |
| `majorObjectiveId` | `Id<"majorObjectives">?` | Parent major objective |
| `title` | `string` | Sub-objective title |
| `description` | `string` | Sub-objective description |
| `difficulty` | `"beginner" | "intermediate" | "advanced"` | Difficulty |
| `estimatedHours` | `number?` | Optional estimate |
| `createdBy` | `Id<"users">` | Admin creator |
| `createdAt` | `number` | Unix ms timestamp |

Indexes: `by_domain`, `by_major_objective`

#### `activities`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"activities">` | Primary key |
| `objectiveId` | `Id<"learningObjectives">` | Parent objective |
| `title` | `string` | Activity title |
| `type` | `"video" | "exercise" | "reading" | "project" | "game"` | Activity type |
| `url` | `string` | Resource URL |
| `platform` | `string?` | Optional platform |
| `estimatedMinutes` | `number?` | Optional estimate |
| `order` | `number` | Display order |
| `instructions` | `string?` | Optional instructions |

Indexes: `by_objective`

### Assignments and progress

#### `studentObjectives`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"studentObjectives">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `objectiveId` | `Id<"learningObjectives">` | Sub-objective |
| `majorObjectiveId` | `Id<"majorObjectives">?` | Parent major |
| `assignedBy` | `Id<"users">` | Admin |
| `assignedAt` | `number` | Unix ms timestamp |
| `status` | `"assigned" | "in_progress" | "completed" | "mastered" | "viva_requested"` | Legacy values remain in schema |
| `vivaRequestedAt` | `number?` | Legacy |
| `masteredAt` | `number?` | Legacy |
| `adminNotes` | `string?` | Optional notes |

Indexes: `by_user`, `by_objective`, `by_user_objective`, `by_user_major`, `by_status`

#### `studentMajorObjectives`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"studentMajorObjectives">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `majorObjectiveId` | `Id<"majorObjectives">` | Major objective |
| `assignedBy` | `Id<"users">` | Admin |
| `assignedAt` | `number` | Unix ms timestamp |
| `status` | `"assigned" | "in_progress" | "viva_requested" | "mastered"` | Primary major-status field |
| `vivaRequestedAt` | `number?` | Optional timestamp |
| `masteredAt` | `number?` | Optional timestamp |
| `adminNotes` | `string?` | Optional notes |

Indexes: `by_user`, `by_major_objective`, `by_user_major`, `by_status`

#### `activityProgress`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"activityProgress">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `activityId` | `Id<"activities">` | Activity |
| `studentObjectiveId` | `Id<"studentObjectives">` | Assignment |
| `completed` | `boolean` | Completion state |
| `completedAt` | `number?` | Unix ms timestamp |
| `timeSpentMinutes` | `number?` | Optional duration |
| `notes` | `string?` | Optional notes |

Indexes: `by_user`, `by_activity`, `by_student_objective`

### Diagnostics

#### `diagnosticUnlockRequests`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"diagnosticUnlockRequests">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `majorObjectiveId` | `Id<"majorObjectives">` | Major objective |
| `requestedAt` | `number` | Unix ms timestamp |
| `status` | `"pending" | "approved" | "denied" | "canceled"` | Request lifecycle |
| `handledBy` | `Id<"users">?` | Admin who handled |
| `handledAt` | `number?` | Unix ms timestamp |

Indexes: `by_status`, `by_user_major`

#### `diagnosticUnlocks`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"diagnosticUnlocks">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `majorObjectiveId` | `Id<"majorObjectives">` | Major objective |
| `approvedBy` | `Id<"users">` | Admin approver |
| `approvedAt` | `number` | Unix ms timestamp |
| `expiresAt` | `number` | Unix ms timestamp (default 24h after approval) |
| `attemptsRemaining` | `number` | Default 1 |
| `status` | `"approved" | "consumed" | "expired" | "revoked"` | Unlock lifecycle |

Indexes: `by_user_major`, `by_status`

#### `diagnosticAttempts`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"diagnosticAttempts">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `domainId` | `Id<"domains">` | Domain |
| `majorObjectiveId` | `Id<"majorObjectives">` | Major objective |
| `studentMajorObjectiveId` | `Id<"studentMajorObjectives">?` | Convenience link |
| `unlockId` | `Id<"diagnosticUnlocks">?` | Unlock used |
| `attemptType` | `"practice" | "mastery"` | UX intent |
| `diagnosticModuleName` | `string` | E.g. `"Module 1: Whole Number Foundations"` |
| `diagnosticModuleIds` | `string[]` | Source module IDs (e.g. `["1.1","1.2"]`) |
| `questionCount` | `number` | Attempt length |
| `score` | `number` | Correct count |
| `passed` | `boolean` | Pass = 100% |
| `startedAt` | `number` | Unix ms timestamp |
| `submittedAt` | `number` | Unix ms timestamp |
| `durationMs` | `number` | Soft-timer duration |
| `results` | `object[]` | Per-question answer + misconception |

Indexes: `by_user_major`, `by_passed`, `by_major_passed`

### Reading

#### `books`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"books">` | Primary key |
| `title` | `string` | Book title |
| `author` | `string` | Author name |
| `coverImageUrl` | `string?` | Optional cover URL |
| `readingUrl` | `string?` | Optional reading link |
| `description` | `string?` | Optional description |
| `gradeLevel` | `string?` | Optional grade level |
| `genre` | `string?` | Optional genre |
| `pageCount` | `number?` | Optional page count |
| `isPrePopulated` | `boolean` | Seeded or admin-created |
| `addedBy` | `Id<"users">?` | Admin who added |
| `createdAt` | `number` | Unix ms timestamp |

Indexes: `by_grade`, `by_genre`

#### `studentBooks`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"studentBooks">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `bookId` | `Id<"books">` | Book |
| `status` | `"reading" | "completed" | "presentation_requested" | "presented"` | `completed` is legacy |
| `startedAt` | `number` | Unix ms timestamp |
| `completedAt` | `number?` | Legacy timestamp |
| `presentationRequestedAt` | `number?` | Optional timestamp |
| `presentedAt` | `number?` | Optional timestamp |
| `rating` | `number?` | Optional rating |
| `review` | `string?` | Optional review |

Indexes: `by_user`, `by_book`, `by_user_book`, `by_status`

### Trust jar

#### `trustJar`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"trustJar">` | Primary key |
| `count` | `number` | Current marbles (0-50) |
| `timesCompleted` | `number` | Number of full resets |
| `updatedAt` | `number` | Unix ms timestamp |
| `updatedBy` | `Id<"users">?` | Admin who updated |

### Projects

#### `projects`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"projects">` | Primary key |
| `name` | `string` | Project name |
| `description` | `string?` | Optional description |
| `startDate` | `string` | ISO date string |
| `endDate` | `string` | ISO date string |
| `isActive` | `boolean` | Only one should be active |
| `cycleNumber` | `number` | Ordering (1,2,3...) |
| `createdBy` | `Id<"users">` | Admin |
| `createdAt` | `number` | Unix ms timestamp |

Indexes: `by_active`, `by_cycle`

#### `projectLinks`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"projectLinks">` | Primary key |
| `projectId` | `Id<"projects">` | Project |
| `userId` | `Id<"users">` | Student |
| `url` | `string` | Link URL |
| `title` | `string` | Link title |
| `linkType` | `"presentation" | "document" | "video" | "other"` | Link type |
| `addedAt` | `number` | Unix ms timestamp |

Indexes: `by_project`, `by_project_user`

#### `projectReflections`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"projectReflections">` | Primary key |
| `projectId` | `Id<"projects">` | Project |
| `userId` | `Id<"users">` | Student |
| `didWell` | `string?` | Reflection Q1 |
| `projectDescription` | `string?` | Reflection Q2 |
| `couldImprove` | `string?` | Reflection Q3 |
| `isComplete` | `boolean` | All questions answered |
| `updatedAt` | `number` | Unix ms timestamp |

Indexes: `by_project`, `by_project_user`

### Vision Board

#### `visionBoardAreas`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"visionBoardAreas">` | Primary key |
| `userId` | `Id<"users">` | Owner |
| `name` | `string` | Area name |
| `emoji` | `string` | Phosphor icon name |
| `isPreset` | `boolean` | True for auto-seeded areas |

Indexes: `by_user`

#### `visionBoardCards`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"visionBoardCards">` | Primary key |
| `userId` | `Id<"users">` | Owner |
| `areaId` | `Id<"visionBoardAreas">` | Parent area |
| `cardType` | `"image_hero" | "counter" | "progress" | "streak" | "habits" | "mini_tile" | "motivation" | "journal"` | Card type |
| `title` | `string` | Card title |
| `subtitle` | `string?` | Optional subtitle |
| `emoji` | `string?` | Optional emoji |
| `colorVariant` | `"green" | "blue" | "pink" | "purple" | "orange" | "yellow"` | Color theme |
| `size` | `"sm" | "md" | "lg" | "tall" | "wide" | "hero"` | Grid size |
| `order` | `number` | Sort order |
| `createdAt` | `number` | Unix ms timestamp |
| ... | ... | Type-specific optional fields (imageUrl, currentCount, targetCount, habits, quote, etc.) |

Indexes: `by_user`, `by_user_area`

### AI Logs

#### `chatLogs`
| Field | Type | Notes |
| --- | --- | --- |
| `_id` | `Id<"chatLogs">` | Primary key |
| `type` | `string` | Log type identifier |
| `data` | `any` | Log payload |
| `timestamp` | `number` | Unix ms timestamp |

Indexes: `by_timestamp`

## Relationship overview (ASCII)

```
users ──< sessions
  |
  +──< emotionCheckIns >── emotionCategories ──< emotionSubcategories
  |
  +──< goals ──< actionItems
  |
  +──< habits ──< habitCompletions
  |
  +──< studentObjectives >── learningObjectives ──< activities
  |         |                     |
  |         +──< activityProgress +
  |
  +──< studentMajorObjectives >── majorObjectives ──< learningObjectives
  |                                      |
  |                                      +── domains
  |
  +──< studentBooks >── books
  |
  +──< projectLinks >── projects
  +──< projectReflections >── projects

trustJar (per-batch singleton, indexed by "batch")
```

Why this model:
- Major objectives model long-term mastery. Sub objectives (learning objectives) are the actionable units.
- `studentMajorObjectives` is the authoritative source for viva and mastery status; `studentObjectives.status` keeps legacy values for existing data.
- Reading uses `studentBooks` as the join table to support status transitions and reviews.
- Projects separate links and reflections to allow incremental data entry and AI-assisted extraction.

## Convex function reference

For the complete function inventory (all queries, mutations, and actions), see [CODEMAPS/backend.md](./CODEMAPS/backend.md).

## Data flow examples

For data flow diagrams (check-in gate, activity completion, diagnostic auto-mastery, etc.), see [CODEMAPS/backend.md](./CODEMAPS/backend.md#data-flow-patterns).

## Model gotchas

- `studentObjectives.status` includes `mastered` and `viva_requested` for legacy data. New status changes flow through `studentMajorObjectives`.
- `studentBooks.status` still accepts `completed` and is treated as pending presentation in stats and queues.
- `convex/seed.ts` relies on `emotionCategories` existing to prevent double-seeding; removing categories requires reseeding.
