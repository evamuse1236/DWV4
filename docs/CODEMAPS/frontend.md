# Frontend Codemap

**Last Updated:** 2026-01-30
**Framework:** React 19 + Vite 7 + TypeScript 5.9
**Entry Point:** `src/main.tsx` -> `src/App.tsx`

## Directory Structure

```
src/
  main.tsx                  # React root mount
  App.tsx                   # ConvexProvider, AuthProvider, BrowserRouter, all routes
  index.css                 # Global styles, CSS variables, Tailwind base

  pages/
    LoginPage.tsx           # Public login form
    SetupPage.tsx           # First-time bootstrap (create admin + seed)
    student/                # Student-only pages (guarded by role)
      StudentDashboard.tsx
      EmotionCheckInPage.tsx
      SprintPage.tsx
      DeepWorkPage.tsx
      DomainDetailPage.tsx
      DiagnosticPage.tsx
      ReadingPage.tsx
      TrustJarPage.tsx
      VisionBoardPage.tsx
    admin/                  # Admin-only pages (guarded by role)
      AdminDashboard.tsx
      StudentsPage.tsx
      StudentDetailPage.tsx
      SprintsPage.tsx
      ProjectsPage.tsx
      ProjectDetailPage.tsx
      ObjectivesPage.tsx
      VivaQueuePage.tsx
      PresentationQueuePage.tsx
      BooksPage.tsx
      TrustJarPage.tsx
      index.ts              # Re-exports all admin pages

  components/
    auth/                   # ProtectedRoute, PublicOnlyRoute, LoginForm
    layout/                 # DashboardLayout, AdminLayout, Sidebar, Header, CheckInGate, Changelog
    paper/                  # Student UI system (Button, Card, Input, Modal, Checkbox, Badge, ProgressBar, LoadingSpinner)
    ui/                     # Admin UI system (shadcn: button, card, dialog, input, select, tabs, table, etc.)
    sprint/                 # GoalChatPalette, GoalEditor, GoalCard, HabitTracker
    deepwork/               # DomainCard, LearningObjectiveCard
    reading/                # BookBuddy, BookCard
    emotions/               # EmotionWheel, EmotionCard, EmotionHistory, EmotionJournal
    skill-tree/             # SkillTreeCanvas, HorizontalTreeCanvas, SkillNode, SubjectNode, SVGConnections, ObjectivePopover
    projects/               # ProjectDataChat, StudentProjectCard
    trustjar/               # TrustJar (Matter.js physics jar)
    visionboard/            # VisionBoardGrid, VisionBoardFAB, CardCreatorSheet, CardDetailSheet, AreaFilter, CardRenderer, PhIcon
      cards/                # CounterCard, HabitsCard, ImageHeroCard, JournalCard, MiniTileCard, MotivationCard, ProgressCard, StreakCard
    student/                # TaskAssigner

  hooks/
    useAuth.tsx             # AuthProvider context, login/logout, useSessionToken
    useVisionBoard.ts       # Vision board CRUD, area seeding, card interactions
    useDelayedLoading.ts    # Prevent skeleton flash (200ms threshold)
    use-mobile.tsx          # Mobile viewport detection

  lib/
    diagnostic.ts           # Diagnostic quiz types, data loader, pre-built set selection
    domain-utils.tsx        # Domain icons (SVG), colors, descriptions
    emotions.ts             # Emotion category/subcategory helpers
    status-utils.ts         # Status badge configs for objectives, goals, books
    skill-tree-utils.ts     # Skill tree layout calculations
    horizontal-tree-utils.ts # Horizontal tree layout calculations
    utils.ts                # General utilities (cn, etc.)

  types/
    index.ts                # Frontend type definitions (User, Goal, Objective, Book, etc.)

  styles/
    muse.module.css         # Muse persona styling
```

## Routing Map

### Provider Stack (wraps all routes)
```
ConvexProvider
  AuthProvider
    TooltipProvider
      BrowserRouter
```

### Public Routes
| Path | Page | Guard |
|------|------|-------|
| `/login` | `LoginPage` | `PublicOnlyRoute` (redirects if already logged in) |
| `/setup` | `SetupPage` | None |
| `/` | Redirect to `/login` | None |

### Student Routes (role: `student`)
All wrapped in `ProtectedRoute` + `DashboardLayout` (which includes `CheckInGate`).

| Path | Page |
|------|------|
| `/dashboard` | `StudentDashboard` |
| `/check-in` | `EmotionCheckInPage` |
| `/sprint` | `SprintPage` |
| `/deep-work` | `DeepWorkPage` |
| `/deep-work/:domainId` | `DomainDetailPage` |
| `/deep-work/diagnostic/:majorObjectiveId` | `DiagnosticPage` |
| `/reading` | `ReadingPage` |
| `/trust-jar` | `TrustJarPage` |
| `/vision-board` | `VisionBoardPage` |

### Admin Routes (role: `admin`)
All wrapped in `ProtectedRoute` + `AdminLayout`.

| Path | Page |
|------|------|
| `/admin` | `AdminDashboard` |
| `/admin/students` | `StudentsPage` |
| `/admin/students/:studentId` | `StudentDetailPage` |
| `/admin/sprints` | `SprintsPage` |
| `/admin/projects` | `ProjectsPage` |
| `/admin/projects/:projectId` | `ProjectDetailPage` |
| `/admin/objectives` | `ObjectivesPage` |
| `/admin/viva` | `VivaQueuePage` |
| `/admin/presentations` | `PresentationQueuePage` |
| `/admin/books` | `BooksPage` |
| `/admin/trust-jar` | `AdminTrustJarPage` |

## Auth Flow

```
1. User loads app
2. AuthProvider reads localStorage("deep-work-tracker-token")
3. If token exists -> useQuery(api.auth.getCurrentUser, { token })
4. If user returned -> set user state (with role)
5. ProtectedRoute checks user.role against allowedRoles
6. DashboardLayout renders CheckInGate for students
7. CheckInGate queries api.emotions.getTodayCheckIn
   - If null -> force emotion check-in
   - If exists -> render child routes
```

## Dual Design System

**Paper UI** (`src/components/paper/`) -- used by student pages:
- Calm, spacious aesthetic
- Glass/blur card effects
- Custom components: Button, Card, Input, Modal, Checkbox, Badge, ProgressBar, LoadingSpinner
- Test files co-located

**shadcn/ui** (`src/components/ui/`) -- used by admin pages:
- Dense, functional interface
- Standard Radix-based components
- Components: button, card, dialog, input, select, tabs, table, badge, avatar, skeleton, sonner, etc.

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2 | UI library |
| convex | 1.31 | Real-time backend client |
| react-router-dom | 7.12 | Client-side routing |
| framer-motion | 12.25 | Animations |
| matter-js | 0.20 | Trust Jar physics |
| @phosphor-icons/react | 2.1 | Icon library |
| tailwindcss | 4.1 | Styling |
| lucide-react | 0.562 | Additional icons |
| cmdk | 1.1 | Command palette |
| sonner | 2.0 | Toast notifications |
