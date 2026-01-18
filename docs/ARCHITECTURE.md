# Architecture Overview

## What this is
Deep Work Tracker is a student-facing learning companion with an admin coaching console. The student experience is calm and flow-focused (daily check-in, sprint goals, deep work objectives, reading), while the admin experience is dense and operational (students, sprints, objectives, queues, projects). The architecture intentionally splits the UI and data flows to keep those experiences distinct while sharing the same Convex backend.

## System shape

```
[Browser]
  React 19 + React Router 7
  Vite app (src/main.tsx -> src/App.tsx)
  |
  | ConvexReactClient + useQuery/useMutation/useAction
  v
[Convex backend]
  schema: convex/schema.ts (23 tables)
  functions: convex/*.ts (queries/mutations)
  actions: convex/ai.ts (external AI providers)
  |
  v
[Convex DB + external AI]
  tables + indexes
  Groq / OpenRouter (AI actions)
```

Why this shape:
- Convex handles real-time queries and simplified backend deployment.
- Actions are isolated in `convex/ai.ts` so external API calls do not block database reads.
- The front-end owns the UX complexity while keeping data rules in Convex functions.

## Project layout (what lives where)

```
DW/
  src/
    App.tsx                     # Router, role-based guards
    main.tsx                    # React entrypoint
    components/
      auth/                     # ProtectedRoute/PublicOnlyRoute, LoginForm
      layout/                   # DashboardLayout, AdminLayout, CheckInGate
      paper/                    # Student UI system
      ui/                       # Admin UI system (shadcn)
      sprint/                   # GoalChatPalette, GoalEditor, HabitTracker
      reading/                  # BookBuddy, BookCard
      projects/                 # ProjectDataChat
      trustjar/                 # TrustJar (Matter.js physics)
      skill-tree/               # SkillTreeCanvas, nodes, connections
      deepwork/                 # DomainCard, LearningObjectiveCard
    hooks/                      # useAuth, use-mobile
    pages/
      student/                  # Student routes
      admin/                    # Admin routes
    lib/                        # Domain/status/emotion helpers
    types/                      # Temporary types (pre-Convex generated types)
  convex/
    schema.ts                   # Database schema (23 tables)
    auth.ts                     # Auth + sessions
    users.ts                    # Student/admin queries
    emotions.ts                 # Check-in data
    sprints.ts                  # Sprint lifecycle
    goals.ts                    # Goals + action items
    habits.ts                   # Habit tracking
    domains.ts                  # Learning domains
    objectives.ts               # Major/sub objectives + assignments
    activities.ts               # Objective activities
    progress.ts                 # Activity completion + status updates
    books.ts                    # Reading library
    projects.ts                 # 6-week projects
    projectLinks.ts             # Project submissions
    projectReflections.ts       # Project reflections
    trustJar.ts                 # Trust jar state
    ai.ts                       # AI actions (goal chat, book buddy, project data)
    seed.ts                     # Initial data seeding
  docs/                         # Architecture + data model + patterns
```

## Runtime entry points
- `src/main.tsx` mounts the React app.
- `src/App.tsx` wires providers and routes, including role-based protection.
- `convex/schema.ts` defines the tables and indexes used by all Convex functions.

## Routing (from `src/App.tsx`)

### Public
| Path | Component | Notes |
| --- | --- | --- |
| `/login` | `src/pages/LoginPage.tsx` | Redirects to dashboards when already authenticated |
| `/setup` | `src/pages/SetupPage.tsx` | First-time admin bootstrap + seed |

### Student (role: student)
| Path | Component | Notes |
| --- | --- | --- |
| `/dashboard` | `src/pages/student/StudentDashboard.tsx` | Primary student landing |
| `/check-in` | `src/pages/student/EmotionCheckInPage.tsx` | Check-in view (also enforced by gate) |
| `/sprint` | `src/pages/student/SprintPage.tsx` | Goals and habits |
| `/deep-work` | `src/pages/student/DeepWorkPage.tsx` | Domain list |
| `/deep-work/:domainId` | `src/pages/student/DomainDetailPage.tsx` | Objectives + activities |
| `/reading` | `src/pages/student/ReadingPage.tsx` | Library + Book Buddy |
| `/trust-jar` | `src/pages/student/TrustJarPage.tsx` | Full-screen jar view (outside layout) |

### Admin (role: admin)
| Path | Component | Notes |
| --- | --- | --- |
| `/admin` | `src/pages/admin/AdminDashboard.tsx` | Admin landing |
| `/admin/students` | `src/pages/admin/StudentsPage.tsx` | Student list |
| `/admin/students/:studentId` | `src/pages/admin/StudentDetailPage.tsx` | Student detail |
| `/admin/sprints` | `src/pages/admin/SprintsPage.tsx` | Sprint management |
| `/admin/projects` | `src/pages/admin/ProjectsPage.tsx` | Projects list |
| `/admin/projects/:projectId` | `src/pages/admin/ProjectDetailPage.tsx` | Project detail |
| `/admin/objectives` | `src/pages/admin/ObjectivesPage.tsx` | Objective management |
| `/admin/viva` | `src/pages/admin/VivaQueuePage.tsx` | Viva queue |
| `/admin/presentations` | `src/pages/admin/PresentationQueuePage.tsx` | Reading presentations |
| `/admin/books` | `src/pages/admin/BooksPage.tsx` | Library management |
| `/admin/trust-jar` | `src/pages/admin/TrustJarPage.tsx` | Jar controls |

## Key UI subsystems (why they exist)

- Auth and routing (`src/hooks/useAuth.tsx`, `src/components/auth/ProtectedRoute.tsx`)
  - Why: Single source of session truth and predictable redirects for role-based UX.
  - Uses localStorage key `deep-work-tracker-token` and `api.auth.getCurrentUser`.

- Check-in gate (`src/components/layout/CheckInGate.tsx`)
  - Why: The product requires a daily emotional check-in before other student activity.
  - Uses `api.emotions.getTodayCheckIn` to gate and `api.emotions.saveCheckIn` to persist.

- Dual design system (`src/components/paper/` vs `src/components/ui/`)
  - Why: Students need a calm, spacious interface; admins need dense, functional UI.
  - Student pages prefer Paper UI. Admin pages prefer shadcn components.

- Sprint goal AI (`src/components/sprint/GoalChatPalette.tsx`)
  - Why: Convert short conversations into SMART goals and suggested tasks.
  - Uses `api.ai.chat` action and expects a `goal-ready` JSON block.

- Book Buddy AI (`src/components/reading/BookBuddy.tsx`)
  - Why: Personalized reading recommendations from available books + history.
  - Uses `api.ai.libraryChat` action and expects a `buddy-response` JSON block.

- Project data AI (`src/components/projects/ProjectDataChat.tsx`)
  - Why: Reduce admin data entry by extracting links/reflections from chat.
  - Uses `api.ai.projectDataChat` action and expects a `project-data` JSON block.

- Trust Jar (`src/components/trustjar/TrustJar.tsx`)
  - Why: Visual, physics-based shared reward mechanism.
  - Uses Matter.js for physics and `api.trustJar` queries/mutations for state.

## Backend design (why it is organized this way)

- Domain-based files in `convex/` align to UI features (emotions, sprints, goals, projects).
- `convex/objectives.ts` keeps major/sub objective logic together to maintain consistent status rules.
- `convex/progress.ts` centralizes activity completion so status updates are not duplicated in the UI.
- `convex/ai.ts` is isolated to actions to keep network calls separate from pure data reads/writes.
- `convex/seed.ts` enables bootstrapping from `SetupPage` and local test data.

## Configuration and environments

- `VITE_CONVEX_URL` (frontend) points at the Convex deployment used by the React client.
- Convex uses two deployments:
  - Dev: `ardent-penguin-515` (local `npx convex dev`)
  - Prod: `greedy-marten-449` (`npx convex deploy`)

## Architecture gotchas

- The student check-in gate runs inside `DashboardLayout`, so all student routes under that layout are blocked until a check-in exists for today.
- The trust jar admin mutations require the session token (admin token) from localStorage, not a server-side admin flag.
- AI features are actions and require Convex environment variables (`GROQ_API_KEY`, `OPENROUTER_API_KEY`).

See `docs/DATA-MODEL.md` and `docs/PATTERNS.md` for schema and coding conventions.
