# Architecture Overview

## Purpose

Deep Work Tracker is a mindful learning companion designed for focused skill mastery. It provides students with a calm, flow-state-inducing interface for tracking their learning progress through emotion check-ins, goal setting, deep work sessions, and reading activities. Coaches (admins) get a functional dashboard to manage students, create learning objectives, and track progress.

**Primary users:**
- **Students** - Track daily emotions, work on assigned learning objectives, set sprint goals, and log reading
- **Coaches/Admins** - Manage students, create sprints, assign objectives, approve viva requests

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | React 19, TypeScript, Vite | Single-page app |
| **UI Components** | shadcn/ui (admin), Paper UI (student) | Dual design system |
| **Styling** | Tailwind CSS v4, CSS Modules | Custom pastel color palette |
| **Animation** | Framer Motion | Subtle, calming transitions |
| **Backend** | Convex (serverless) | Real-time, reactive queries |
| **Routing** | React Router v7 | Role-based protected routes |
| **Testing** | Vitest, Testing Library | Unit + component tests |
| **Hosting** | Netlify (frontend) | Convex handles backend |

## Project Structure

```
DW/
├── src/
│   ├── components/
│   │   ├── auth/           # Login form, protected routes
│   │   ├── deepwork/       # Domain cards, learning objective cards
│   │   ├── emotions/       # Emotion wheel, journal, check-in components
│   │   ├── layout/         # Sidebar, Header, DashboardLayout, AdminLayout, CheckInGate
│   │   ├── paper/          # Paper UI design system (student-facing)
│   │   ├── projects/       # Project cards, project data chat
│   │   ├── reading/        # Book cards, BookBuddy
│   │   ├── skill-tree/     # Visual skill tree (SVG connections, nodes)
│   │   ├── sprint/         # Goal editor, goal cards, habit tracker
│   │   ├── student/        # Task assigner
│   │   ├── trustjar/       # Trust jar marble animation
│   │   └── ui/             # shadcn components (admin-facing)
│   ├── hooks/
│   │   ├── useAuth.tsx     # Auth context + session management
│   │   └── use-mobile.tsx  # Mobile detection hook
│   ├── lib/
│   │   ├── utils.ts        # cn() helper, formatRelativeDate
│   │   ├── emotions.ts     # Emotion category utilities
│   │   ├── domain-utils.tsx # Domain icon/color helpers
│   │   ├── status-utils.ts # Status display utilities
│   │   └── skill-tree-utils.ts # Skill tree layout calculations
│   ├── pages/
│   │   ├── admin/          # Admin dashboard, students, objectives, viva queue, etc.
│   │   ├── student/        # Dashboard, check-in, sprint, deep work, reading
│   │   ├── LoginPage.tsx   # Login with bootstrap detection
│   │   └── SetupPage.tsx   # First admin creation
│   ├── styles/
│   │   └── muse.module.css # Special muse styling
│   ├── test/
│   │   └── setup.ts        # Vitest setup
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   ├── App.tsx             # Router + providers
│   ├── main.tsx            # Entry point
│   └── index.css           # Paper UI design tokens + global styles
│
├── convex/
│   ├── schema.ts           # Database schema (18 tables)
│   ├── auth.ts             # Login, sessions, bootstrap check
│   ├── users.ts            # User CRUD + batch management
│   ├── emotions.ts         # Check-in categories + daily check-ins
│   ├── sprints.ts          # Sprint CRUD
│   ├── goals.ts            # SMART goals
│   ├── habits.ts           # Habit tracking + completions
│   ├── domains.ts          # Learning domains
│   ├── objectives.ts       # Major + learning objectives + student assignments
│   ├── activities.ts       # Activity CRUD + progress
│   ├── progress.ts         # Progress summaries
│   ├── books.ts            # Reading library
│   ├── projects.ts         # 6-week project cycles
│   ├── projectLinks.ts     # Student project submissions
│   ├── projectReflections.ts # Student reflections
│   ├── trustJar.ts         # Trust jar state
│   ├── ai.ts               # AI integration (if any)
│   ├── utils.ts            # Shared Convex utilities
│   └── seed.ts             # Database seeding
│
├── public/                 # Static assets
├── docs/                   # Documentation (this folder)
└── mockup/                 # Design mockups
```

## Key Components

### Authentication (`src/hooks/useAuth.tsx`)
- **Purpose:** Manages user sessions using Convex backend
- **Pattern:** React Context + localStorage for token persistence
- **Key exports:** `AuthProvider`, `useAuth()`, `useSessionToken()`

### Layout System
- **DashboardLayout** (`src/components/layout/DashboardLayout.tsx`)
  - Wraps student pages with sidebar + header
  - Applies Paper UI aesthetic
- **AdminLayout** (`src/components/layout/AdminLayout.tsx`)
  - Wraps admin pages with functional sidebar
  - Uses shadcn components
- **CheckInGate** (`src/components/layout/CheckInGate.tsx`)
  - Enforces daily emotion check-in before accessing content

### Design Systems
- **Paper UI** (`src/components/paper/`)
  - Calm, ethereal components for students
  - Soft pastels, generous whitespace
  - Components: Button, Card, Input, Modal, Checkbox, Badge, ProgressBar
- **shadcn/ui** (`src/components/ui/`)
  - Functional, data-dense components for admins
  - Standard shadcn patterns

## Entry Points

| Entry Point | File | Description |
|-------------|------|-------------|
| App startup | `src/main.tsx` | Renders React app into DOM |
| Router | `src/App.tsx` | Defines all routes + providers |
| API layer | `convex/*.ts` | All backend queries/mutations |

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                            BROWSER                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐     ┌─────────────┐     ┌──────────────────────┐ │
│   │   React     │────▶│  Convex     │────▶│    Convex Cloud      │ │
│   │   Frontend  │◀────│  React      │◀────│    Backend           │ │
│   │             │     │  Client     │     │                      │ │
│   └─────────────┘     └─────────────┘     └──────────────────────┘ │
│         │                                           │               │
│         │                                           │               │
│   ┌─────▼─────┐                              ┌─────▼─────┐         │
│   │ localStorage│                             │ Convex DB │         │
│   │ (token)    │                             │ (18 tables)│         │
│   └───────────┘                              └───────────┘         │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

## Route Structure

### Student Routes (requires student role)
| Path | Component | Description |
|------|-----------|-------------|
| `/dashboard` | `StudentDashboard` | Bento grid with quick access cards |
| `/check-in` | `EmotionCheckInPage` | Daily emotion check-in |
| `/sprint` | `SprintPage` | Goals + habits |
| `/deep-work` | `DeepWorkPage` | Domain list |
| `/deep-work/:domainId` | `DomainDetailPage` | Objectives + activities |
| `/reading` | `ReadingPage` | Book library |
| `/trust-jar` | `TrustJarPage` | Marble jar (full screen) |

### Admin Routes (requires admin role)
| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | `AdminDashboard` | Stats + setup checklist |
| `/admin/students` | `StudentsPage` | Student CRUD |
| `/admin/students/:studentId` | `StudentDetailPage` | Individual student |
| `/admin/sprints` | `SprintsPage` | Sprint management |
| `/admin/projects` | `ProjectsPage` | 6-week projects |
| `/admin/objectives` | `ObjectivesPage` | Learning objectives |
| `/admin/viva` | `VivaQueuePage` | Viva approval queue |
| `/admin/presentations` | `PresentationQueuePage` | Book presentations |
| `/admin/books` | `BooksPage` | Book library CRUD |
| `/admin/trust-jar` | `AdminTrustJarPage` | Manage trust jar |

## External Dependencies

- **Convex Cloud** - Serverless backend (database + functions)
- **Google Fonts** - Cormorant Garamond + Lato typography
- **Lucide React** - Icon library (admin)
- **Phosphor Icons** - Icon library (alternate)
- **Framer Motion** - Animation library

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_CONVEX_URL` | Convex deployment URL (dev vs prod) |

**Important:** Two separate databases exist:
- **Dev:** `ardent-penguin-515` (local development)
- **Prod:** `greedy-marten-449` (deployed)
