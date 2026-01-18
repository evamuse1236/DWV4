# Data Model & Contracts

## Database Overview

Deep Work Tracker uses **Convex** as its serverless database. The schema is defined in `convex/schema.ts` with 18 tables organized into logical groups.

## Database Schema

### Users & Auth

#### `users`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"users">` | Primary key |
| `username` | `string` | Login identifier |
| `passwordHash` | `string` | Hashed password |
| `role` | `"student" \| "admin"` | User role |
| `displayName` | `string` | Display name |
| `avatarUrl` | `string?` | Profile image URL |
| `batch` | `string?` | Class grouping ("2156", "2153") |
| `createdAt` | `number` | Unix timestamp |
| `lastLoginAt` | `number?` | Last login timestamp |

**Indexes:** `by_username`, `by_role`, `by_batch`

#### `sessions`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"sessions">` | Primary key |
| `userId` | `Id<"users">` | Foreign key |
| `token` | `string` | Session token (stored in localStorage) |
| `expiresAt` | `number` | Expiration timestamp (7 days) |

**Indexes:** `by_token`, `by_user`

---

### Emotional Check-ins

#### `emotionCategories`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"emotionCategories">` | Primary key |
| `name` | `string` | Category name ("Happy", "Sad", etc.) |
| `emoji` | `string` | Display emoji |
| `color` | `string` | CSS color |
| `order` | `number` | Display order |

#### `emotionSubcategories`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"emotionSubcategories">` | Primary key |
| `categoryId` | `Id<"emotionCategories">` | Parent category |
| `name` | `string` | Subcategory name |
| `emoji` | `string` | Display emoji |
| `order` | `number` | Display order |

**Indexes:** `by_category`

#### `emotionCheckIns`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"emotionCheckIns">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `categoryId` | `Id<"emotionCategories">` | Selected emotion |
| `subcategoryId` | `Id<"emotionSubcategories">` | Selected sub-emotion |
| `journalEntry` | `string?` | Optional reflection |
| `timestamp` | `number` | Check-in time |

**Indexes:** `by_user`, `by_user_date`

---

### Sprints & Goals

#### `sprints`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"sprints">` | Primary key |
| `name` | `string` | Sprint name |
| `startDate` | `string` | ISO date string |
| `endDate` | `string` | ISO date string |
| `isActive` | `boolean` | Currently active sprint |
| `createdBy` | `Id<"users">` | Admin who created |

**Indexes:** `by_active`, `by_dates`

#### `goals`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"goals">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `sprintId` | `Id<"sprints">` | Parent sprint |
| `title` | `string` | Goal title |
| `specific` | `string` | SMART: Specific |
| `measurable` | `string` | SMART: Measurable |
| `achievable` | `string` | SMART: Achievable |
| `relevant` | `string` | SMART: Relevant |
| `timeBound` | `string` | SMART: Time-bound |
| `status` | `"not_started" \| "in_progress" \| "completed"` | Progress state |
| `createdAt` | `number` | Creation timestamp |
| `updatedAt` | `number` | Last update |

**Indexes:** `by_user`, `by_sprint`, `by_user_sprint`

#### `actionItems`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"actionItems">` | Primary key |
| `goalId` | `Id<"goals">` | Parent goal |
| `userId` | `Id<"users">` | Student |
| `title` | `string` | Task title |
| `description` | `string?` | Details |
| `weekNumber` | `number` | Week in sprint |
| `dayOfWeek` | `number` | 0-6 (Sun-Sat) |
| `scheduledTime` | `string?` | Time slot |
| `isCompleted` | `boolean` | Done status |
| `completedAt` | `number?` | Completion time |
| `order` | `number` | Display order |

**Indexes:** `by_goal`, `by_user`, `by_user_day`

---

### Habits

#### `habits`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"habits">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `sprintId` | `Id<"sprints">` | Parent sprint |
| `name` | `string` | Habit name |
| `description` | `string?` | Details |
| `whatIsHabit` | `string` | Definition |
| `howToPractice` | `string` | Instructions |
| `cue` | `string?` | Trigger |
| `reward` | `string?` | Reward |
| `createdAt` | `number` | Creation time |

**Indexes:** `by_user`, `by_sprint`, `by_user_sprint`

#### `habitCompletions`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"habitCompletions">` | Primary key |
| `habitId` | `Id<"habits">` | Parent habit |
| `userId` | `Id<"users">` | Student |
| `date` | `string` | ISO date string |
| `completed` | `boolean` | Done for this day |

**Indexes:** `by_habit`, `by_habit_date`, `by_user_date`

---

### Deep Work Domains

#### `domains`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"domains">` | Primary key |
| `name` | `string` | Domain name ("Math", "Science") |
| `icon` | `string` | Icon identifier |
| `color` | `string` | CSS color |
| `description` | `string` | Domain description |
| `order` | `number` | Display order |

#### `majorObjectives`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"majorObjectives">` | Primary key |
| `domainId` | `Id<"domains">` | Parent domain |
| `title` | `string` | Objective title |
| `description` | `string` | Details |
| `difficulty` | `"beginner" \| "intermediate" \| "advanced"?` | Level |
| `estimatedHours` | `number?` | Time estimate |
| `createdBy` | `Id<"users">` | Admin who created |
| `createdAt` | `number` | Creation time |

**Indexes:** `by_domain`

#### `learningObjectives`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"learningObjectives">` | Primary key |
| `domainId` | `Id<"domains">` | Parent domain |
| `majorObjectiveId` | `Id<"majorObjectives">?` | Parent major objective |
| `title` | `string` | Objective title |
| `description` | `string` | Details |
| `difficulty` | `"beginner" \| "intermediate" \| "advanced"` | Level |
| `estimatedHours` | `number?` | Time estimate |
| `createdBy` | `Id<"users">` | Admin who created |
| `createdAt` | `number` | Creation time |

**Indexes:** `by_domain`, `by_major_objective`

#### `activities`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"activities">` | Primary key |
| `objectiveId` | `Id<"learningObjectives">` | Parent objective |
| `title` | `string` | Activity title |
| `type` | `"video" \| "exercise" \| "reading" \| "project" \| "game"` | Type |
| `url` | `string` | Link to resource |
| `platform` | `string?` | Platform name |
| `estimatedMinutes` | `number?` | Time estimate |
| `order` | `number` | Display order |
| `instructions` | `string?` | How-to notes |

**Indexes:** `by_objective`

---

### Student Progress

#### `studentObjectives`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"studentObjectives">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `objectiveId` | `Id<"learningObjectives">` | Assigned objective |
| `majorObjectiveId` | `Id<"majorObjectives">?` | Parent major |
| `assignedBy` | `Id<"users">` | Admin who assigned |
| `assignedAt` | `number` | Assignment time |
| `status` | `"assigned" \| "in_progress" \| "completed" \| "mastered" \| "viva_requested"` | State |
| `vivaRequestedAt` | `number?` | Viva request time (legacy) |
| `masteredAt` | `number?` | Mastery time (legacy) |
| `adminNotes` | `string?` | Coach notes |

**Indexes:** `by_user`, `by_objective`, `by_user_objective`, `by_user_major`, `by_status`

#### `studentMajorObjectives`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"studentMajorObjectives">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `majorObjectiveId` | `Id<"majorObjectives">` | Major objective |
| `assignedBy` | `Id<"users">` | Admin who assigned |
| `assignedAt` | `number` | Assignment time |
| `status` | `"assigned" \| "in_progress" \| "viva_requested" \| "mastered"` | State |
| `vivaRequestedAt` | `number?` | Viva request time |
| `masteredAt` | `number?` | Mastery time |
| `adminNotes` | `string?` | Coach notes |

**Indexes:** `by_user`, `by_major_objective`, `by_user_major`, `by_status`

#### `activityProgress`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"activityProgress">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `activityId` | `Id<"activities">` | Activity |
| `studentObjectiveId` | `Id<"studentObjectives">` | Assignment |
| `completed` | `boolean` | Done status |
| `completedAt` | `number?` | Completion time |
| `timeSpentMinutes` | `number?` | Time spent |
| `notes` | `string?` | Student notes |

**Indexes:** `by_user`, `by_activity`, `by_student_objective`

---

### Reading Library

#### `books`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"books">` | Primary key |
| `title` | `string` | Book title |
| `author` | `string` | Author name |
| `coverImageUrl` | `string?` | Cover image |
| `readingUrl` | `string?` | Link to read |
| `description` | `string?` | Summary |
| `gradeLevel` | `string?` | Target grade |
| `genre` | `string?` | Genre category |
| `pageCount` | `number?` | Number of pages |
| `isPrePopulated` | `boolean` | Seed data flag |
| `addedBy` | `Id<"users">?` | Admin who added |
| `createdAt` | `number` | Creation time |

**Indexes:** `by_grade`, `by_genre`

#### `studentBooks`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"studentBooks">` | Primary key |
| `userId` | `Id<"users">` | Student |
| `bookId` | `Id<"books">` | Book |
| `status` | `"reading" \| "completed" \| "presentation_requested" \| "presented"` | State |
| `startedAt` | `number` | Start time |
| `completedAt` | `number?` | Completion time (legacy) |
| `presentationRequestedAt` | `number?` | Request time |
| `presentedAt` | `number?` | Presentation time |
| `rating` | `number?` | Student rating |
| `review` | `string?` | Student review |

**Indexes:** `by_user`, `by_book`, `by_user_book`, `by_status`

---

### Projects

#### `projects`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"projects">` | Primary key |
| `name` | `string` | Project name |
| `description` | `string?` | Details |
| `startDate` | `string` | ISO date |
| `endDate` | `string` | ISO date |
| `isActive` | `boolean` | Currently active |
| `cycleNumber` | `number` | Ordering (1, 2, 3...) |
| `createdBy` | `Id<"users">` | Admin who created |
| `createdAt` | `number` | Creation time |

**Indexes:** `by_active`, `by_cycle`

#### `projectLinks`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"projectLinks">` | Primary key |
| `projectId` | `Id<"projects">` | Parent project |
| `userId` | `Id<"users">` | Student |
| `url` | `string` | Link URL |
| `title` | `string` | Link title |
| `linkType` | `"presentation" \| "document" \| "video" \| "other"` | Type |
| `addedAt` | `number` | Submission time |

**Indexes:** `by_project`, `by_project_user`

#### `projectReflections`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"projectReflections">` | Primary key |
| `projectId` | `Id<"projects">` | Parent project |
| `userId` | `Id<"users">` | Student |
| `didWell` | `string?` | Q1 response |
| `projectDescription` | `string?` | Q2 response |
| `couldImprove` | `string?` | Q3 response |
| `isComplete` | `boolean` | All questions answered |
| `updatedAt` | `number` | Last update |

**Indexes:** `by_project`, `by_project_user`

---

### Trust Jar

#### `trustJar`
| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<"trustJar">` | Primary key |
| `count` | `number` | Current marbles (0-50) |
| `timesCompleted` | `number` | Times filled |
| `updatedAt` | `number` | Last update |
| `updatedBy` | `Id<"users">?` | Who updated |

---

## Entity Relationship Diagram

```
┌──────────┐     ┌─────────────┐     ┌───────────────┐
│  users   │────<│  sessions   │     │emotionCheckIns│
│          │     └─────────────┘     └───────────────┘
│          │                                │
│          │────<┌─────────────────┐       │
│          │     │ emotionCategories│───────┘
│          │     └─────────────────┘
│          │            │
│          │     ┌──────▼───────────┐
│          │     │emotionSubcategories│
│          │     └───────────────────┘
│          │
│          │────<┌──────────┐
│          │     │  goals   │────<┌─────────────┐
│          │     └──────────┘     │ actionItems │
│          │          │           └─────────────┘
│          │     ┌────▼────┐
│          │────<│ sprints │
│          │     └─────────┘
│          │          │
│          │     ┌────▼────┐     ┌──────────────────┐
│          │────<│ habits  │────<│habitCompletions  │
│          │     └─────────┘     └──────────────────┘
│          │
│          │     ┌─────────┐     ┌─────────────────┐
│          │     │ domains │────<│majorObjectives  │
│          │     └─────────┘     └─────────────────┘
│          │                            │
│          │                     ┌──────▼───────────┐
│          │                     │learningObjectives│
│          │                     └─────────────────┘
│          │                            │
│          │                     ┌──────▼──────┐
│          │                     │ activities  │
│          │                     └─────────────┘
│          │
│          │────<┌──────────────────┐     ┌─────────────────┐
│          │     │studentObjectives │────<│activityProgress │
│          │     └──────────────────┘     └─────────────────┘
│          │
│          │────<┌──────────────────────┐
│          │     │studentMajorObjectives│
│          │     └──────────────────────┘
│          │
│          │     ┌──────────┐     ┌──────────────┐
│          │────<│ books    │────<│ studentBooks │
│          │     └──────────┘     └──────────────┘
│          │
│          │     ┌──────────┐     ┌──────────────┐
│          │     │ projects │────<│ projectLinks │
│          │     └──────────┘     └──────────────┘
│          │          │           ┌────────────────────┐
│          │          └──────────<│projectReflections  │
│          │                      └────────────────────┘
│          │
│          │────>┌──────────┐
└──────────┘     │ trustJar │
                 └──────────┘
```

---

## TypeScript Types

All types are defined in `src/types/index.ts`. Key patterns:

```typescript
// ID type pattern (branded string)
type Id<T extends string> = string & { __tableName: T };

// Role union
type UserRole = "student" | "admin";

// Status unions
type GoalStatus = "not_started" | "in_progress" | "completed";
type ObjectiveStatus = "assigned" | "in_progress" | "viva_requested" | "mastered";
type SubObjectiveStatus = "assigned" | "in_progress" | "completed";
type BookStatus = "reading" | "completed" | "presented";
type Difficulty = "beginner" | "intermediate" | "advanced";
type ActivityType = "video" | "exercise" | "reading" | "project" | "game";
```

---

## API Contracts

### Auth (`convex/auth.ts`)

| Function | Type | Input | Output | Description |
|----------|------|-------|--------|-------------|
| `login` | mutation | `{ username, password }` | `{ success, token?, error? }` | Authenticate user |
| `logout` | mutation | `{ token }` | `void` | Invalidate session |
| `getCurrentUser` | query | `{ token }` | `User \| null` | Get user from token |
| `needsBootstrap` | query | `{}` | `boolean` | Check if setup needed |
| `bootstrapAdmin` | mutation | `{ username, password, displayName }` | `{ success }` | Create first admin |

### Users (`convex/users.ts`)

| Function | Type | Input | Output | Description |
|----------|------|-------|--------|-------------|
| `list` | query | `{ role? }` | `User[]` | List users by role |
| `get` | query | `{ userId }` | `User \| null` | Get single user |
| `create` | mutation | `{ username, password, role, displayName, batch? }` | `Id<"users">` | Create user |
| `update` | mutation | `{ userId, ...fields }` | `void` | Update user |
| `delete` | mutation | `{ userId }` | `void` | Delete user |

### Objectives (`convex/objectives.ts`)

| Function | Type | Input | Output | Description |
|----------|------|-------|--------|-------------|
| `listByDomain` | query | `{ domainId }` | `LearningObjective[]` | Get domain objectives |
| `assignToStudent` | mutation | `{ objectiveId, userId, assignedBy }` | `Id<"studentObjectives">` | Assign objective |
| `updateStatus` | mutation | `{ studentObjectiveId, status }` | `void` | Update progress |
| `requestViva` | mutation | `{ studentMajorObjectiveId }` | `void` | Request viva |
| `approveViva` | mutation | `{ studentMajorObjectiveId, notes? }` | `void` | Approve mastery |

### Emotions (`convex/emotions.ts`)

| Function | Type | Input | Output | Description |
|----------|------|-------|--------|-------------|
| `getCategories` | query | `{}` | `EmotionCategory[]` | List emotion options |
| `getSubcategories` | query | `{ categoryId }` | `EmotionSubcategory[]` | Get sub-options |
| `checkIn` | mutation | `{ userId, categoryId, subcategoryId, journalEntry? }` | `Id<"emotionCheckIns">` | Save check-in |
| `getTodayCheckIn` | query | `{ userId }` | `EmotionCheckIn \| null` | Today's check-in |

---

## Data Flow Examples

### Student Check-in Flow

```
Student                 Frontend              Convex                Database
   │                       │                    │                      │
   │──[opens app]─────────▶│                    │                      │
   │                       │──[getTodayCheckIn]─▶│                      │
   │                       │                    │──[SELECT]───────────▶│
   │                       │                    │◀─[null]──────────────│
   │                       │◀─[no check-in]─────│                      │
   │◀─[show gate]──────────│                    │                      │
   │                       │                    │                      │
   │──[select emotion]────▶│                    │                      │
   │──[add journal]───────▶│                    │                      │
   │──[submit]────────────▶│                    │                      │
   │                       │──[checkIn]────────▶│                      │
   │                       │                    │──[INSERT]───────────▶│
   │                       │                    │◀─[checkInId]─────────│
   │                       │◀─[success]─────────│                      │
   │◀─[show dashboard]─────│                    │                      │
```

### Viva Request Flow

```
Student                 Frontend              Convex                Database
   │                       │                    │                      │
   │──[request viva]──────▶│                    │                      │
   │                       │──[requestViva]────▶│                      │
   │                       │                    │──[UPDATE status]────▶│
   │                       │                    │◀─[ok]────────────────│
   │                       │◀─[success]─────────│                      │
   │◀─[show pending]───────│                    │                      │
   │                       │                    │                      │
   │                       │                    │                      │
Admin                      │                    │                      │
   │──[view queue]────────▶│                    │                      │
   │                       │──[getVivaQueue]───▶│                      │
   │                       │                    │──[SELECT]───────────▶│
   │                       │◀─[requests]────────│                      │
   │◀─[show list]──────────│                    │                      │
   │                       │                    │                      │
   │──[approve + notes]───▶│                    │                      │
   │                       │──[approveViva]────▶│                      │
   │                       │                    │──[UPDATE mastered]──▶│
   │                       │◀─[success]─────────│                      │
   │◀─[removed from queue]─│                    │                      │
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| `username` | Required, unique, used for login |
| `passwordHash` | Never stored as plain text |
| `role` | Must be "student" or "admin" |
| `status` fields | Must be valid enum value |
| `timestamp` / `createdAt` | Unix milliseconds |
| `date` fields | ISO date string format |
| `order` fields | Used for display sorting |
