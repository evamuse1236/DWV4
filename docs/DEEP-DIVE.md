# Deep Work Tracker — Complete Codebase Deep Dive

> Last updated: 2026-03-04
> This document is a comprehensive technical reference covering every subsystem, file, data flow, and behavioral contract in the application. Anyone reading this should be able to understand exactly how the entire webapp works without having seen it before.

---

## Table of Contents

1. [What is this app?](#1-what-is-this-app)
2. [Tech Stack](#2-tech-stack)
3. [Repository Layout](#3-repository-layout)
4. [Application Bootstrap & Entry Points](#4-application-bootstrap--entry-points)
5. [Authentication System](#5-authentication-system)
6. [Routing & Role Separation](#6-routing--role-separation)
7. [Database Schema (All Tables)](#7-database-schema-all-tables)
8. [Convex Backend Modules](#8-convex-backend-modules)
9. [Frontend: Student Experience](#9-frontend-student-experience)
10. [Frontend: Admin Experience](#10-frontend-admin-experience)
11. [Shared Layout & UI Systems](#11-shared-layout--ui-systems)
12. [The Daily Check-In Gate](#12-the-daily-check-in-gate)
13. [Sprint & Goal System](#13-sprint--goal-system)
14. [Deep Work & Learning Graph](#14-deep-work--learning-graph)
15. [Diagnostic Assessment System](#15-diagnostic-assessment-system)
16. [Reading & Book System](#16-reading--book-system)
17. [Character & XP System](#17-character--xp-system)
18. [AI Integration](#18-ai-integration)
19. [Vision Board System](#19-vision-board-system)
20. [Trust Jar System](#20-trust-jar-system)
21. [Projects System](#21-projects-system)
22. [Class Norms System](#22-class-norms-system)
23. [Student Comments System](#23-student-comments-system)
24. [Feature Flags](#24-feature-flags)
25. [Diagnostic V2 (Standalone HTML System)](#25-diagnostic-v2-standalone-html-system)
26. [Offline Scripts](#26-offline-scripts)
27. [Environments & Deployment](#27-environments--deployment)
28. [Data Invariants & Critical Contracts](#28-data-invariants--critical-contracts)
29. [File Index (Every Source File)](#29-file-index-every-source-file)

---

## 1. What is this app?

**Deep Work Tracker** is a private student learning platform designed for a small cohort of students (batches "2153" and "2156"). It has two entirely separate user experiences:

- **Student UX**: Calm, guided, artful. Students check in emotionally, work on assigned objectives, track goals and habits, read books, take diagnostic assessments, and build a personal vision board.
- **Admin/Coach UX**: Dense, operational. Coaches manage sprints, assign objectives, review viva requests, approve diagnostic retakes, track student progress, manage books, moderate comments, and use AI-assisted data entry.

Both surfaces share a single **Convex** backend and database.

### Core Product Loop
```
1. Student checks in emotionally (required gate before anything else)
2. Student works on assigned learning objectives and sprint tasks
3. Student requests mastery check (viva request → diagnostic assessment)
4. Coach reviews queues and advances mastery states
```

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React **19**.2.0 + TypeScript (Vite 7.x) |
| Routing | React Router **v7**.12.0 |
| Backend / DB | Convex 1.31.7 (realtime, serverless) |
| Styling | TailwindCSS **v4**.x |
| Animation | Framer Motion 12.x |
| Icons | Phosphor Icons (`@phosphor-icons/react`) |
| UI primitives (admin) | shadcn/ui components (Radix-based) |
| UI primitives (student) | Custom "Paper" component library |
| AI | Groq (primary), OpenRouter (fallback) |
| Hosting | Netlify (frontend) |
| Notifications | Sonner (toast) |
| Math rendering | **KaTeX** (`katex` ^0.16.28, via `MathText.tsx`) |
| Physics | Matter.js (trust jar marble animation) |
| Command palette | cmdk (admin Cmd+K student search) |
| Testing | Vitest + React Testing Library |

---

## 3. Repository Layout

```
C:/WProjects/DW/
├── src/                    # React frontend application
│   ├── App.tsx             # Root component, routing, providers
│   ├── main.tsx            # Vite entry point
│   ├── index.css           # Global styles, paper/pastel classes
│   ├── components/         # Reusable React components
│   │   ├── auth/           # Login form, ProtectedRoute, PublicOnlyRoute
│   │   ├── layout/         # DashboardLayout, AdminLayout, Header, Sidebar, CheckInGate
│   │   ├── paper/          # Student UI primitives (Button, Card, Input, Modal, etc.)
│   │   ├── ui/             # shadcn/ui primitives (admin UI)
│   │   ├── deepwork/       # DomainCard, LearningObjectiveCard
│   │   ├── emotions/       # EmotionWheel, EmotionCard, EmotionHistory, EmotionJournal
│   │   ├── sprint/         # GoalCard, GoalEditor, HabitTracker, GoalChatPalette
│   │   ├── skill-tree/     # SkillTreeCanvas, HorizontalTreeCanvas, SkillNode, etc.
│   │   ├── reading/        # BookBuddy (AI), BookCard
│   │   ├── projects/       # ProjectDataChat (AI), StudentProjectCard
│   │   ├── student/        # TaskAssigner
│   │   ├── trustjar/       # TrustJar, TrustJarStyles.css
│   │   ├── visionboard/    # Grid, Cards (8 types), CardCreator, CardDetail, AreaFilter
│   │   └── math/           # MathText (LaTeX renderer)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── SetupPage.tsx
│   │   ├── student/        # 12 student pages
│   │   └── admin/          # 14 admin pages
│   ├── hooks/
│   │   ├── useAuth.tsx     # AuthContext + AuthProvider + useSessionToken
│   │   ├── useVisionBoard.ts
│   │   ├── useDelayedLoading.ts
│   │   └── use-mobile.tsx
│   ├── lib/
│   │   ├── featureFlags.ts # STUDENT_CHARACTER_SYSTEM_ENABLED (currently false)
│   │   ├── diagnostic.ts   # Client-side diagnostic data loading
│   │   ├── utils.ts        # cn() helper
│   │   ├── emotions.ts     # Emotion category helpers
│   │   ├── character-utils.ts
│   │   ├── domain-utils.tsx
│   │   ├── skill-tree-utils.ts
│   │   ├── horizontal-tree-utils.ts
│   │   └── status-utils.ts
│   ├── data/
│   │   └── whatsNew.generated.ts   # Changelog data (auto-generated)
│   ├── styles/
│   │   ├── changelog.module.css
│   │   └── muse.module.css
│   └── types/
│       └── index.ts        # User, AuthContextType, etc.
├── convex/                 # Backend: Convex functions + schema
│   ├── schema.ts           # Single source of truth for all tables
│   ├── auth.ts             # Login, logout, session management, user CRUD
│   ├── users.ts            # Additional user queries
│   ├── emotions.ts         # Check-in CRUD, streak calculation
│   ├── sprints.ts          # Sprint CRUD, student insights
│   ├── goals.ts            # Goals, action items, import/duplicate
│   ├── habits.ts           # Habit CRUD, completion tracking
│   ├── domains.ts          # Domain CRUD
│   ├── objectives.ts       # Major + sub objective CRUD, assignment, viva
│   ├── activities.ts       # Activity CRUD within objectives
│   ├── progress.ts         # Activity completion, domain summary
│   ├── diagnostics.ts      # Unlock flow, attempt submission, pass/fail
│   ├── books.ts            # Book library, student reading state
│   ├── projects.ts         # Project CRUD
│   ├── projectLinks.ts     # Student project submission links
│   ├── projectReflections.ts # Student project reflection answers
│   ├── character.ts        # Character profile, tarot cards, badges
│   ├── characterAwards.ts  # XP system, badge evaluation, domain levels
│   ├── chatLogs.ts         # AI chat log storage
│   ├── ai.ts               # AI actions (Groq/OpenRouter)
│   ├── norms.ts            # Class norms / strikes
│   ├── trustJar.ts         # Trust jar (marble counter)
│   ├── visionBoard.ts      # Vision board areas + cards
│   ├── studentComments.ts  # Student feedback comments
│   ├── seed.ts             # Database seeding (emotion categories, etc.)
│   ├── migrations.ts       # One-off data migrations
│   ├── utils.ts            # hashPassword utility
│   └── _generated/         # Auto-generated Convex types (never edit)
├── public/
│   ├── diagnostic_v2/      # Standalone HTML+JS diagnostic engine
│   │   ├── mastery_data.json / mastery_data.js  # Question bank
│   │   ├── mastery.html    # Mastery diagnostic UI
│   │   ├── quiz.html       # Practice quiz UI
│   │   ├── mastery_engine.js # Core quiz engine
│   │   ├── index.html
│   │   └── grade5/grade7 test files
│   └── diagnostic/         # Legacy diagnostic data
├── scripts/                # Offline tooling (data processing, seeding)
├── docs/                   # Architecture and process docs
└── package.json / vite.config.ts / tailwind.config.js / tsconfig.json
```

---

## 4. Application Bootstrap & Entry Points

### `src/main.tsx`
Vite entry point. Renders `<App />` into `#root` using React 19's `createRoot`. Wrapped in `<StrictMode>`. Also imports KaTeX stylesheet globally:
```typescript
import "katex/dist/katex.min.css";
```
This ensures math rendering CSS is available everywhere in the app without per-component imports.

### `src/App.tsx`
The root component that wires everything together:

1. **Convex client** is instantiated from `VITE_CONVEX_URL` env var (falls back to placeholder).
2. `<ConvexProvider>` wraps everything — all Convex queries/mutations flow through this.
3. `<AuthProvider>` (from `useAuth.tsx`) provides user/session state to the entire tree.
4. `<TooltipProvider>` wraps shadcn tooltip context.
5. `<BrowserRouter>` + `<Routes>` defines all application routes.
6. `<Toaster>` (Sonner) renders toast notifications globally.

---

## 5. Authentication System

### How it works (end-to-end)

**Storage**: Sessions are stored in the Convex `sessions` table. The session token (64-char hex) is stored in `localStorage` under the key `"deep-work-tracker-token"`.

**Login flow**:
1. User submits username + password on `LoginPage.tsx`.
2. `api.auth.login` mutation is called (in `convex/auth.ts`).
3. Backend finds user by username index, hashes the submitted password with `hashPassword()` (SHA-256 via WebCrypto), compares to stored hash.
4. If match: deletes all existing sessions for that user, creates a new session with `expiresAt = now + 7 days`, returns `{ success: true, token, user }`.
5. Frontend stores token in localStorage, React state is updated, `useQuery(api.auth.getCurrentUser, { token })` starts resolving.

**Session validation**:
- Every page load: `useAuth()` reads token from localStorage, calls `getCurrentUser` query.
- If token is invalid/expired: query returns `null`, `useEffect` clears localStorage token, user is treated as logged out.
- `getCurrentUser` checks session expiry on the server; expired sessions return null.

**AuthProvider (`src/hooks/useAuth.tsx`)**:
- React context providing `{ user, isLoading, login, logout }`.
- `isLoading = token !== null && currentUser === undefined` (waiting for Convex query).
- `user` is typed as `User | null` (see `src/types/index.ts`).

**`useSessionToken()`**: A simpler hook that reads token from localStorage for one-off authenticated API calls.

### Backend auth functions (`convex/auth.ts`)

| Function | Type | Purpose |
|---|---|---|
| `login` | mutation | Verifies credentials, creates session, returns token |
| `logout` | mutation | Deletes session by token |
| `getCurrentUser` | query | Returns user object for given token (realtime) |
| `createUser` | mutation | Admin creates a new user (requires adminToken) |
| `changeOwnUsername` | mutation | Self-service username change (requires current password) |
| `changeOwnPassword` | mutation | Self-service password change |
| `updateOwnProfile` | mutation | Update avatar URL |
| `getFriendProfiles` | query | Batch-safe (same batch) friend list for avatars |
| `adminUpdateUsername` | mutation | Admin changes another user's username |
| `adminResetPassword` | mutation | Admin resets another user's password |
| `getCredentialSummaries` | query | Admin: view all users (no password hashes) |
| `initializeAdmin` | mutation | First-run: create initial admin (only if no users exist) |
| `initializeStudent` | mutation | First-run: create first student (only if no students exist) |
| `seedAdmins` | mutation | One-off: ensure devisha/vishwa admin accounts exist |
| `cleanupExpiredSessions` | mutation | Prune expired sessions |
| `checkNeedsBootstrap` | query | Returns true if no users exist (for SetupPage) |

**Admin auth pattern**: Many mutations accept `adminToken: string` instead of relying on server-side session context. They call `getAdminFromToken()` internally to validate the token and confirm the user is an admin.

**Password hashing (`convex/utils.ts`)**:
```typescript
crypto.subtle.digest("SHA-256", encoder.encode(password))
// Returns hex-encoded hash string
```
No salting — this is a private internal tool.

---

## 6. Routing & Role Separation

All routes are defined in `src/App.tsx`:

### Public Routes
| Path | Component | Notes |
|---|---|---|
| `/login` | `LoginPage` | Wrapped in `<PublicOnlyRoute>` — redirects logged-in users away |
| `/setup` | `SetupPage` | Bootstrap page for first-run admin + student creation |
| `/` | — | Redirects to `/login` |
| `*` | — | Redirects to `/login` |

### Student Routes (under `<DashboardLayout>`)
All student routes are wrapped in:
1. `<ProtectedRoute allowedRoles={["student"]}>` — redirects non-students to login
2. `<DashboardLayout>` — the student shell with sidebar + CheckInGate

| Path | Component | Purpose |
|---|---|---|
| `/dashboard` | `StudentDashboard` | Bento grid overview: Deep Work, Sprint, Reading, domains |
| `/check-in` | `EmotionCheckInPage` | Standalone view of emotion check-in (also accessible from gate) |
| `/sprint` | `SprintPage` | Goals, habit tracker, weekly task schedule |
| `/deep-work` | `DeepWorkPage` | All domains + assigned objectives overview |
| `/deep-work/:domainId` | `DomainDetailPage` | Single domain objectives + skill tree |
| `/deep-work/diagnostic/:majorObjectiveId` | `DiagnosticPage` | Run diagnostic for a major objective |
| `/reading` | `ReadingPage` | Book library + Book Buddy AI |
| `/review` | `ReviewPage` | Diagnostic attempt history |
| `/trust-jar` | `TrustJarPage` | View trust jar marble count |
| `/vision-board` | `VisionBoardPage` | Personal vision board |
| `/character` | `CharacterPage` | Character XP, tarot cards, badges (gated by feature flag) |
| `/settings` | `StudentSettingsPage` | Change username, password, avatar |

### Admin Routes (under `<AdminLayout>`)
All admin routes are wrapped in `<ProtectedRoute allowedRoles={["admin"]}>` + `<AdminLayout>`.

| Path | Component | Purpose |
|---|---|---|
| `/admin` | `AdminDashboard` | Summary metrics, today's check-ins, quick links |
| `/admin/students` | `StudentsPage` | Student roster with batch filtering |
| `/admin/students/:studentId` | `StudentDetailPage` | Per-student: objectives, progress, diagnostics, goals, books |
| `/admin/sprints` | `SprintsPage` | Sprint management + student progress insights |
| `/admin/projects` | `ProjectsPage` | List all projects |
| `/admin/projects/:projectId` | `ProjectDetailPage` | Manage project: student links, reflections, AI data chat |
| `/admin/objectives` | `ObjectivesPage` | Curriculum: create/edit major + sub objectives, assign to students |
| `/admin/viva` | `VivaQueuePage` | Queue of students who requested viva (mastery check) |
| `/admin/presentations` | `PresentationQueuePage` | Queue of students requesting book presentations |
| `/admin/books` | `BooksPage` | Manage book library |
| `/admin/norms` | `NormsPage` | Manage class norms / strikes |
| `/admin/comments` | `CommentsPage` | Student feedback comment inbox |
| `/admin/character` | `CharacterCatalogPage` | Manage tarot card catalog |
| `/admin/trust-jar` | `AdminTrustJarPage` | Add/remove marbles from trust jar per batch |
| `/admin/settings` | `AdminSettingsPage` | User management, credential summaries |

### Route Guards
- **`ProtectedRoute`** (`src/components/auth/ProtectedRoute.tsx`): Checks `useAuth()` for user + role. Shows loading state while resolving. Redirects to `/login` if not authenticated or wrong role.
- **`PublicOnlyRoute`**: Redirects authenticated users to their appropriate dashboard (`/dashboard` for students, `/admin` for admins).

---

## 7. Database Schema (All Tables)

Source of truth: `convex/schema.ts`. All tables use Convex's type-safe `defineTable()` with indexed fields.

### Users & Auth

**`users`**
```
username: string (indexed)
passwordHash: string (SHA-256 hex)
role: "student" | "admin"
displayName: string
avatarUrl?: string
batch?: string         // e.g. "2153" or "2156" — student class grouping
createdAt: number      // Unix ms
lastLoginAt?: number
```
Indexes: `by_username`, `by_role`, `by_batch`

**`sessions`**
```
userId: Id<"users">
token: string          // 64-char hex random
expiresAt: number      // now + 7 days
```
Indexes: `by_token`, `by_user`

### Emotional Check-Ins

**`emotionCategories`** — The 4 quadrants (Good+High, Good+Low, Bad+Low, Bad+High)
```
name: string
emoji: string
color: string
order: number
```

**`emotionSubcategories`** — Individual emotions (Excited, Calm, Tired, Stressed, etc.)
```
categoryId: Id<"emotionCategories"> (indexed)
name: string
emoji: string
order: number
```

**`emotionCheckIns`** — One per student per day (gate enforces this)
```
userId: Id<"users"> (indexed)
categoryId: Id<"emotionCategories">
subcategoryId: Id<"emotionSubcategories">
journalEntry?: string   // Includes "Feeling: X, Y\n\n[journal text]"
timestamp: number
```
Indexes: `by_user`, `by_user_date`

### Sprint Planning

**`sprints`** — 2-week planning cycles
```
name: string            // e.g. "Sprint 12"
startDate: string       // ISO date "YYYY-MM-DD"
endDate: string
isActive: boolean       // Only one sprint is active at a time
createdBy: Id<"users">
```
Indexes: `by_active`, `by_dates`

**`goals`** — SMART goals per student per sprint
```
userId: Id<"users">
sprintId: Id<"sprints">
domainId?: Id<"domains">
title: string
specific: string        // SMART components
measurable: string
achievable: string
relevant: string
timeBound: string
status: "not_started" | "in_progress" | "completed"
createdAt: number
updatedAt: number
```
Indexes: `by_user`, `by_sprint`, `by_user_sprint`

**`actionItems`** — Individual tasks under a goal (or standalone)
```
goalId?: Id<"goals">    // null = standalone task
userId: Id<"users">
domainId?: Id<"domains">
title: string
description?: string
weekNumber: number      // 1 or 2 (sprint has 2 weeks)
dayOfWeek: number       // 0 = Sunday, 6 = Saturday
scheduledTime?: string
isCompleted: boolean
completedAt?: number
order: number
```
Indexes: `by_goal`, `by_user`, `by_user_day`

**`habits`** — Daily habits for a sprint
```
userId: Id<"users">
sprintId: Id<"sprints">
domainId?: Id<"domains">
name: string
description?: string
whatIsHabit: string
howToPractice: string
cue?: string
reward?: string
createdAt: number
```
Indexes: `by_user`, `by_sprint`, `by_user_sprint`

**`habitCompletions`** — Daily habit check-ins
```
habitId: Id<"habits">
userId: Id<"users">
date: string            // "YYYY-MM-DD"
completed: boolean
```
Indexes: `by_habit`, `by_habit_date`, `by_user_date`

### Learning Graph (Curriculum)

**`domains`** — Top-level subject areas (Math, Reading, Writing, Coding, Momentum)
```
name: string
icon: string            // emoji
color: string
description: string
order: number
```

**`majorObjectives`** — Curriculum chapters/units
```
domainId: Id<"domains"> (indexed)
title: string
description: string
curriculum?: string     // "MYP Y1", "PYP Y2", etc.
difficulty?: "beginner" | "intermediate" | "advanced"
estimatedHours?: number
createdBy: Id<"users">
createdAt: number
```

**`learningObjectives`** — Sub-objectives/lessons under a major objective
```
domainId: Id<"domains"> (indexed)
majorObjectiveId?: Id<"majorObjectives"> (indexed)
title: string
description: string
difficulty: "beginner" | "intermediate" | "advanced"
estimatedHours?: number
createdBy: Id<"users">
createdAt: number
```

**`activities`** — Learning resources within a sub-objective
```
objectiveId: Id<"learningObjectives"> (indexed)
title: string
type: "video" | "exercise" | "reading" | "project" | "game"
url: string
platform?: string       // e.g. "Khan Academy", "Brilliant"
estimatedMinutes?: number
order: number
instructions?: string
```

### Student Progress

**`studentMajorObjectives`** — **AUTHORITATIVE** per-student major objective state
```
userId: Id<"users"> (indexed)
majorObjectiveId: Id<"majorObjectives"> (indexed)
assignedBy: Id<"users">
assignedAt: number
status: "assigned" | "in_progress" | "viva_requested" | "mastered"
vivaRequestedAt?: number
masteredAt?: number
adminNotes?: string
vivaRequestNotes?: string
```
Indexes: `by_user`, `by_major_objective`, `by_user_major`, `by_status`

**`studentObjectives`** — Per-student sub-objective state (legacy-compatible)
```
userId: Id<"users">
objectiveId: Id<"learningObjectives">
majorObjectiveId?: Id<"majorObjectives">
assignedBy: Id<"users">
assignedAt: number
status: "assigned" | "in_progress" | "completed" | "mastered" | "viva_requested"
  // Note: mastered/viva_requested are legacy — new logic uses studentMajorObjectives
vivaRequestedAt?: number
masteredAt?: number
adminNotes?: string
```
Indexes: `by_user`, `by_objective`, `by_user_objective`, `by_user_major`, `by_status`

**`activityProgress`** — Individual activity completion records
```
userId: Id<"users">
activityId: Id<"activities">
studentObjectiveId: Id<"studentObjectives">
completed: boolean
completedAt?: number
timeSpentMinutes?: number
notes?: string
```
Indexes: `by_user`, `by_activity`, `by_student_objective`

### Diagnostics

**`diagnosticUnlockRequests`** — Student requests to retake a failed diagnostic
```
userId: Id<"users">
majorObjectiveId: Id<"majorObjectives">
requestedAt: number
status: "pending" | "approved" | "denied" | "canceled"
handledBy?: Id<"users">
handledAt?: number
```
Indexes: `by_status`, `by_user_major`

**`diagnosticUnlocks`** — Admin-issued retake permissions
```
userId: Id<"users">
majorObjectiveId: Id<"majorObjectives">
approvedBy: Id<"users">
approvedAt: number
expiresAt: number       // Default: approvedAt + 24h
attemptsRemaining: number  // Default: 1
status: "approved" | "consumed" | "expired" | "revoked"
```
Indexes: `by_user_major`, `by_status`

**`diagnosticAttempts`** — Completed diagnostic runs
```
userId: Id<"users">
domainId: Id<"domains">
majorObjectiveId: Id<"majorObjectives">
studentMajorObjectiveId?: Id<"studentMajorObjectives">
unlockId?: Id<"diagnosticUnlocks">
attemptType: "practice" | "mastery"
diagnosticModuleName: string
diagnosticModuleIds: string[]
questionCount: number
score: number           // Raw correct count
scorePercent?: number   // Calculated: (score/questionCount) * 100
passThresholdPercent?: number  // 90
passed: boolean
startedAt: number
submittedAt: number
durationMs: number
results: Array<{
  questionId: string
  topic: string
  chosenLabel: string
  correctLabel: string
  correct: boolean
  misconception: string
  explanation: string
  visualHtml?: string
  stem?: string
}>
```
Indexes: `by_user_major`, `by_passed`, `by_major_passed`

### Student Comments

**`studentComments`** — Student feedback/messages to coaches
```
userId: Id<"users">
message: string
route?: string          // URL path where comment was made
pageTitle?: string
pageUrl?: string
commenterDisplayName?: string
commenterUsername?: string
attachments?: Array<{ storageId, fileName, contentType, sizeBytes }>
majorObjectiveId?: Id<"majorObjectives">
diagnosticAttemptId?: Id<"diagnosticAttempts">
status: "open" | "resolved"
createdAt: number
resolvedAt?: number
resolvedBy?: Id<"users">
```
Indexes: `by_created`, `by_user_created`, `by_status_created`

### Character System

**`characterProfiles`** — Overall level/XP for each student
```
userId: Id<"users"> (indexed)
totalXp: number
level: number
xpIntoLevel: number
xpNeededForNextLevel: number
activeTarotCardId?: Id<"tarotCards">
createdAt: number
updatedAt: number
```

**`characterDomainStats`** — Per-domain XP and level
```
userId: Id<"users"> (indexed)
domainId: Id<"domains"> (indexed)
xp: number
statLevel: number
updatedAt: number
```
Indexes: `by_user`, `by_user_domain`

**`characterXpLedger`** — Append-only XP award log (idempotent via sourceKey)
```
userId: Id<"users">
sourceType: "action_item" | "habit_completion" | "activity_completion" |
            "diagnostic_attempt" | "major_mastered" | "reading_milestone" |
            "manual_adjustment"
sourceKey: string       // e.g. "action_item:jd8..." — unique per award
xpAwarded: number
domainId?: Id<"domains">
meta?: any
awardedAt: number
```
Indexes: `by_user_awardedAt`, `by_user_sourceKey`

**`tarotCards`** — Collectible cards (cosmetic, feature-flagged)
```
name: string
slug: string (indexed)
description?: string
imageStorageId: Id<"_storage">  // Convex file storage
unlockLevel: number
domainAffinityId?: Id<"domains">
rarity: "common" | "rare" | "epic" | "legendary"
isActive: boolean
displayOrder: number
createdAt: number
updatedAt: number
```

**`studentTarotUnlocks`** — Which cards a student has unlocked
```
userId: Id<"users"> (indexed)
tarotCardId: Id<"tarotCards"> (indexed)
unlockedAt: number
unlockReason: "level" | "badge" | "admin"
```

**`badgeDefinitions`** — Achievement badge templates
```
code: string (indexed)
name: string
description: string
icon: string
thresholdType: "level" | "total_mastered" | "diagnostic_passes" | "habit_streak" | "reading_presented"
thresholdValue: number
displayOrder: number
isActive: boolean
```

**`studentBadges`** — Awarded badges per student
```
userId: Id<"users"> (indexed)
badgeCode: string (indexed)
awardedAt: number
meta?: any
```

### Reading Library

**`books`** — The book catalog
```
title: string
author: string
coverImageUrl?: string
readingUrl?: string
description?: string
gradeLevel?: string
genre?: string
pageCount?: number
isPrePopulated: boolean
addedBy?: Id<"users">
createdAt: number
```
Indexes: `by_grade`, `by_genre`

**`studentBooks`** — Per-student reading state
```
userId: Id<"users"> (indexed)
bookId: Id<"books"> (indexed)
status: "reading" | "completed" (legacy) | "presentation_requested" | "presented"
startedAt: number
completedAt?: number   // Legacy
presentationRequestedAt?: number
presentedAt?: number
rating?: number
review?: string
```
Indexes: `by_user`, `by_book`, `by_user_book`, `by_status`

### Trust Jar

**`trustJar`** — Marble counter per student batch
```
batch: string           // "2153" or "2156"
count: number           // 0-50 marbles
timesCompleted: number  // How many times jar has been filled and reset
updatedAt: number
updatedBy?: Id<"users">
```
Index: `by_batch`

### Class Norms

**`studentNorms`** — Strike/penalty tracking per student
```
userId: Id<"users"> (indexed)
strikes: number
penalties: number
penaltyPending: boolean
updatedAt: number
updatedBy?: Id<"users">
```

### Projects

**`projects`** — 6-week learning cycle projects
```
name: string            // e.g. "Project 3: Renewable Energy"
description?: string
startDate: string       // ISO date
endDate: string
isActive: boolean
cycleNumber: number     // 1, 2, 3... ordering
createdBy: Id<"users">
createdAt: number
```
Indexes: `by_active`, `by_cycle`

**`projectLinks`** — Student submission links for a project
```
projectId: Id<"projects"> (indexed)
userId: Id<"users">
url: string
title: string           // e.g. "Final Presentation"
linkType: "presentation" | "document" | "video" | "other"
addedAt: number
```

**`projectReflections`** — Student project retrospective
```
projectId: Id<"projects"> (indexed)
userId: Id<"users"> (indexed)
didWell?: string        // Q1: What they did well
projectDescription?: string  // Q2: Describe their project
couldImprove?: string   // Q3: What could improve
isComplete: boolean
updatedAt: number
```

### Vision Board

**`visionBoardAreas`** — User-defined life areas
```
userId: Id<"users"> (indexed)
name: string
emoji: string
isPreset: boolean
```

**`visionBoardCards`** — Cards pinned to the board
```
userId: Id<"users"> (indexed)
areaId: Id<"visionBoardAreas"> (indexed)
cardType: "image_hero" | "counter" | "progress" | "streak" | "habits" |
          "mini_tile" | "motivation" | "journal"
title: string
subtitle?: string
emoji?: string
colorVariant: "green" | "blue" | "pink" | "purple" | "orange" | "yellow"
size: "sm" | "md" | "lg" | "tall" | "wide" | "hero"
order: number
// Type-specific fields (many optional):
imageUrl?: string         // image_hero
progressPercent?: number
currentCount?: number     // counter
targetCount?: number
countLabel?: string
description?: string      // progress
totalSteps?: number
completedSteps?: number
stepsLabel?: string
quote?: string            // streak
streakCount?: number
habits?: Array<{ label: string; done: boolean }>  // habits
dayCount?: number
textContent?: string      // journal
entryDate?: string
createdAt: number
```

### AI Chat Logs

**`chatLogs`** — Development/debug logging for AI interactions
```
type: string
data: any
timestamp: number
```
Index: `by_timestamp`

---

## 8. Convex Backend Modules

### `convex/auth.ts`
See Authentication System section above.

### `convex/emotions.ts`
Manages the daily emotional check-in system.

Key functions:
- `getCategories()` — Returns all emotion categories with their subcategories, sorted by order.
- `saveCheckIn(userId, categoryId, subcategoryId, journalEntry?)` — Inserts a new check-in. The journal entry includes a `"Feeling: X, Y\n\n[text]"` prefix built in the frontend.
- `updateCheckIn(checkInId, ...)` — Patch existing check-in fields.
- `getTodayCheckIn(userId)` — Finds check-in with timestamp ≥ start of today. Returns with category + subcategory details joined. **This is the gate query — if null, CheckInGate intercepts.**
- `getHistory(userId, limit?)` — Returns last N check-ins with full details.
- `getStats(userId, days?)` — Returns streak + category breakdown for last N days.
- `getTodayCheckIns()` — Admin view: all students' check-ins for today.
- `deleteTodayCheckIn(userId)` — Dev helper to reset gate for testing.
- `calculateStreak()` — Internal helper: counts consecutive days with at least one check-in.

### `convex/sprints.ts`
Manages 2-week sprint cycles.

Key functions:
- `getActive()` — The one sprint where `isActive = true`.
- `getAll()` — All sprints, sorted newest first.
- `create(name, startDate, endDate, createdBy)` — Deactivates existing active sprint, creates new one as active.
- `update(sprintId, ...)` — Patch sprint fields.
- `setActive(sprintId)` — Deactivates all, activates the given one.
- `remove(sprintId)` — Deletes sprint.
- `getStudentInsights(sprintId)` — Heavy query: for each student, fetches goals + tasks + habits + completions, computes `engagementScore` as average of: goal completion %, task completion %, habit consistency %. Returns `currentFocus` (top active goals + incomplete tasks).

### `convex/goals.ts`
Goals and action items (tasks).

Key functions:
- `getByUserAndSprint(userId, sprintId)` — Goals with their action items.
- `getWithActions(goalId)` — Single goal + items.
- `create(userId, sprintId, domainId?, ...SMARTFields)` — SMART goal creation.
- `update(goalId, ...)` — Patch goal fields.
- `remove(goalId)` — Deletes goal + all its action items.
- `addActionItem(goalId?, userId, domainId?, title, weekNumber, dayOfWeek)` — Adds task. If goalId is null, it's a standalone task. Always assigns to `ensureMomentumDomain()`.
- `toggleActionItem(itemId)` — Flips isCompleted. On completion, awards XP via `awardXpIfNotExists()`.
- `updateActionItem(itemId, ...)` — Patch task fields.
- `removeActionItem(itemId)` — Deletes single task.
- `getActionItemsByDay(userId, weekNumber, dayOfWeek)` — All tasks for a specific day.
- `getStandaloneActionItems(userId, weekNumber)` — Tasks with no goalId.
- `getPreviousSprintGoals(userId, currentSprintId)` — Goals from the immediately preceding sprint (for import feature).
- `duplicate(goalId, targetSprintId?, includeActionItems?)` — Copies a goal (appends " (copy)").
- `importGoal(goalId, targetSprintId)` — Like duplicate but keeps original title.

### `convex/habits.ts`
Daily habit tracking.

Key functions:
- `getByUserAndSprint(userId, sprintId)` — Habits for a sprint, each enriched with their `completions[]` array.
- `getWithCompletions(habitId)` — Single habit + all its completions.
- `create(userId, sprintId, domainId?, name, whatIsHabit, howToPractice, cue?, reward?)` — Creates habit. **Always overwrites domainId with the Momentum domain** (via `ensureMomentumDomain()`) regardless of what `domainId` is passed.
- `update(habitId, ...)` — Patches habit fields.
- `remove(habitId)` — Deletes habit AND all its `habitCompletions` (cascade delete).
- `toggleCompletion(habitId, userId, date)` — Toggles the `completed` flag for a specific YYYY-MM-DD date. On toggle-to-completed: awards XP via `awardXpIfNotExists()`. Also ensures `domainId` is set to Momentum on the habit record.
- `getCompletionsInRange(userId, startDate, endDate)` — Completion records for a user in a date range (fetches by user index, then filters in-memory by date range).
- `getStreak(habitId)` — Server-side streak calculation using UTC "today". **NOTE**: Uses server UTC timezone. For timezone-accurate streaks, the client-side `calculateStreak()` in `HabitTracker.tsx` should be used instead.

### `convex/domains.ts`
Read-only access to the domains list. Domains are seeded via `convex/seed.ts` and are not mutable through API calls.

Functions: `getAll()` — all domains, sorted ascending; `getById(domainId)` — single domain lookup.

> **Note**: There are no create/update/remove mutations in this module. Domain management is handled manually via seeding scripts.

### `convex/objectives.ts`
The most complex backend module — manages the curriculum hierarchy and student assignments.

**Hierarchy**: Domain → MajorObjective → LearningObjective (sub) → Activity

Key functions:
- `getAll()` — All major objectives with domain, assignedCount, masteredCount, subObjectiveCount.
- `getByDomain(domainId)` — Majors + their subs for a domain.
- `getAllSubObjectives()` — All sub-objectives with their parent major + domain.
- `create(...)` / `update(...)` / `remove(...)` — Major objective CRUD. `remove()` cascades: deletes all subs, their activities, activity progress, student assignments.
- `createSubObjective(majorObjectiveId, ...)` — Creates sub-objective, inherits domainId from parent.
- `updateSubObjective(...)` / `removeSubObjective(objectiveId)` — Sub CRUD. `removeSubObjective` cascades: deletes activities, progress records, student assignments, then cleans up orphaned `studentMajorObjectives`.
- `assignToStudent(userId, objectiveId, assignedBy)` — Assigns a sub-objective to one student. Also ensures a `studentMajorObjective` row exists.
- `assignToMultipleStudents(studentIds[], objectiveId, assignedBy)` — Bulk assign.
- `unassignFromStudent(userId, objectiveId)` — Removes sub assignment + progress. If no subs remain for that major, also removes the major assignment.
- `assignChapterToMultipleStudents(majorObjectiveId, studentIds[], assignedBy)` — Assigns ALL subs under a major to multiple students at once.
- `getAssignedStudents(objectiveId)` — Who is assigned to a specific sub.
- `getAssignedStudentsForChapter(majorObjectiveId)` — Who has ALL subs of a major assigned.
- `updateStatus(studentMajorObjectiveId, status, vivaRequestNotes?)` — The key viva workflow mutation. Sets `vivaRequestedAt` or `masteredAt` as appropriate. When status changes to "mastered", awards XP.
- `getVivaRequests()` — All studentMajorObjectives with `status = "viva_requested"`.
- `getAssignedToStudent(userId)` — Full tree of assigned objectives for a student.
- `getAssignedByDomain(userId, domainId)` — Assigned objectives for a student + domain, including activities and progress.
- `getTreeData(userId)` — Full skill tree: domains + all assigned majors with subs + activities + progress. Used by `SkillTreeCanvas`.
- `migrateObjectivesToMajorSub()` — One-off migration to create majorObjective rows for old-style objectives.

**Internal helper `buildStudentMajorData(ctx, userId, options)`**: The shared data-fetching logic. Queries all student major assignments + sub assignments, fetches objectives, optionally fetches activities + progress, groups everything by major. Returns `{ majorObjective, domain, assignment, subObjectives[] }[]`.

**Internal helper `cleanupStudentMajorIfEmpty(ctx, userId, majorObjectiveId)`**: After unassigning a sub, checks if any subs remain. If none, deletes the `studentMajorObjective` row too.

### `convex/activities.ts`
Activity CRUD (resources within sub-objectives).

Functions:
- `getByObjective(objectiveId)` — Activities for an objective (fetched without ordering, sort in UI).
- `create(objectiveId, title, type, url, platform?, order)` — Creates activity. Type must be one of: `"video" | "exercise" | "reading" | "project" | "game"`.
- `update(activityId, ...)` — Patches activity fields.
- `remove(activityId)` — Deletes the activity row only. **Does NOT cascade to activityProgress records** — orphaned progress rows remain. (User deletion in `users.ts` handles full cleanup.)

> **No `reorder()` function exists in this module.** Order is set at create time and updated individually via `update()`.

### `convex/progress.ts`
Activity completion tracking.

Key functions:
- `toggleActivity(userId, activityId, studentObjectiveId)` — Toggles the `completed` flag on an `activityProgress` record (creates it if it doesn't exist). On completion, awards XP. After toggling, recomputes the parent `studentObjective` status (`assigned → in_progress → completed`) based on how many activities are now complete. Also cascades up to `studentMajorObjective` status if needed.
- `getByStudentObjective(studentObjectiveId)` — All activityProgress records for one student-objective pair.
- `getDomainSummary(userId)` — Per-domain counts of: total assigned, mastered, inProgress. Used by student dashboard.

> **Note**: There is NO `markComplete`, `markIncomplete`, `getProgress`, or `getStudentSummary` function. The single `toggleActivity` handles both completing and un-completing.

### `convex/diagnostics.ts`
The diagnostic assessment system. See full section below.

Key constants:
- `PASS_THRESHOLD_PERCENT = 90` — Must score ≥90% to pass.
- `DEFAULT_UNLOCK_EXPIRY_MS = 24 * 60 * 60 * 1000` — Unlock expires after 24h by default.

Key functions:
- `getCurriculumModuleIndex(majorObjectiveId)` — Returns module index within curriculum cohort (for loading the right diagnostic data file).
- `getUnlockState(userId, majorObjectiveId)` — The main gating query. Returns: majorAssignment, activeUnlock, pendingRequest, latestAttempt, and a `policy` object with: `{ passThresholdPercent, requiresVivaRequest, requiresUnlock, canStart }`.
- `requestUnlock(userId, majorObjectiveId)` — Student requests a diagnostic retake after failing.
- `approveUnlock(requestId, approvedBy, expiresInMinutes?, attemptsGranted?)` — Admin approves a retake request.
- `denyUnlock(requestId, deniedBy)` — Admin denies a retake request.
- `revokeUnlock(unlockId)` — Admin revokes an active unlock.
- `getPendingUnlockRequests()` — All pending requests (for admin queue).
- `getFailuresForQueue()` — All latest failed attempts per student-major pair (excludes mastered).
- `getAllAttemptsForAdmin()` — Last 500 attempts with enriched data.
- `getStudentAttempts(userId)` — All attempts for a student.
- `submitAttempt(...)` — The critical mutation. Validates unlock state, records attempt, awards XP, and if passed: marks major as mastered + bulk-completes all sub-objectives + activities.

### `convex/books.ts`
Book library management.

Key functions:
- `getAll()`, `getByGenre(genre)`, `create(...)`, `update(bookId, ...)`, `remove(bookId)`.
- `getStudentBooks(userId)` — Student's book list with book details joined.
- `getCurrentlyReading(userId)` — Book with status "reading".
- `getReadingHistory(userId)` — For AI context.
- `startReading(userId, bookId)` — Creates studentBooks row.
- `updateStatus(studentBookId, status)` — Changes reading status, timestamps appropriately. Awards XP on `presentation_requested` and `presented`.
- `addReview(studentBookId, rating, review?)`.
- `removeFromMyBooks(studentBookId)` — Student removes book from list.
- `getReadingStats(userId)` — Counts by status.
- `getPresentationRequests()` — All books with `presentation_requested` or `completed` (legacy) status.
- `approvePresentationRequest(studentBookId, approved)` — Admin approves → sets to "presented" + awards XP. Admin rejects → sets back to "reading".

### `convex/character.ts` + `convex/characterAwards.ts`
The gamification system (currently feature-flagged off).

**XP award rates** (from `characterAwards.ts`):
```
actionItem: 6 XP
habitCompletion: 4 XP
activityCompletion: 10 XP
diagnosticPass: 40 XP
diagnosticFail: 12 XP
majorMastered: 60 XP
readingPresentationRequested: 15 XP
readingPresented: 30 XP
```

**Momentum domain cap**: 36 XP/day max from action_items + habit_completions in the "Momentum" domain.

**Level formula**:
- Domain stat level = `1 + floor(domainXp / 120)` (or `/224` for Momentum domain)
- Overall level = average of all domain levels (floor)
- XP needed per level = `100 + (level-1) * 25`

**`awardXpIfNotExists(ctx, { userId, sourceType, sourceKey, xp, domainId?, meta? })`**: The central XP function. Uses `sourceKey` as idempotency key. If `STUDENT_CHARACTER_SYSTEM_ENABLED = false`, returns early without awarding. Otherwise: inserts ledger entry, updates domain stats, refreshes profile, checks for tarot unlocks + badge awards.

**`character.ts`** exports:
- `getMyCharacter(userId)` — Full character payload: profile, levelProgress, activeCard, collection, domainStats, badges, recentXp, nextUnlock.
- `getMyCollection(userId)` — Lighter: just cards.
- `getMyTimeline(userId, limit?)` — XP history.
- `equipCard(userId, tarotCardId)` — Equip an unlocked card.
- `getTarotCatalog()` — Admin: all tarot cards.
- `generateTarotUploadUrl()` — Admin: get Convex storage upload URL.
- `createTarotCard(...)` / `updateTarotCard(...)` / `archiveTarotCard(...)` — Admin card management.
- `getStudentCharacter(userId)` — Admin view of student character.
- `backfillPartialCharacterXp()` — Migration: award XP for all historical attempts.
- `backfillMissingXpDomains()` — Migration: fill in missing domainId on ledger rows.
- `migrateTasksAndHabitsToMomentum()` — Migration: reassign all tasks/habits XP to Momentum domain.
- `recomputeCharacterDomainLevels()` — Migration: recalculate all domain stat levels.

### `convex/ai.ts`
All AI calls are Convex `action`s (can call external APIs, cannot write to DB directly). Primary provider: Groq. Fallback: OpenRouter.

**Model configuration**:
```
Primary (Groq):    moonshotai/kimi-k2-instruct
Formatter (Groq):  llama-3.1-8b-instant   (fast structured output pass)
Fallback (OpenRouter): xiaomi/mimo-v2-flash:free
```
Rate-limit retry logic: Groq formatter retries up to 2 times with 3s waits on 429. The fallback path adds `HTTP-Referer` and `X-Title` headers for OpenRouter.

**Input normalization**: Goal Chat runs user input through `normalizeInput()` (typo correction for common words: "mornign"→"morning", "evry"→"every", "mins"→"minutes", etc.) and `removeFiller()` (strips hedge words and filler phrases) before sending to AI.

**Three AI features**:

1. **Goal Chat** (`api.ai.chat`)
   - Persona: "muse" (encouraging, fun) or "captain" (structured, disciplined)
   - Extracts structured goal draft from conversation: `{ what, when, howLong }`
   - Returns fenced `goal-ready` block when goal is confirmed
   - Suggests tasks with week/day scheduling
   - Can "Duplicate last week" to copy previous sprint's goals

2. **Book Buddy** (`api.ai.libraryChat`)
   - Personality: "luna" (curious, poetic), "dash" (enthusiastic, sporty), or "hagrid" (warm, story-lover)
   - Takes reading history as context
   - Returns fenced `buddy-response` block

3. **Admin Data Chat** (`api.ai.projectDataChat`)
   - For admin project data entry
   - Can extract project reflection answers from free-form text
   - Can extract "add-book" commands
   - Returns fenced `admin-commands` block with executable JSON commands
   - Uses a formatter model (Groq) to stabilize structured output

**Response contracts**: All AI responses must contain parseable fenced blocks. UI parsers extract these blocks. If parsing fails, UI degrades to plain text display.

**Environment variables required**:
- `GROQ_API_KEY` (required)
- `OPENROUTER_API_KEY` (optional fallback)

### `convex/visionBoard.ts`
Vision board CRUD.

Key functions:
- `getAreas(userId)` — All areas for a user.
- `getCards(userId)` — ALL cards for a user (no per-area filter query).
- `seedPresetAreas(userId)` — **Idempotent**: inserts the 5 preset areas only if user has none. The 5 presets are: "Fun & Interests", "Health & Fitness", "Friends", "Family", "Academics & Career".
- `addArea(userId, name, emoji)` — Creates a custom area (`isPreset: false`).
- `updateArea(areaId, name?, emoji?)` — Patches area; also sets `isPreset: false` to mark it user-edited.
- `deleteArea(areaId)` — **Cascade-deletes all cards in that area**, then deletes the area.
- `createCard(userId, areaId, cardType, title, colorVariant, size, ...)` — Creates a card. Sets `order = Date.now()` and `createdAt = Date.now()`.
- `updateCard(cardId, ...)` — Patches any card field.
- `deleteCard(cardId)` — Deletes the card only (area is unaffected).

**Atomic card interaction mutations** (for interactive card widgets):
- `incrementCounter(cardId)` — Increments `currentCount` up to `targetCount`.
- `incrementProgress(cardId)` — Increments `completedSteps` up to `totalSteps`.
- `incrementStreak(cardId)` — Increments `streakCount` by 1.
- `toggleHabit(cardId, habitIndex)` — Flips `done` on a specific habit item in the card's `habits[]` array.

> **No `reorderCards()` function exists.** Cards are sorted client-side using `order` (creation timestamp).

### `convex/trustJar.ts`
**MAX_COUNT = 50** marbles per jar. Requires admin token for all mutations.

- `get(batch)` — Returns `{ count, maxCount: 50, timesCompleted, updatedAt }`. Public — no auth required.
- `add(adminToken, batch)` — Adds 1 marble. Fails if jar is already at 50.
- `remove(adminToken, batch)` — Removes 1 marble. Fails if jar is empty.
- `reset(adminToken, batch)` — Resets count to 0. **Only increments `timesCompleted` if the jar was full (count ≥ 50) when reset was called.**

### `convex/norms.ts`
**MAX_STRIKES = 3**. All mutations require `adminToken`.

- `getAll()` — Returns all students joined with their norms record: `{ userId, displayName, username, batch, strikes, penalties, penaltyPending, updatedAt }`. Sorted alphabetically by displayName.
- `addStrike(adminToken, userId)` — Increments strikes (capped at 3). **Blocked if `penaltyPending = true`** (must complete existing penalty first). When strikes hit MAX_STRIKES: sets `penaltyPending = true` and increments `penalties`.
- `completePenalty(adminToken, userId)` — Marks penalty as completed: resets `strikes` to 0, sets `penaltyPending = false`.

> **No `removeStrike`, `addPenalty`, `clearPenalties`, or `getByUser` functions exist.** Penalty lifecycle: 3 strikes → penaltyPending → admin calls completePenalty → strikes reset.

### `convex/projects.ts` / `convex/projectLinks.ts` / `convex/projectReflections.ts`
Project CRUD and student submissions. **Only one project can be active at a time** — creating a new project auto-deactivates the current active one.

**`projects.ts`**:
- `getAll()` — All projects sorted newest-first by `cycleNumber`.
- `getActive()` — The single project where `isActive = true`.
- `getById(projectId)` / `getWithStats(projectId)` — The latter includes `totalStudents` and `completedStudents` (reflection count).
- `create(name, description?, startDate, endDate, cycleNumber, createdBy)` — Deactivates existing active project, creates new one.
- `update(projectId, ...)` — Patches project fields.
- `setActive(projectId)` — Deactivates all, activates selected one.
- `remove(projectId)` — **Cascade-deletes all projectLinks and projectReflections**, then the project.
- `getNextCycleNumber()` — Returns `max(cycleNumber) + 1` for auto-incrementing new projects.

**`projectLinks.ts`** (link types: `"presentation" | "document" | "video" | "other"`):
- `getByProject(projectId)` / `getByProjectAndUser(projectId, userId)`.
- `add(projectId, userId, url, title, linkType)` — Single link insert.
- `addMany(links[])` — Batch insert.
- `update(linkId, ...)` / `remove(linkId)` — Single link CRUD.
- `removeAllForUser(projectId, userId)` — Clears all links for one student.

**`projectReflections.ts`** (3 reflection fields: `didWell`, `projectDescription`, `couldImprove`; `isComplete = true` when all three are filled):
- `getByProject(projectId)` / `getByProjectAndUser(projectId, userId)`.
- `getOrCreate(projectId, userId)` — Returns existing or creates empty record (mutation, not query).
- `update(projectId, userId, didWell?, projectDescription?, couldImprove?)` — Upserts and recalculates `isComplete`. Can also insert if no record exists.
- `batchUpdate(updates[])` — Bulk update/insert multiple student reflections at once.
- `remove(projectId, userId)` / `getProjectStats(projectId)` — Delete + stats summary.

### `convex/studentComments.ts`
Student feedback/comment system with optional image attachments (up to 4 images per comment). Images are stored in Convex file storage.

- `submit(userId, message, route?, pageTitle?, pageUrl?, attachments?, majorObjectiveId?, diagnosticAttemptId?)` — Student submits. Comment must have a non-empty message **or** at least one attachment. Max 4 attachments. Denormalizes commenter name/username for display without joins.
- `generateUploadUrl()` — Returns a Convex storage upload URL (used before `submit` to upload image bytes). Client uploads image via `fetch(uploadUrl, { method: "POST", body: file })`, then passes `storageId` to `submit`.
- `getMine(userId, limit?)` — Student's own comments (max 300). Returns attachment URLs resolved from Convex storage.
- `getForAdmin(status?, userId?, majorObjectiveId?, limit?)` — Admin inbox. Supports filtering by status ("all"|"open"|"resolved"), student, or major objective. Returns enriched rows with resolved user, majorObjective, and attachment URLs.
- `resolve(commentId, resolvedBy)` — Sets status to "resolved", records `resolvedBy` and `resolvedAt`.

> **No `getAll()` or `getByStatus()` top-level functions.** Admin uses `getForAdmin` with `status` filter.

### `convex/users.ts`
Supplementary user queries not in `auth.ts`.

- `getAll()` — All students (role=student).
- `getById(userId)` — Single user.
- `getStudentCount()` — Count of students.
- `getAllUsers()` — All users including admins (debug use).
- `getTodayCheckInCount()` — Count of all check-ins made today (used by admin dashboard).
- `getByBatch(batch?)` — Students for a specific batch, or all students if no batch.
- `getBatches()` — All unique batch values in the system.
- `updateBatch(userId, batch?)` — Set/change a student's batch.
- `remove(userId)` — **Comprehensive cascade delete**: removes emotionCheckIns, studentObjectives, studentMajorObjectives, activityProgress, studentBooks, goals (+ actionItems), habits (+ habitCompletions), characterProfile, characterDomainStats, characterXpLedger, studentTarotUnlocks, studentBadges, then the user record.

### `convex/chatLogs.ts`
Debug/development logging for AI interactions.

- `log(type, data)` — Append a log entry.
- `getRecent(limit?)` — Last N entries (default 100), reversed to chronological order.
- `exportLogs(limit?)` — Convex `action` that returns all logs as a JSON string (for download).
- `clearAll()` — Delete all log records.

### `convex/seed.ts`
Seeding functions for initial data population:
- `seedEmotionCategories()` — Seeds the 4 quadrant emotion categories and all their subcategories.
- `seedBadgeDefinitions()` — Seeds 7 default badge definitions (LVL_5, LVL_10, MASTER_3, MASTER_10, DIAG_PASS_5, HABIT_STREAK_7, READER_3).
- `seedTarotCards()` — Seeds default tarot card entries (The Initiate, The Storyweaver, The Archivist, and more).
- `seedAll()` — Calls all seed functions in sequence.

> **No `seedDomains()` function** — domains are either manually created via admin UI or via one-off mutations.

### `convex/migrations.ts`
One-off migration mutations for data repair/transformation.

### `convex/utils.ts`
```typescript
export async function hashPassword(password: string): Promise<string>
// Uses WebCrypto SHA-256, returns hex string
```

---

## 9. Frontend: Student Experience

### `StudentDashboard.tsx`
The main landing page after check-in. Uses a **bento grid** layout with pastel "paper" cards.

Data fetched:
- `api.domains.getAll` — domain list
- `api.sprints.getActive` — current sprint
- `api.goals.getByUserAndSprint` — goals + action items for sprint
- `api.progress.getDomainSummary` — mastery counts per domain
- `api.books.getCurrentlyReading` — current book
- `api.goals.getStandaloneActionItems` (week 1 + week 2) — standalone tasks

**Bento grid cards**:
1. **Deep Work card** (spans 2 columns, 2 rows): Shows total mastered count, navigates to `mostRelevantDomainPath` (in-progress domain → assigned domain → domain with most incomplete work).
2. **Sprint card**: Current sprint name, days since start, count of today's incomplete tasks.
3. **Reading card**: Current book title + author.

**Domain row**: Scrollable grid of domain cards, each showing domain icon + mastered/total count. Clicking navigates to `/deep-work/:domainId`.

**DEV button**: Fixed bottom-right "Reset Check-in" button for testing (always visible in dev).

**Skeleton loading**: Uses `useDelayedLoading(200ms)` — only shows skeleton if loading takes >200ms, preventing flash.

### `EmotionCheckInPage.tsx`
Standalone check-in page (accessible from sidebar even after completing the gate). Shows the full Palette of Presence UI (same as CheckInGate) or today's check-in summary if already done.

### `SprintPage.tsx`
The sprint management page for students.

Sections:
- **Goals list** with `GoalCard` components showing SMART goal details + action items.
- **GoalChatPalette** — AI-powered goal creation chat interface.
- **Habit tracker** with `HabitTracker` component.
- Import goals from previous sprint.

Data: `api.sprints.getActive`, `api.goals.getByUserAndSprint`, `api.habits.getByUserAndSprint`

### `DeepWorkPage.tsx`
Overview of all domains + assigned objectives.

Shows domains as cards, each with progress summary. Clicking a domain navigates to `DomainDetailPage`.

### `DomainDetailPage.tsx`
Single domain detail view with the skill tree.

Sections:
- Domain header with color/icon.
- `SkillTreeCanvas` or `HorizontalTreeCanvas` showing the hierarchy of major → sub-objectives.
- Progress indicators (completed activities, mastery status).
- Activity links for each sub-objective.

Data: `api.objectives.getAssignedByDomain(userId, domainId)`

### `DiagnosticPage.tsx`
The diagnostic assessment runner. This is a complex page that embeds the standalone diagnostic V2 system within the React app.

Flow:
1. Loads `api.diagnostics.getUnlockState(userId, majorObjectiveId)`.
2. Based on `policy`:
   - `mastered`: shows "Already mastered" UI.
   - `requiresVivaRequest`: shows "Request Viva" button → calls `objectives.updateStatus("viva_requested")`.
   - `requiresUnlock`: shows "Request Retake" button → calls `diagnostics.requestUnlock()`.
   - `canStart`: loads the diagnostic iframe/embed and starts the assessment.
3. The diagnostic V2 HTML system runs the quiz (see section 25).
4. On completion, calls `api.diagnostics.submitAttempt(...)`.
5. Shows pass/fail results with misconception review.

### `ReadingPage.tsx`
The student reading hub.

Sections:
- Currently reading book with status controls.
- Book library browser (filter by genre).
- `BookBuddy` AI chat component.

Data: `api.books.getAll`, `api.books.getStudentBooks(userId)`, `api.books.getCurrentlyReading(userId)`

### `ReviewPage.tsx`
Diagnostic attempt history. Shows all past diagnostic attempts with scores, pass/fail, and expandable result details (per-question breakdown with misconceptions and explanations).

Data: `api.diagnostics.getStudentAttempts(userId)`

### `TrustJarPage.tsx`
Student view of their batch's trust jar. Shows a visual marble jar with current count and historical fill count.

Data: `api.trustJar.getByBatch(user.batch)`

### `VisionBoardPage.tsx`
Personal vision board with drag-able cards organized by life areas.

Uses `useVisionBoard` hook which wraps all vision board queries/mutations.

Card types: image_hero, counter, progress, streak, habits, mini_tile, motivation, journal.

### `CharacterPage.tsx`
Character progression page (currently feature-flagged off via `STUDENT_CHARACTER_SYSTEM_ENABLED = false`).

Would show: level, XP bar, domain stats, tarot card collection, badges, XP timeline.

Route redirects to `/dashboard` when flag is false.

### `StudentSettingsPage.tsx`
Self-service account settings: change username, change password, update avatar URL.

Calls: `api.auth.changeOwnUsername`, `api.auth.changeOwnPassword`, `api.auth.updateOwnProfile`

---

## 10. Frontend: Admin Experience

### `AdminDashboard.tsx`
Main admin landing. Shows:
- Count metrics (total students, active objectives, pending viva requests).
- Today's emotional check-ins list (who checked in, what emotion).
- Quick navigation links to key admin flows.

### `StudentsPage.tsx`
Student roster with batch filter. Shows each student's name, batch, last login, and a link to their detail page.

### `StudentDetailPage.tsx`
Comprehensive per-student view. Tabs/sections:
- **Objectives**: Assigned majors + subs with status, can assign new objectives.
- **Diagnostics**: All diagnostic attempts with full results.
- **Goals & Habits**: Current sprint goals + habits.
- **Books**: Reading list + status.
- **Character**: XP + badges (admin always sees this).

### `SprintsPage.tsx`
Sprint management. Create/edit sprints. View student insights grid showing engagement scores, goal completion, task completion, habit consistency per student for the active sprint.

### `ObjectivesPage.tsx`
Curriculum management. Full CRUD for major objectives and sub-objectives. Assignment panel to assign objectives to one or multiple students at once. `TaskAssigner` component handles the assignment UI.

### `VivaQueuePage.tsx`
All students with `status = "viva_requested"`. Admin can mark mastered or send back. Also shows pending diagnostic unlock requests with approve/deny controls.

### `PresentationQueuePage.tsx`
All books with `presentation_requested` status. Admin can approve (→ "presented") or reject (→ back to "reading").

### `BooksPage.tsx`
Book library management: create, edit, delete books.

### `NormsPage.tsx`
Per-student norms management: add/remove strikes, add/clear penalties, toggle penalty pending.

### `CommentsPage.tsx`
Student feedback inbox. Shows comments sorted by date. Admin can resolve comments. Supports file attachment viewing.

### `ProjectsPage.tsx` / `ProjectDetailPage.tsx`
Project management. Admin creates projects. In `ProjectDetailPage`: view student submission links, read reflection answers, use `ProjectDataChat` AI to extract data from free-form text.

### `TrustJarPage.tsx` (Admin)
Admin can add/remove marbles from either batch's trust jar.

### `CharacterCatalogPage.tsx`
Tarot card admin: upload images (Convex storage), create/edit/archive cards.

### `AdminSettingsPage.tsx`
User management: create new users (students/admins), view credential summaries, reset passwords, update usernames.

---

## 11. Shared Layout & UI Systems

### `DashboardLayout.tsx`
The student shell. Wraps all student routes:
1. Applies `<CheckInGate>` — if no today's check-in, shows Palette of Presence instead of children.
2. Renders `<Sidebar>` (student version) with a "comment" button.
3. Renders `<Changelog>` — what's new notification component.
4. Renders `<Outlet>` (the actual page content) inside `.page-wrapper > .container`.
5. Renders a **floating comment button** (bottom-right, fixed, black circle) — opens a dialog for submitting feedback with optional image uploads (up to 4 images via Convex storage).

**Vision Board special case**: Both the `<Changelog>` and the floating comment button are **hidden** on the `/vision-board` route (full-bleed immersive page).

**Comment dialog flow**: Student types message → optionally selects up to 4 image files → clicks Submit → layout uploads each image via `generateUploadUrl()` + `fetch(POST)` to Convex storage → calls `api.studentComments.submit()` with storageIds.

### `AdminLayout.tsx`
The admin shell. Renders shadcn/ui `<SidebarProvider>` + `<Sidebar>` + `<SidebarInset>` + `<Outlet>`. No check-in gate.

**13 nav items** (in order): Dashboard, Students, Norms, Sprints, Projects, Objectives, Viva Queue, Presentations, Books, Character, Comments, Trust Jar, Settings.

**Cmd+K global shortcut**: Opens a `<CommandDialog>` (cmdk) with student search. Typing filters students by displayName/username; selecting navigates to `/admin/students/:studentId`. Also accessible via a floating search pill button (bottom-right).

**Active nav logic**: `/admin` requires exact path match; all other routes use prefix match (`startsWith`).

### `Sidebar.tsx`
Student sidebar navigation:
- Dashboard
- Check-In
- Sprint
- Deep Work
- Reading
- Review
- Trust Jar
- Vision Board
- Character (only if feature flag enabled)
- Settings

Admin sidebar has different links (all /admin/* routes).

### `Header.tsx`
Top bar with page title, user display name, avatar.

### `CheckInGate.tsx`
The daily emotional check-in enforcer. See dedicated section below.

### Paper UI components (`src/components/paper/`)
Custom components for the student UI design system:
- `Button.tsx` — Styled button with paper aesthetic
- `Card.tsx` — Paper card container
- `Input.tsx` — Styled text input
- `Checkbox.tsx` — Styled checkbox
- `Modal.tsx` — Modal overlay
- `ProgressBar.tsx` — Animated progress bar
- `LoadingSpinner.tsx` — Loading indicator
- `Badge.tsx` — Status badge

### shadcn/ui components (`src/components/ui/`)
Admin UI uses shadcn components: button, card, input, select, textarea, dialog, sheet, dropdown-menu, tabs, table, command, sidebar, skeleton, sonner, avatar, badge, separator, tooltip.

### `MathText.tsx`
Renders LaTeX math expressions using **KaTeX** (imported globally in `main.tsx` via `import "katex/dist/katex.min.css"`). Used in diagnostic question display for math notation in question stems and choices.

---

## 12. The Daily Check-In Gate

File: `src/components/layout/CheckInGate.tsx`

This component wraps all student pages inside `DashboardLayout`. It intercepts rendering and forces the student to complete an emotional check-in before accessing the rest of the app each day.

### How it works:

1. **Query**: Calls `api.emotions.getTodayCheckIn(userId)` — realtime Convex query.
2. **If check-in exists**: Renders `{children}` (the actual app page) immediately.
3. **If no check-in**: Renders the "Palette of Presence" UI.

### Palette of Presence UI:

The check-in has a two-step flow:

**Step 1 — Quadrant Selection**:
- 4 large mood cards arranged in a grid:
  - Good + High Energy (sun icon, yellow tones) — Excited, Curious, Proud, Playful, Confident, Motivated
  - Good + Low Energy (plant icon, teal tones) — Calm, Relaxed, Safe, Content, Grateful, Peaceful, Serene
  - Bad + Low Energy (droplet icon, grey tones) — Tired, Sleepy, Bored, Sad, Lonely, Disappointed, Discouraged, Melancholy
  - Bad + High Energy (cloud-rain icon, rose tones) — Stressed, Worried, Nervous, Frustrated, Angry, Overwhelmed
- Click a quadrant → expands to show "nuance canvas" (shade tiles for that quadrant)
- Multiple emotions can be selected across quadrants
- Hover on emotion tiles shows a tooltip with a kid-friendly definition

**Step 2 — Journal**:
- After selecting at least one emotion and clicking "PROCEED" (or pressing Enter)
- Full-screen overlay with gradient background matching selected emotion color
- Optional free-text journal prompt: "Why do you feel this way?"
- Selected emotions are listed as a header
- CONTINUE saves, START OVER resets

**Saving**:
- `api.emotions.saveCheckIn()` is called with: primary emotion's categoryId + subcategoryId (mapped via `resolveEmotionIds()` which looks up the DB categories), journal entry = `"Feeling: Calm, Curious\n\n[optional text]"`.
- After save, `getTodayCheckIn` query updates, gate re-checks, children render.

**Skeleton state**: Uses `useDelayedLoading(200ms)` to avoid loading flash. Shows 4 card skeleton placeholders for <200ms waits.

**Loading/emotion alias handling**: `resolveEmotionIds()` maps emotion name (from hardcoded UI) to DB category+subcategory IDs. Has alias handling (e.g., "sleepy" → check "tired" if "sleepy" not found). Falls back gracefully if exact match isn't found.

---

## 13. Sprint & Goal System

### Sprints
- Created by admin. Only ONE sprint is active at a time (`isActive: true`).
- 2-week periods: `startDate`, `endDate` (ISO strings).
- `setActive()` deactivates all others first.

### Goals
Each student can have multiple goals per sprint. Goals follow SMART format with explicit fields (specific, measurable, achievable, relevant, timeBound).

### Action Items (Tasks)
Scheduled at week + day-of-week granularity. Two types:
- **Goal-linked**: `goalId` is set, task is part of a goal.
- **Standalone**: `goalId` is null/undefined, independent task.

Both types are always assigned to the "Momentum" domain (auto-created if not exists). The dashboard calculates `tasksLeft` by filtering today's incomplete tasks based on `weekNumber` (derived from sprint start) and `dayOfWeek`.

### Habit Tracker
Habits are tracked daily with a simple completed/not toggle per date string (YYYY-MM-DD). **All habits are forced into the "Momentum" domain** regardless of user selection — this is enforced on both create and complete. Streak is calculated from consecutive days of completion. The server's `getStreak()` uses UTC time; the client's `calculateStreak()` in `HabitTracker.tsx` is timezone-aware and should be preferred for display.

### Goal Chat AI
The `GoalChatPalette` component provides a conversational interface for goal creation. It uses `api.ai.chat` with selected persona (muse or captain). The AI extracts `{ what, when, howLong }` from conversation and when confirmed, returns a structured `goal-ready` block that the UI parses and pre-fills the goal creation form.

### Sprint Insights (Admin)
`api.sprints.getStudentInsights(sprintId)` computes per-student engagement scores. Formula:
- `goalCompletionPercent = completedGoals / totalGoals * 100`
- `taskCompletionPercent = completedTasks / totalTasks * 100`
- `habitConsistencyPercent = completedHabitDays / (habits.length * elapsedDays) * 100`
- `engagementScore = average of non-empty metrics`

---

## 14. Deep Work & Learning Graph

### Structure
```
Domain (Math, Reading, Writing, Coding, Momentum)
  └── MajorObjective (Chapter/Unit)
        └── LearningObjective (Sub-objective/Lesson)
              └── Activity (Video, Exercise, Reading, Project, Game)
```

### Student Assignment Flow
1. Admin creates major objectives + sub-objectives + activities in the curriculum.
2. Admin assigns sub-objectives to students (via `ObjectivesPage`).
3. When a sub is assigned, a `studentMajorObjective` row is also created/ensured.
4. Student works through activities, marking them complete.
5. When all activities in a sub-objective are complete, the sub-objective's status advances.

### Status Lifecycle (Major Objective)
```
assigned → in_progress → viva_requested → mastered
```

Only admin can advance to `mastered` (via VivaQueuePage or direct status update).

Students can request viva themselves (via `DiagnosticPage` or deep work page).

### Skill Tree Visualization
`SkillTreeCanvas.tsx` renders an SVG-based tree:
- Domain nodes at top
- Major objective nodes below
- Sub-objective nodes below those
- Color coding by status
- Animated SVG connections between nodes

`HorizontalTreeCanvas.tsx` — Alternative horizontal layout for wider screens.

`ObjectivePopover.tsx` — Tooltip/popover shown when hovering a node, showing details and activity list.

---

## 15. Diagnostic Assessment System

The most complex system in the app. Multi-phase gating ensures quality control.

### Phase 1: First Attempt
- Student navigates to `/deep-work/diagnostic/:majorObjectiveId`
- `DiagnosticPage` checks `getUnlockState()` → `canStart = true` for first attempt
- Student takes the diagnostic from the V2 question bank (see section 25)
- Results submitted via `submitAttempt(attemptType: "practice", ...)`
- **If `scorePercent >= 90%`**: `submitAttempt` marks `studentMajorObjective` as `mastered`, bulk-completes all sub-objectives + activities, awards XP.
- **If `scorePercent < 90%`**: Attempt recorded, no mastery change. Student must now request viva to continue.

### Phase 2: After Failure
If first attempt fails:
1. Student must request viva: calls `objectives.updateStatus(studentMajorObjectiveId, "viva_requested", vivaRequestNotes?)`.
2. Student then requests diagnostic unlock: calls `diagnostics.requestUnlock()`.
3. Admin reviews viva queue, sees the request, can approve unlock: `diagnostics.approveUnlock(requestId, approvedBy, expiresInMinutes?, attemptsGranted?)`.
4. Student now has a time-limited window (default 24h, 1 attempt) to retake.

### Phase 3: Retake
- `getUnlockState` returns `activeUnlock` and `canStart = true`.
- Student takes the diagnostic again (attemptType: "mastery").
- `submitAttempt` validates the active unlock, decrements `attemptsRemaining`, sets lock to "consumed" if reaches 0.
- If pass: marks mastered, cascades sub-objectives to "completed".

### Pass Cascade
When a diagnostic attempt passes, `submitAttempt` does:
1. Sets `studentMajorObjective.status = "mastered"`.
2. Awards `CHARACTER_XP.majorMastered` XP.
3. For each `learningObjective` under this major:
   - Upserts `studentObjective` with status "completed".
   - For each activity: upserts `activityProgress` with `completed = true`.

### The Policy Object
```typescript
{
  passThresholdPercent: 90,
  requiresVivaRequest: boolean,  // failed but not yet requested viva
  requiresUnlock: boolean,       // viva requested but no active unlock
  canStart: boolean,             // ready to take diagnostic
}
```

### `gatePolicy` State Machine
```
No previous attempt → canStart: true
Failed → requiresVivaRequest: true → (after viva request) → requiresUnlock: true →
(after admin approval) → canStart: true
Passed → mastered: true → done
```

---

## 16. Reading & Book System

### Book Library
Admin manages books: title, author, cover image URL, reading URL, description, grade level, genre, page count.

Students browse the library, start reading a book. Only one book can have `status = "reading"` at a time per student (enforced by convention, not DB constraint).

### Reading Status Lifecycle
```
reading → presentation_requested → presented
```
Legacy: `completed` (old status, still supported in queries).

### Book Buddy AI
`BookBuddy.tsx` embeds an AI chat with reading-focused personalities. Takes the student's reading history as context. The AI (api.ai.libraryChat) discusses books, makes recommendations, asks comprehension questions.

Personality options:
- **Luna**: Curious, poetic, introspective
- **Dash**: Enthusiastic, sporty, energetic
- **Hagrid**: Warm, story-loving, encouraging

### Presentation Queue
When a student requests presentation: admin sees the book in `PresentationQueuePage`. Admin can approve (marks "presented", awards XP) or reject (sends back to "reading").

---

## 17. Character & XP System

**Currently disabled** (`STUDENT_CHARACTER_SYSTEM_ENABLED = false` in both `featureFlags.ts` and `characterAwards.ts`).

All XP award calls (`awardXpIfNotExists`) return early when disabled. The `/character` route redirects to `/dashboard`.

### When enabled:
- Students earn XP through completing tasks, habits, activities, diagnostics, and reading milestones.
- XP is per-domain, tracked in `characterXpLedger` (append-only with idempotency key).
- Domain stats are maintained in `characterDomainStats`.
- Overall level = average of domain levels.
- Tarot cards (collectibles) unlock based on level thresholds.
- Badges award for hitting various milestones (levels, mastered count, habit streaks, etc.).

---

## 18. AI Integration

### Architecture
```
React Component → api.ai.{chat|libraryChat|projectDataChat} →
Convex action (convex/ai.ts) → Groq API (or OpenRouter fallback) →
Structured response → Parsed by component
```

### Provider Strategy
1. Try Groq first — **primary model: `moonshotai/kimi-k2-instruct`**
2. Fall back to OpenRouter if Groq fails — **fallback model: `xiaomi/mimo-v2-flash:free`**
3. A separate Groq call using **`llama-3.1-8b-instant`** (formatter model) stabilizes structured JSON output for the admin data chat
4. The formatter model uses `callGroqWithRetry()` which retries up to 2 times on 429 rate-limit errors (3s wait between retries)

### Prompt Chips
Pre-built conversation starters for goal chat:
- Initial: "Duplicate last week"
- After confirmation: "Yes, looks good!", "Change schedule", "Change duration", "Change activity", "Start over", "Make it fewer days", "Add more days"

### Structured Output Blocks
Each AI feature uses a specific fenced block that the UI parser extracts:

```
```goal-ready
{ "title": "...", "what": "...", "when": "...", "howLong": "..." }
```

```buddy-response
{ "text": "...", "suggestions": [...] }
```

```admin-commands
{ "commands": [{ "type": "add_reflection", "data": {...} }] }
```
```

### Chat Logging
`chatLogs` table stores debug logs of AI interactions for development visibility.

---

## 19. Vision Board System

A personal goal/aspiration board. Students organize cards by life areas.

### Areas
User-defined life areas. On first visit to the vision board, `seedPresetAreas()` is called (idempotent): inserts the 5 default areas if none exist:
1. Fun & Interests (Sparkle icon)
2. Health & Fitness (Barbell icon)
3. Friends (Users icon)
4. Family (House icon)
5. Academics & Career (GraduationCap icon)

Users can add custom areas or edit presets (editing sets `isPreset = false`). Deleting an area cascade-deletes all its cards.

### Card Types
| Type | Fields | Description |
|---|---|---|
| `image_hero` | imageUrl, progressPercent | Large image card with progress overlay |
| `counter` | currentCount, targetCount, countLabel | Count tracker (e.g., "Books read: 5/20") |
| `progress` | totalSteps, completedSteps, stepsLabel, description | Step-based progress |
| `streak` | streakCount, quote | Streak counter with motivational quote |
| `habits` | habits[] (label+done), dayCount | Mini habit checklist |
| `mini_tile` | subtitle, emoji | Small motivational tile |
| `motivation` | quote | Inspirational quote card |
| `journal` | textContent, entryDate | Personal journal entry |

### Card Sizes
`sm`, `md`, `lg`, `tall`, `wide`, `hero` — determines grid span.

### Color Variants
`green`, `blue`, `pink`, `purple`, `orange`, `yellow`

### Layout
`src/components/visionboard/layout.ts` — handles grid layout calculations.

`VisionBoardGrid.tsx` — renders the masonry-like grid.

`CardRenderer.tsx` — renders the appropriate card component based on `cardType`.

`CardCreatorSheet.tsx` — Sheet (drawer) UI for creating new cards.

`CardDetailSheet.tsx` — View/edit a specific card.

`VisionBoardFAB.tsx` — Floating action button to open card creator.

`AreaFilter.tsx` — Filter cards by life area.

---

## 20. Trust Jar System

A motivational tool for whole-class behavior. Each student batch (2153, 2156) has a trust jar that tracks marble count (0–50). The visual uses **Matter.js** physics to animate marbles falling into a jar.

- Admin adds/removes marbles (one at a time) based on class behavior.
- Jar capacity is **50 marbles**. Adding when full returns an error; removing when empty returns an error.
- Admin must explicitly call `reset()` to clear the jar. **`timesCompleted` only increments if the jar was at capacity (≥50) when reset was called.** Resetting a partial jar does NOT increment `timesCompleted`.
- Students can view their batch's jar on `/trust-jar`.
- Admin manages both batches on `/admin/trust-jar`.

The physical analogy: a real glass jar in the classroom that gets marbles added for positive class behavior.

---

## 21. Projects System

6-week learning cycles beyond individual objectives. Students submit links and reflections for each project.

### Data Flow
1. Admin creates a project with name, dates, cycle number.
2. Admin marks one project as active.
3. Students can view the active project and submit:
   - **Links**: URLs to their work (presentation, document, video, other)
   - **Reflections**: Three reflection questions answered in text form
4. Admin views `ProjectDetailPage`:
   - Sees all student submissions
   - Can use `ProjectDataChat` AI to extract reflection answers from free-form student text
   - AI returns `admin-commands` block that can auto-fill reflection fields

---

## 22. Class Norms System

Tracks behavioral compliance. Each student has a `studentNorms` record (created on first strike):
- `strikes`: Count of current behavioral warnings (max **3**)
- `penalties`: Lifetime count of triggered penalties
- `penaltyPending`: Flag indicating a consequence is due but not yet completed

**Penalty lifecycle**:
1. Admin adds a strike → strikes increments.
2. When strikes reach 3: `penaltyPending = true`, `penalties` increments.
3. Adding further strikes is **blocked** while `penaltyPending` is true.
4. Admin calls `completePenalty()` → `strikes` resets to 0, `penaltyPending` clears.

Admin manages through `/admin/norms`. No student-facing view.

---

## 23. Student Comments System

Students can leave feedback/questions at any point in the app. Comments are attached to the current page context (route, pageTitle, pageUrl) and optionally to a specific major objective or diagnostic attempt.

Admin views all comments in `/admin/comments`. Can resolve (mark as handled).

Comments can have file attachments stored in Convex's `_storage`.

---

## 24. Feature Flags

`src/lib/featureFlags.ts`:
```typescript
export const STUDENT_CHARACTER_SYSTEM_ENABLED = false;
```

This single flag controls:
- Whether `/character` route shows or redirects to `/dashboard`
- Whether `awardXpIfNotExists()` actually awards XP (no-ops when false)
- Whether `getMyCharacter()` returns null
- Whether tarot unlock logic runs

The flag is duplicated in `convex/characterAwards.ts` as well to prevent server-side execution.

---

## 25. Diagnostic V2 (Standalone HTML System)

Located in `public/diagnostic_v2/`. This is a completely separate, standalone HTML+JavaScript application that runs diagnostic assessments. It was built independently and integrated into the React app via an iframe or direct navigation.

### Files
- `index.html` — Entry point listing available modules
- `mastery.html` — Mastery diagnostic UI
- `quiz.html` — Practice quiz UI
- `mastery_engine.js` — Core quiz engine: question selection, answer validation, scoring, UI state machine
- `mastery_data.js` / `mastery_data.json` — The question bank (organized by major objective module)
- `data.js` — Additional curriculum data
- `grade5_textbook_tests.html/js` — Grade 5 tests
- `grade7_textbook_tests.html/js` — Grade 7 tests
- `profiles_schema_v1.md` — Schema docs for the diagnostic profile data

### Question Bank (`mastery_data.json`)
Organized as an array of modules. Each module corresponds to a `majorObjective` (matched via `diagnosticModuleName`). Each question has:
- `questionId`: unique ID
- `stem`: Question text (may include LaTeX math)
- Multiple choice options with labels
- `correctLabel`
- `topic`: Subject area
- `misconception`: Common wrong-thinking pattern for this question
- `explanation`: Why the correct answer is correct
- `visualHtml` (optional): SVG/HTML visual aid

### Integration with React (`src/lib/diagnostic.ts`)
`src/lib/diagnostic.ts` handles loading, caching, and question selection for the diagnostic system. Key behaviors:

**Loading**:
- `loadDiagnosticData()` — Fetches `/diagnostic_v2/mastery_data.json`, runs it through `buildModulesFromV2()` to normalize to `DiagnosticModule[]`. **Legacy fallback is disabled** — if V2 data is unavailable, it throws. Uses in-memory singleton cache.
- `loadDiagnosticSets()` — Loads pre-built question sets from `/diagnostic/diagnostic-sets.json` (falls back to empty array if missing).

**Question selection**:
- `findDiagnosticGroup(modules, section, moduleIndex)` — Finds modules matching the naming pattern (e.g., "Module 3:", "PYP 3:").
- `getSetForAttempt(sets, groupPrefix, attemptCount)` — Returns the pre-built set for this attempt (cycles through up to 10 sets: `attemptCount % sets.length`).
- `selectDeterministicQuestions({ questionPool, count, seed })` — Uses FNV hash + mulberry32 PRNG for deterministic question selection from a seed string. Reproducible per `seed`.
- `selectQuizQuestions({ questionPool, quizLen, usedQuestionIds })` — Prefers "fresh" (unseen) questions; if pool exhausted, resets tracking and uses full pool. Used question IDs stored in localStorage (`key = diag_used_{userId}_{majorId}_{moduleName}`).
- `getQuizLength(poolSize)` — Returns `max(1, round(poolSize / 3))`.

**Question ID tracking (localStorage)**:
- `getUsedQuestionKey(userId, majorObjectiveId, moduleName)` — Key for localStorage entry.
- `readUsedQuestionIds(key)` / `writeUsedQuestionIds(key, ids)` — Read/write the "used" set.

After the user completes the quiz, results are passed back to the React layer which calls `api.diagnostics.submitAttempt()`.

### `diagnostics.getCurriculumModuleIndex(majorObjectiveId)`
Determines which module index to load from the data file based on:
1. Get the major objective's `curriculum` field (e.g., "MYP Y1")
2. Find all majors in the same domain with the same curriculum
3. Sort by createdAt (ascending)
4. Return the 1-based position of this major in that sorted list

This 1-based index is passed to `findDiagnosticGroup()` to select the right module group (e.g., "Module 3:" for index 3).

---

## 26. Offline Scripts (`scripts/`)

These are Node.js/TypeScript scripts run offline (not part of the deployed app) for data processing and maintenance.

| Script | Purpose |
|---|---|
| `generate-seed-data.ts` | Generate initial curriculum seed data |
| `generated-seed-block.ts` | Generated seed data block ready for insertion |
| `apply-generated-seed-block.ts` | Insert generated seed data into Convex |
| `export-diagnostic-v2-md.mjs` | Export diagnostic V2 data to readable markdown |
| `sync-diagnostic-v2.mjs` | Sync diagnostic data between environments |
| `generate-whats-new.mjs` | Generate changelog feed (`whatsNew.generated.ts`) |
| `analyze-duplicates.ts` | Find duplicate curriculum entries |
| `analyze-semantic-mismatches.ts` | Find curriculum content mismatches |
| `audit-playlist-mapping.ts` | Audit learning objective → activity mappings |
| `repair-playlist-mapping.ts` | Fix identified mapping errors |
| `validate-playlist-mapping.ts` | Validate mapping quality |
| `dedup-khan-academy.ts` | Remove duplicate Khan Academy activity links |
| `distribute-brilliant-lessons.ts` | Distribute Brilliant.org lessons across objectives |
| `fill-empty-rows.ts` | Fill missing data in curriculum rows |
| `fix-metadata.ts` | Fix metadata issues in curriculum data |
| `patch-mismatch-risk-rows.ts` | Patch high-risk curriculum mismatches |
| `normalize-misconceptions-tone.mjs` | Normalize tone in diagnostic misconception text |
| `rewrite-misconceptions-groq.mjs` | Use Groq to rewrite misconceptions |
| `apply-readable-misconceptions.mjs` | Apply rewritten misconceptions to data file |
| `export-chat-logs.sh` | Export AI chat logs for analysis |

---

## 27. Environments & Deployment

### Convex Databases
| Env | Deployment | Notes |
|---|---|---|
| Development | `ardent-penguin-515` | Local dev, `VITE_CONVEX_URL` in `.env.local` |
| Production | `greedy-marten-449` | Live students, `VITE_CONVEX_URL` in `.env.production` |

`VITE_CONVEX_URL` controls which backend the frontend connects to.

### Frontend Hosting
- **Netlify**: Deployed from the `master` branch.
- `public/_redirects`: SPA fallback redirects (all paths → index.html).
- `.netlify/netlify.toml`: Netlify build config.

### Build Process
```
npm run dev      → Vite dev server + Convex dev
npm run build    → Vite production build
npx convex dev   → Start Convex dev server
npx convex deploy --yes  → Deploy Convex to production (no prompt)
```

### TypeScript Configuration
Three tsconfig files:
- `tsconfig.json` — Base config
- `tsconfig.app.json` — Frontend (src/)
- `tsconfig.node.json` — Node scripts (vite.config.ts, scripts/)
- `convex/tsconfig.json` — Convex functions

---

## 28. Data Invariants & Critical Contracts

These are non-negotiable rules that must never be violated:

1. **`studentMajorObjectives.status` is authoritative**. Never use `studentObjectives.status` for major-objective state. The `mastered` and `viva_requested` values in `studentObjectives` exist only for legacy compatibility.

2. **Diagnostic pass threshold is backend-enforced**. The 90% threshold is computed in `convex/diagnostics.ts`. The `passed` field passed from the client is IGNORED — the server recalculates from `scorePercent`.

3. **Diagnostic unlock consumption is safe against legacy rows**. Missing `attemptsRemaining` defaults to 1. Missing `expiresAt` defaults to `approvedAt + 24h`.

4. **Student routes require daily check-in**. `DashboardLayout` wraps all student routes in `CheckInGate`. This cannot be bypassed except by an existing `emotionCheckIns` record for today.

5. **Role separation is enforced at the route level**. `ProtectedRoute` blocks wrong-role access. Admin routes cannot be accessed by students and vice versa.

6. **XP is idempotent**. `awardXpIfNotExists()` uses `sourceKey` to prevent double-awarding. Backfill mutations are safe to run multiple times.

7. **Session invalidation is immediate**. `getCurrentUser` query is realtime — if a session is deleted server-side, the frontend sees it within milliseconds and auto-logs out.

8. **Only one active sprint at a time**. `sprints.create()` and `sprints.setActive()` both deactivate existing active sprints first.

9. **Cascade deletes maintain referential integrity**. Deleting a major objective cascades to all subs → activities → activity progress → student assignments. Unassigning a sub deletes its progress records and orphan-cleans the major assignment.

10. **AI outputs must degrade safely**. If the AI response can't be parsed for its structured block, the UI shows the raw text and does not crash.

11. **Activities.remove() does NOT cascade**. Deleting a learning activity does not delete orphaned `activityProgress` records. Full cleanup only happens via `users.remove()` (student deletion) or `objectives.removeSubObjective()` (which cascades properly).

12. **Domains are read-only via API**. Only `getAll()` and `getById()` exist in `domains.ts`. There are no mutations — domain management is via seed scripts or one-off migrations.

13. **BookStatus has 4 values in practice**: "reading" | "completed" (legacy) | "presentation_requested" | "presented". The `src/types/index.ts` type is out of date (missing "presentation_requested"). `src/lib/status-utils.ts` is the authoritative type.

14. **Habits always use Momentum domain**. The `domainId` field on a habit is always overwritten to the Momentum domain ID, regardless of what is passed to `create()` or modified by `update()`. The Momentum domain is auto-created if it doesn't exist.

15. **Preset vision board areas are idempotent**. `seedPresetAreas()` only inserts if the user has zero areas. Calling it multiple times is safe.

---

## 29. File Index (Every Source File)

### `convex/` — Backend

| File | Role |
|---|---|
| `schema.ts` | All table definitions (single source of truth) |
| `auth.ts` | Auth: login, logout, user CRUD, session management |
| `users.ts` | User queries (getAll students, getById, getByBatch, getBatches, getTodayCheckInCount) + student cascade-delete |
| `emotions.ts` | Emotional check-in CRUD, streak, admin view |
| `sprints.ts` | Sprint CRUD, student insights aggregation |
| `goals.ts` | Goals, action items, duplicate/import |
| `habits.ts` | Habit CRUD, daily completion tracking |
| `domains.ts` | Domain queries (read-only: getAll, getById) |
| `objectives.ts` | Major/sub objective CRUD, assignment, viva workflow, skill tree data |
| `activities.ts` | Activity CRUD within objectives |
| `progress.ts` | Activity completion, domain summary |
| `diagnostics.ts` | Unlock flow, attempt submission, pass/fail cascade |
| `books.ts` | Book library, student reading state, presentation queue |
| `projects.ts` | Project CRUD |
| `projectLinks.ts` | Student project submission links |
| `projectReflections.ts` | Student project reflection answers |
| `character.ts` | Character profile, tarot cards, badges, migrations |
| `characterAwards.ts` | XP system, level formulas, badge evaluation, domain stats |
| `chatLogs.ts` | AI chat log CRUD |
| `ai.ts` | AI actions (Groq/OpenRouter): goal chat, book buddy, admin data chat |
| `norms.ts` | Class norms / strikes CRUD |
| `trustJar.ts` | Trust jar marble counter |
| `visionBoard.ts` | Vision board areas + cards CRUD |
| `studentComments.ts` | Student feedback comments |
| `seed.ts` | Database seeding (emotion categories, domains) |
| `migrations.ts` | One-off data migrations |
| `utils.ts` | hashPassword utility |
| `_generated/api.d.ts` | Auto-generated API types (never edit) |
| `_generated/api.js` | Auto-generated API (never edit) |
| `_generated/dataModel.d.ts` | Auto-generated DB model types (never edit) |
| `_generated/server.d.ts` | Auto-generated server types (never edit) |
| `_generated/server.js` | Auto-generated server helpers (never edit) |

### `src/` — Frontend

| File | Role |
|---|---|
| `main.tsx` | Vite entry point, React root |
| `App.tsx` | Root component: providers, all route definitions |
| `index.css` | Global styles: pastel-card classes, bento-grid, paper styles |
| **Components** | |
| `components/auth/LoginForm.tsx` | Login form UI |
| `components/auth/ProtectedRoute.tsx` | Role-based route guard |
| `components/auth/index.ts` | Re-exports |
| `components/layout/DashboardLayout.tsx` | Student shell: sidebar + CheckInGate + outlet |
| `components/layout/AdminLayout.tsx` | Admin shell |
| `components/layout/CheckInGate.tsx` | Daily emotion check-in enforcer |
| `components/layout/Header.tsx` | Top navigation bar |
| `components/layout/Sidebar.tsx` | Navigation sidebar |
| `components/layout/Changelog.tsx` | In-app changelog modal |
| `components/layout/index.ts` | Re-exports |
| `components/paper/Button.tsx` | Student UI button |
| `components/paper/Card.tsx` | Student UI card |
| `components/paper/Input.tsx` | Student UI input |
| `components/paper/Checkbox.tsx` | Student UI checkbox |
| `components/paper/Modal.tsx` | Modal overlay |
| `components/paper/ProgressBar.tsx` | Animated progress bar |
| `components/paper/LoadingSpinner.tsx` | Loading indicator |
| `components/paper/Badge.tsx` | Status badge |
| `components/paper/index.ts` | Re-exports |
| `components/ui/` | shadcn/ui primitives (20 files) |
| `components/deepwork/DomainCard.tsx` | Domain overview card |
| `components/deepwork/LearningObjectiveCard.tsx` | Sub-objective display card |
| `components/deepwork/index.ts` | Re-exports |
| `components/emotions/EmotionWheel.tsx` | Emotion wheel visualization |
| `components/emotions/EmotionCard.tsx` | Single emotion display card |
| `components/emotions/EmotionHistory.tsx` | Check-in history list |
| `components/emotions/EmotionJournal.tsx` | Journal entry display |
| `components/emotions/index.ts` | Re-exports |
| `components/sprint/GoalCard.tsx` | SMART goal display + task list |
| `components/sprint/GoalEditor.tsx` | Goal creation/editing form |
| `components/sprint/GoalChatPalette.tsx` | AI goal chat interface |
| `components/sprint/HabitTracker.tsx` | Habit daily completion grid |
| `components/sprint/index.ts` | Re-exports |
| `components/skill-tree/SkillTreeCanvas.tsx` | SVG skill tree renderer |
| `components/skill-tree/HorizontalTreeCanvas.tsx` | Horizontal tree layout |
| `components/skill-tree/ObjectivePopover.tsx` | Node hover detail popup |
| `components/skill-tree/SVGConnections.tsx` | SVG connector lines |
| `components/skill-tree/SkillNode.tsx` | Individual tree node |
| `components/skill-tree/SubjectNode.tsx` | Subject-level tree node |
| `components/skill-tree/index.ts` | Re-exports |
| `components/skill-tree/skill-tree.module.css` | Tree-specific styles |
| `components/reading/BookBuddy.tsx` | AI reading companion chat |
| `components/reading/BookCard.tsx` | Book display card |
| `components/reading/index.ts` | Re-exports |
| `components/projects/ProjectDataChat.tsx` | Admin AI data extraction chat |
| `components/projects/StudentProjectCard.tsx` | Student project submission card |
| `components/student/TaskAssigner.tsx` | Objective assignment UI for admin |
| `components/trustjar/TrustJar.tsx` | Marble jar visualization |
| `components/trustjar/TrustJarStyles.css` | Jar-specific styles |
| `components/visionboard/VisionBoardGrid.tsx` | Board grid layout |
| `components/visionboard/CardRenderer.tsx` | Route to correct card component |
| `components/visionboard/CardCreatorSheet.tsx` | Card creation drawer |
| `components/visionboard/CardDetailSheet.tsx` | Card view/edit drawer |
| `components/visionboard/VisionBoardFAB.tsx` | Floating add button |
| `components/visionboard/AreaFilter.tsx` | Area filter tabs |
| `components/visionboard/PhIcon.tsx` | Phosphor icon wrapper |
| `components/visionboard/layout.ts` | Grid layout calculations |
| `components/visionboard/cards/CounterCard.tsx` | Counter card type |
| `components/visionboard/cards/HabitsCard.tsx` | Habits card type |
| `components/visionboard/cards/ImageHeroCard.tsx` | Image hero card type |
| `components/visionboard/cards/JournalCard.tsx` | Journal card type |
| `components/visionboard/cards/MiniTileCard.tsx` | Mini tile card type |
| `components/visionboard/cards/MotivationCard.tsx` | Motivation quote card |
| `components/visionboard/cards/ProgressCard.tsx` | Progress card type |
| `components/visionboard/cards/StreakCard.tsx` | Streak card type |
| `components/math/MathText.tsx` | LaTeX math renderer |
| **Pages** | |
| `pages/LoginPage.tsx` | Login form page |
| `pages/SetupPage.tsx` | First-run bootstrap page |
| `pages/student/StudentDashboard.tsx` | Student home: bento grid overview |
| `pages/student/EmotionCheckInPage.tsx` | Standalone check-in page |
| `pages/student/SprintPage.tsx` | Goals + habits + tasks |
| `pages/student/DeepWorkPage.tsx` | All domains overview |
| `pages/student/DomainDetailPage.tsx` | Single domain + skill tree |
| `pages/student/DiagnosticPage.tsx` | Diagnostic assessment runner |
| `pages/student/ReadingPage.tsx` | Book library + Book Buddy AI |
| `pages/student/ReviewPage.tsx` | Diagnostic history |
| `pages/student/TrustJarPage.tsx` | Student trust jar view |
| `pages/student/VisionBoardPage.tsx` | Personal vision board |
| `pages/student/CharacterPage.tsx` | Character profile (feature-flagged) |
| `pages/student/SettingsPage.tsx` | Account settings |
| `pages/admin/AdminDashboard.tsx` | Admin overview |
| `pages/admin/StudentsPage.tsx` | Student roster |
| `pages/admin/StudentDetailPage.tsx` | Per-student detailed view |
| `pages/admin/SprintsPage.tsx` | Sprint management + insights |
| `pages/admin/ObjectivesPage.tsx` | Curriculum management |
| `pages/admin/VivaQueuePage.tsx` | Viva + unlock request queue |
| `pages/admin/PresentationQueuePage.tsx` | Book presentation queue |
| `pages/admin/BooksPage.tsx` | Book library admin |
| `pages/admin/ProjectsPage.tsx` | Projects list |
| `pages/admin/ProjectDetailPage.tsx` | Project submissions + AI chat |
| `pages/admin/NormsPage.tsx` | Class norms / strikes |
| `pages/admin/CommentsPage.tsx` | Student feedback inbox |
| `pages/admin/CharacterCatalogPage.tsx` | Tarot card management |
| `pages/admin/TrustJarPage.tsx` | Admin trust jar controls |
| `pages/admin/SettingsPage.tsx` | User management |
| `pages/admin/index.ts` | Re-exports |
| **Hooks** | |
| `hooks/useAuth.tsx` | AuthProvider, useAuth, useSessionToken |
| `hooks/useVisionBoard.ts` | Vision board queries/mutations wrapper |
| `hooks/useDelayedLoading.ts` | Prevents flash for fast loads (<200ms) |
| `hooks/use-mobile.tsx` | Responsive breakpoint hook |
| **Lib** | |
| `lib/featureFlags.ts` | `STUDENT_CHARACTER_SYSTEM_ENABLED` |
| `lib/diagnostic.ts` | Client-side diagnostic data loading |
| `lib/utils.ts` | `cn()` (clsx + tailwind-merge) |
| `lib/emotions.ts` | Emotion category display helpers |
| `lib/character-utils.ts` | Character display formatting |
| `lib/domain-utils.tsx` | Domain color/icon helpers |
| `lib/skill-tree-utils.ts` | Skill tree layout calculations |
| `lib/horizontal-tree-utils.ts` | Horizontal tree layout |
| `lib/status-utils.ts` | Status label/color helpers for objective, goal, book statuses. Note: `BookStatus` here has 4 values ("reading"\|"completed"\|"presentation_requested"\|"presented") while `src/types/index.ts` only has 3 (missing "presentation_requested") — status-utils.ts is authoritative. |
| **Data & Types** | |
| `data/whatsNew.generated.ts` | Auto-generated changelog feed |
| `types/index.ts` | User, AuthContextType interfaces |
| **Styles** | |
| `styles/changelog.module.css` | Changelog modal styles |
| `styles/muse.module.css` | AI muse persona styles |

---

## Key Behavioral Flows (Summary)

### First-Time Setup
1. Navigate to `/setup`
2. `checkNeedsBootstrap()` returns true (no users)
3. Create admin account via `initializeAdmin()`
4. Create first student via `initializeStudent()`
5. Log in and seed data via `seed.seedAll()`

### Student Daily Routine
1. Navigate to app → `/login` → authenticate
2. Redirected to `/dashboard` → `DashboardLayout` → `CheckInGate`
3. Gate shows Palette of Presence
4. Select emotion(s) → journal (optional) → CONTINUE
5. `saveCheckIn()` called → `getTodayCheckIn` query updates → gate passes
6. Dashboard loads: bento grid with today's focus
7. Student works on tasks (SprintPage), objectives (DomainDetailPage), reading (ReadingPage)
8. Returns next day → gate requires new check-in

### Mastery Flow
1. Admin assigns objectives to student
2. Student works through activities in DomainDetailPage
3. Student requests diagnostic in DiagnosticPage
4. Takes quiz (V2 system) → submits results → `submitAttempt()` called
5. If pass (≥90%): mastered! Sub-objectives auto-completed. XP awarded.
6. If fail: student requests viva (`updateStatus("viva_requested")`), then requests unlock
7. Admin sees in VivaQueuePage, approves unlock
8. Student retakes within 24h window
9. Pass → mastered

---

*This document was generated by systematically reading every source file in the repository. For the absolute latest state of any individual module, consult the source file directly.*
