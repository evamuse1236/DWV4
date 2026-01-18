# Data Model and Contracts

## Source of truth
- Schema: `convex/schema.ts` defines 23 tables and indexes.
- Generated types: `convex/_generated/dataModel.d.ts` should be used when available.
- Frontend types in `src/types/index.ts` are temporary and do not cover all fields.

## Table inventory (23 total)

| Area | Tables | Purpose |
| --- | --- | --- |
| Auth | `users`, `sessions` | Credentials, role, and session tokens |
| Emotions | `emotionCategories`, `emotionSubcategories`, `emotionCheckIns` | Daily mood check-ins |
| Sprints | `sprints` | Active sprint lifecycle |
| Goals | `goals`, `actionItems` | SMART goals and daily tasks |
| Habits | `habits`, `habitCompletions` | Habit routines and completion tracking |
| Deep work | `domains`, `majorObjectives`, `learningObjectives`, `activities` | Skills, objectives, and activities |
| Assignments | `studentObjectives`, `studentMajorObjectives`, `activityProgress` | Student progress through objectives |
| Reading | `books`, `studentBooks` | Library and reading progress |
| Projects | `projects`, `projectLinks`, `projectReflections` | 6-week projects and submissions |
| Trust jar | `trustJar` | Shared reward state |

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

trustJar (single-row global state)
```

Why this model:
- Major objectives model long-term mastery. Sub objectives (learning objectives) are the actionable units.
- `studentMajorObjectives` is the authoritative source for viva and mastery status; `studentObjectives.status` keeps legacy values for existing data.
- Reading uses `studentBooks` as the join table to support status transitions and reviews.
- Projects separate links and reflections to allow incremental data entry and AI-assisted extraction.

## Convex contracts (queries, mutations, actions)

### `convex/auth.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `checkNeedsBootstrap` | query | Returns true if no users exist |
| `login` | mutation | Authenticate and create session token |
| `logout` | mutation | Remove session by token |
| `getCurrentUser` | query | Resolve user from token |
| `createUser` | mutation | Admin-only user creation |
| `initializeAdmin` | mutation | First admin bootstrapping |
| `initializeStudent` | mutation | First student bootstrapping |
| `cleanupExpiredSessions` | mutation | Delete expired sessions |

### `convex/users.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getAll` | query | All students |
| `getById` | query | User by id |
| `getStudentCount` | query | Count students |
| `getAllUsers` | query | All users (debug) |
| `getTodayCheckInCount` | query | Check-in count for today |
| `getByBatch` | query | Students by batch |
| `updateBatch` | mutation | Update student batch |
| `getBatches` | query | Unique batch list |
| `remove` | mutation | Remove student and related data |

### `convex/emotions.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getCategories` | query | Categories with subcategories |
| `saveCheckIn` | mutation | Insert a new check-in |
| `updateCheckIn` | mutation | Patch an existing check-in |
| `getTodayCheckIn` | query | Today check-in for user |
| `getHistory` | query | Recent check-ins |
| `getStats` | query | Streak and counts |
| `getTodayCheckIns` | query | Admin view of all today check-ins |
| `deleteTodayCheckIn` | mutation | Remove today check-in (dev/testing) |

### `convex/sprints.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getActive` | query | Active sprint |
| `getAll` | query | All sprints sorted by start date |
| `create` | mutation | Create sprint and deactivate current |
| `update` | mutation | Patch sprint fields |
| `setActive` | mutation | Switch active sprint |
| `remove` | mutation | Delete sprint |

### `convex/goals.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getByUserAndSprint` | query | Goals + action items for sprint |
| `getWithActions` | query | Goal with actions |
| `create` | mutation | Create goal |
| `update` | mutation | Patch goal |
| `remove` | mutation | Delete goal and actions |
| `addActionItem` | mutation | Insert action item |
| `toggleActionItem` | mutation | Toggle completion |
| `updateActionItem` | mutation | Patch action item |
| `removeActionItem` | mutation | Delete action item |
| `getActionItemsByDay` | query | Action items for a day |
| `getPreviousSprintGoals` | query | Import candidates |
| `duplicate` | mutation | Duplicate goal (optionally with actions) |
| `importGoal` | mutation | Import goal into target sprint |

### `convex/habits.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getByUserAndSprint` | query | Habits + completions |
| `getWithCompletions` | query | Single habit + completions |
| `create` | mutation | Create habit |
| `update` | mutation | Patch habit |
| `remove` | mutation | Delete habit and completions |
| `toggleCompletion` | mutation | Toggle completion by date |
| `getCompletionsInRange` | query | Completions by range |
| `getStreak` | query | Completion streak |

### `convex/domains.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getAll` | query | All domains |
| `getById` | query | Domain by id |

### `convex/objectives.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getAll` | query | All major objectives with counts |
| `getByDomain` | query | Majors with subs for a domain |
| `getAllSubObjectives` | query | All subs with domain/major info |
| `create` | mutation | Create major objective |
| `update` | mutation | Patch major objective |
| `remove` | mutation | Delete major objective + related data |
| `createSubObjective` | mutation | Create sub objective |
| `updateSubObjective` | mutation | Patch sub objective |
| `removeSubObjective` | mutation | Delete sub objective + related data |
| `assignToStudent` | mutation | Assign sub objective to a student |
| `assignToMultipleStudents` | mutation | Batch assign sub objectives |
| `unassignFromStudent` | mutation | Remove assignment and progress |
| `getAssignedStudents` | query | Students for a sub objective |
| `updateStatus` | mutation | Update major objective status |
| `getVivaRequests` | query | Viva queue |
| `getAssignedToStudent` | query | Student objectives (grouped) |
| `getAssignedByDomain` | query | Student objectives by domain |
| `getTreeData` | query | Skill tree data |
| `migrateObjectivesToMajorSub` | mutation | Legacy migration |

### `convex/activities.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getByObjective` | query | Activities for sub objective |
| `create` | mutation | Create activity |
| `update` | mutation | Patch activity |
| `remove` | mutation | Delete activity |

### `convex/progress.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getByStudentObjective` | query | Activity progress for sub objective |
| `toggleActivity` | mutation | Toggle completion and update statuses |
| `getDomainSummary` | query | Domain progress summary |

### `convex/books.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getAll` | query | All books |
| `getByGenre` | query | Books by genre |
| `getStudentBooks` | query | Student book list with details |
| `getReadingHistory` | query | AI context for Book Buddy |
| `getCurrentlyReading` | query | Current reading book |
| `startReading` | mutation | Add book to student list |
| `updateStatus` | mutation | Update reading status |
| `addReview` | mutation | Add rating/review |
| `create` | mutation | Create book |
| `update` | mutation | Patch book |
| `remove` | mutation | Delete book and student links |
| `removeFromMyBooks` | mutation | Remove studentBook entry |
| `getReadingStats` | query | Reading stats summary |
| `getPresentationRequests` | query | Presentation queue |
| `approvePresentationRequest` | mutation | Approve/reject presentation |

### `convex/projects.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getAll` | query | All projects (desc cycle) |
| `getActive` | query | Active project |
| `getById` | query | Project by id |
| `getWithStats` | query | Project with completion stats |
| `create` | mutation | Create project and deactivate current |
| `update` | mutation | Patch project |
| `setActive` | mutation | Set active project |
| `remove` | mutation | Delete project and related data |
| `getNextCycleNumber` | query | Next cycle index |

### `convex/projectLinks.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getByProject` | query | Links for project |
| `getByProjectAndUser` | query | Links for student in project |
| `add` | mutation | Add a link |
| `addMany` | mutation | Batch add links |
| `update` | mutation | Patch link |
| `remove` | mutation | Delete link |
| `removeAllForUser` | mutation | Delete all links for student |

### `convex/projectReflections.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `getByProject` | query | Reflections for project |
| `getByProjectAndUser` | query | Reflection for student |
| `getOrCreate` | mutation | Get or insert empty reflection |
| `update` | mutation | Update reflection + completion flag |
| `batchUpdate` | mutation | Batch update reflections |
| `remove` | mutation | Delete reflection |
| `getProjectStats` | query | Reflection completion stats |

### `convex/trustJar.ts`
| Function | Type | Purpose |
| --- | --- | --- |
| `get` | query | Current jar count |
| `add` | mutation | Add marble (admin) |
| `remove` | mutation | Remove marble (admin) |
| `reset` | mutation | Reset jar (admin) |

### `convex/ai.ts` (actions)
| Function | Type | Purpose |
| --- | --- | --- |
| `chat` | action | Goal chat (SMART + tasks) |
| `libraryChat` | action | Book Buddy recommendations |
| `projectDataChat` | action | Extract project links/reflections |

## Data flow examples

### Daily check-in gate

```
Student UI -> api.emotions.getTodayCheckIn
  if null: show CheckInGate
    -> api.emotions.saveCheckIn
    -> emotionCheckIns insert
```

### Activity completion and status propagation

```
Student UI -> api.progress.toggleActivity
  -> activityProgress insert/update
  -> studentObjectives.status recalculated
  -> studentMajorObjectives.status recalculated (if needed)
```

### Reading presentation queue

```
Student UI -> api.books.updateStatus (presentation_requested)
Admin UI   -> api.books.getPresentationRequests
Admin UI   -> api.books.approvePresentationRequest (presented or reset to reading)
```

### Trust jar

```
Admin UI -> api.trustJar.add/remove/reset (adminToken)
Student UI -> api.trustJar.get (public read)
```

## Model gotchas

- `studentObjectives.status` includes `mastered` and `viva_requested` for legacy data. New status changes flow through `studentMajorObjectives`.
- `studentBooks.status` still accepts `completed` and is treated as pending presentation in stats and queues.
- `convex/seed.ts` relies on `emotionCategories` existing to prevent double-seeding; removing categories requires reseeding.
