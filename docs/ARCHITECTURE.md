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
  schema: convex/schema.ts (26 tables)
  functions: convex/*.ts (queries/mutations)
  actions: convex/ai.ts (external AI providers)
  |
  v
[Convex DB + external AI]
  tables + indexes
  Groq (Kimi K2, Llama 8B) / OpenRouter (fallback)
```

Why this shape:
- Convex handles real-time queries and simplified backend deployment.
- Actions are isolated in `convex/ai.ts` so external API calls do not block database reads.
- The front-end owns the UX complexity while keeping data rules in Convex functions.

## Project layout (what lives where)

```
DW/
  src/                          # React frontend (see CODEMAPS/frontend.md)
    App.tsx                     # Router, role-based guards
    main.tsx                    # React entrypoint
    components/                 # Feature-grouped UI components
    hooks/                      # useAuth, useVisionBoard, useDelayedLoading, use-mobile
    pages/                      # student/ and admin/ route pages
    lib/                        # Domain/status/emotion/diagnostic helpers
    types/                      # Temporary types (pre-Convex generated types)
  convex/                       # Convex backend (see CODEMAPS/backend.md)
    schema.ts                   # Database schema (26 tables)
    *.ts                        # Domain-specific queries/mutations/actions
    seed.ts                     # Data seeding (2841 lines)
  scripts/                      # Offline curriculum data tools (see CODEMAPS/scripts.md)
  docs/                         # Architecture + data model + patterns
    CODEMAPS/                   # High-level architecture maps
```

## Runtime entry points
- `src/main.tsx` mounts the React app.
- `src/App.tsx` wires providers and routes, including role-based protection.
- `convex/schema.ts` defines the tables and indexes used by all Convex functions.

## Routing (from `src/App.tsx`)

For the full route table, see [CODEMAPS/frontend.md](CODEMAPS/frontend.md#routing-map).

Key rules:
- Public: `/login` (redirects if authenticated), `/setup` (first-time bootstrap)
- Student routes: wrapped in `ProtectedRoute` + `DashboardLayout` (includes `CheckInGate`)
- Admin routes: wrapped in `ProtectedRoute` + `AdminLayout`

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
  - Companion manual workflow lives in `src/components/projects/StudentProjectCard.tsx` (inline add/edit/delete links + reflection edits).

- Profile settings (`src/pages/student/SettingsPage.tsx`, `src/pages/admin/SettingsPage.tsx`)
  - Why: Let users manage their own account photo without admin intervention.
  - Uses `api.auth.updateOwnProfile` to persist `users.avatarUrl` (URL-based images, including GIF links).

- Trust Jar (`src/components/trustjar/TrustJar.tsx`)
  - Why: Visual, physics-based shared reward mechanism.
  - Uses Matter.js for physics and `api.trustJar` queries/mutations for state.

- Vision Board (`src/pages/student/VisionBoardPage.tsx`, `src/hooks/useVisionBoard.ts`)
  - Why: Personal goal visualization with 8 card types (counter, streak, habits, progress, journal, etc.).
  - Uses `api.visionBoard` queries/mutations. Auto-seeds 5 preset life areas on first visit.
  - See [docs/CODEMAPS/vision-board.md](CODEMAPS/vision-board.md) for full details.

- Diagnostics (`src/pages/student/DiagnosticPage.tsx`, `src/lib/diagnostic.ts`)
  - Why: Fast-track mastery proof. Students take quizzes that auto-complete all work if passed.
  - Uses `api.diagnostics` for unlock/attempt lifecycle. Pre-built question sets loaded from `/diagnostic/diagnostic-sets.json`; question bank from `/diagnostic/diagnostic-data.json`. Set selection uses Convex attempt counting (`getAttemptCount`).
  - See [docs/CODEMAPS/diagnostics.md](CODEMAPS/diagnostics.md) for full details.

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
See `docs/CODEMAPS/INDEX.md` for detailed architecture maps of each subsystem.
