# Backend Codemap

**Last Updated:** 2026-01-29
**Runtime:** Convex (serverless functions)
**Schema:** `convex/schema.ts` (26 tables)

## Directory Structure

```
convex/
  schema.ts               # All 26 tables + indexes
  _generated/             # Auto-generated types and API (do not edit)
    api.js / api.d.ts     # Generated API object
    server.js / server.d.ts
    dataModel.d.ts

  # --- Domain function files ---
  auth.ts                 # Login, logout, sessions, user creation, bootstrap
  users.ts                # Student queries, batch management
  emotions.ts             # Emotion check-ins (categories, subcategories, history)
  sprints.ts              # Sprint lifecycle (create, activate, update)
  goals.ts                # SMART goals + action items
  habits.ts               # Habits + daily completions
  domains.ts              # Learning domains (read-only queries)
  objectives.ts           # Major/sub objectives, assignments, viva queue, skill tree
  activities.ts           # CRUD for activities on sub-objectives
  progress.ts             # Activity completion + status propagation
  books.ts                # Reading library + presentation queue
  projects.ts             # 6-week project cycles
  projectLinks.ts         # Student project link submissions
  projectReflections.ts   # Student project reflections (3 questions)
  trustJar.ts             # Trust jar state (per batch)
  visionBoard.ts          # Vision board areas + cards + interactions
  diagnostics.ts          # Diagnostic unlock/attempt/mastery flow
  chatLogs.ts             # AI chat logging (dev)
  migrations.ts           # One-time data migrations
  ai.ts                   # AI actions (goal chat, book buddy, project data)
  seed.ts                 # Data seeding (emotions, domains, MYP/PYP curricula, Brilliant activities)
  utils.ts                # Shared backend utilities
```

## Function Inventory

### `auth.ts` -- Authentication
| Function | Type | Purpose |
|----------|------|---------|
| `checkNeedsBootstrap` | query | True if no users exist |
| `login` | mutation | Authenticate, create session |
| `logout` | mutation | Remove session |
| `getCurrentUser` | query | Resolve user from token |
| `createUser` | mutation | Admin-only user creation |
| `initializeAdmin` | mutation | First admin bootstrap |
| `initializeStudent` | mutation | First student bootstrap |
| `cleanupExpiredSessions` | mutation | Delete expired sessions |

### `users.ts` -- User Management
| Function | Type | Purpose |
|----------|------|---------|
| `getAll` | query | All students |
| `getById` | query | User by ID |
| `getStudentCount` | query | Student count |
| `getAllUsers` | query | All users (debug) |
| `getTodayCheckInCount` | query | Today's check-in count |
| `getByBatch` | query | Students by batch |
| `updateBatch` | mutation | Update student batch |
| `getBatches` | query | Unique batch list |
| `remove` | mutation | Remove student + related data |

### `emotions.ts` -- Emotional Check-ins
| Function | Type | Purpose |
|----------|------|---------|
| `getCategories` | query | Categories + subcategories |
| `saveCheckIn` | mutation | Insert check-in |
| `updateCheckIn` | mutation | Patch existing check-in |
| `getTodayCheckIn` | query | Today's check-in for user |
| `getHistory` | query | Recent check-ins |
| `getStats` | query | Streak + counts |
| `getTodayCheckIns` | query | Admin: all today's check-ins |
| `deleteTodayCheckIn` | mutation | Remove today's check-in (dev) |

### `sprints.ts` -- Sprint Lifecycle
| Function | Type | Purpose |
|----------|------|---------|
| `getActive` | query | Active sprint |
| `getAll` | query | All sprints (sorted) |
| `create` | mutation | Create + deactivate current |
| `update` | mutation | Patch sprint |
| `setActive` | mutation | Switch active sprint |
| `remove` | mutation | Delete sprint |

### `goals.ts` -- Goals + Action Items
| Function | Type | Purpose |
|----------|------|---------|
| `getByUserAndSprint` | query | Goals + actions for sprint |
| `getWithActions` | query | Single goal + actions |
| `create` | mutation | Create goal |
| `update` | mutation | Patch goal |
| `remove` | mutation | Delete goal + actions |
| `addActionItem` | mutation | Insert action item |
| `toggleActionItem` | mutation | Toggle completion |
| `updateActionItem` | mutation | Patch action item |
| `removeActionItem` | mutation | Delete action item |
| `getActionItemsByDay` | query | Actions for a day |
| `getPreviousSprintGoals` | query | Import candidates |
| `duplicate` | mutation | Duplicate goal |
| `importGoal` | mutation | Import into sprint |

### `habits.ts` -- Habit Tracking
| Function | Type | Purpose |
|----------|------|---------|
| `getByUserAndSprint` | query | Habits + completions |
| `getWithCompletions` | query | Single habit + completions |
| `create` | mutation | Create habit |
| `update` | mutation | Patch habit |
| `remove` | mutation | Delete habit + completions |
| `toggleCompletion` | mutation | Toggle by date |
| `getCompletionsInRange` | query | Range query |
| `getStreak` | query | Streak calculation |

### `domains.ts` -- Learning Domains
| Function | Type | Purpose |
|----------|------|---------|
| `getAll` | query | All domains |
| `getById` | query | Domain by ID |

### `objectives.ts` -- Objectives + Assignments
| Function | Type | Purpose |
|----------|------|---------|
| `getAll` | query | All majors with counts |
| `getByDomain` | query | Majors + subs for domain |
| `getAllSubObjectives` | query | All subs with context |
| `create` | mutation | Create major |
| `update` | mutation | Patch major |
| `remove` | mutation | Delete major + cascade |
| `createSubObjective` | mutation | Create sub |
| `updateSubObjective` | mutation | Patch sub |
| `removeSubObjective` | mutation | Delete sub + cascade |
| `assignToStudent` | mutation | Assign sub to student |
| `assignToMultipleStudents` | mutation | Batch assign |
| `unassignFromStudent` | mutation | Remove assignment |
| `getAssignedStudents` | query | Students for sub |
| `updateStatus` | mutation | Update major status |
| `getVivaRequests` | query | Viva queue |
| `getAssignedToStudent` | query | Student objectives (grouped) |
| `getAssignedByDomain` | query | Student objectives by domain |
| `getTreeData` | query | Skill tree data |

### `activities.ts` -- Activity CRUD
| Function | Type | Purpose |
|----------|------|---------|
| `getByObjective` | query | Activities for sub |
| `create` | mutation | Create activity |
| `update` | mutation | Patch activity |
| `remove` | mutation | Delete activity |

### `progress.ts` -- Activity Completion
| Function | Type | Purpose |
|----------|------|---------|
| `getByStudentObjective` | query | Progress for sub |
| `toggleActivity` | mutation | Toggle + status propagation |
| `getDomainSummary` | query | Domain progress summary |

### `books.ts` -- Reading Library
| Function | Type | Purpose |
|----------|------|---------|
| `getAll` | query | All books |
| `getByGenre` | query | Books by genre |
| `getStudentBooks` | query | Student book list |
| `getReadingHistory` | query | AI context |
| `getCurrentlyReading` | query | Current book |
| `startReading` | mutation | Add to list |
| `updateStatus` | mutation | Update status |
| `addReview` | mutation | Add rating/review |
| `create` | mutation | Create book |
| `update` | mutation | Patch book |
| `remove` | mutation | Delete + cascade |
| `removeFromMyBooks` | mutation | Remove studentBook |
| `getReadingStats` | query | Reading stats |
| `getPresentationRequests` | query | Presentation queue |
| `approvePresentationRequest` | mutation | Approve/reject |

### `projects.ts` -- Project Cycles
| Function | Type | Purpose |
|----------|------|---------|
| `getAll` | query | All projects |
| `getActive` | query | Active project |
| `getById` | query | Project by ID |
| `getWithStats` | query | Project + stats |
| `create` | mutation | Create + deactivate current |
| `update` | mutation | Patch project |
| `setActive` | mutation | Set active |
| `remove` | mutation | Delete + cascade |
| `getNextCycleNumber` | query | Next cycle index |

### `projectLinks.ts` -- Project Submissions
| Function | Type | Purpose |
|----------|------|---------|
| `getByProject` | query | Links for project |
| `getByProjectAndUser` | query | Links for student |
| `add` | mutation | Add link |
| `addMany` | mutation | Batch add |
| `update` | mutation | Patch link |
| `remove` | mutation | Delete link |
| `removeAllForUser` | mutation | Delete all for student |

### `projectReflections.ts` -- Project Reflections
| Function | Type | Purpose |
|----------|------|---------|
| `getByProject` | query | Reflections for project |
| `getByProjectAndUser` | query | Reflection for student |
| `getOrCreate` | mutation | Get or insert empty |
| `update` | mutation | Update + completion flag |
| `batchUpdate` | mutation | Batch update |
| `remove` | mutation | Delete reflection |
| `getProjectStats` | query | Completion stats |

### `trustJar.ts` -- Trust Jar
| Function | Type | Purpose |
|----------|------|---------|
| `get` | query | Current jar state |
| `add` | mutation | Add marble (admin) |
| `remove` | mutation | Remove marble (admin) |
| `reset` | mutation | Reset jar (admin) |

### `visionBoard.ts` -- Vision Board
See [vision-board.md](./vision-board.md) for full details.

### `diagnostics.ts` -- Diagnostic System
See [diagnostics.md](./diagnostics.md) for full details.

### `ai.ts` -- AI Actions
See [ai-system.md](./ai-system.md) for full details.

### `chatLogs.ts` -- Chat Logging
| Function | Type | Purpose |
|----------|------|---------|
| `log` | mutation | Store chat log entry |
| `getRecent` | query | Recent logs |
| `exportLogs` | action | Export as JSON string |
| `clearAll` | mutation | Delete all logs |

### `migrations.ts` -- Data Migrations
| Function | Type | Purpose |
|----------|------|---------|
| `migrateTrustJarToBatches` | mutation | Convert global jar to batch-specific |

### `seed.ts` -- Data Seeding (2841 lines)
Large file that seeds: emotion categories/subcategories, learning domains, MYP curriculum (major objectives + sub objectives + Khan Academy activities), PYP curriculum, and Brilliant.org activities.

## Data Flow Patterns

### Activity Completion -> Status Propagation
```
UI: toggleActivity(activityId)
  -> activityProgress updated
  -> studentObjectives.status recalculated (all activities complete? -> "completed")
  -> studentMajorObjectives.status recalculated (all subs complete? -> auto-update)
```

### Diagnostic Pass -> Auto-Mastery
```
UI: submitAttempt(...)
  -> diagnosticAttempts inserted
  -> if passed (100%):
     -> studentMajorObjectives.status = "mastered"
     -> all sub-objectives auto-completed
     -> all activities auto-completed
     -> unlock consumed
```

### Check-in Gate
```
Student navigates to any route
  -> DashboardLayout renders CheckInGate
  -> CheckInGate queries api.emotions.getTodayCheckIn
  -> null? Force /check-in page
  -> exists? Render child route
```
