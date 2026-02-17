# Codebase Map

Last updated: 2026-02-17

Purpose: fast navigation to where behavior lives.

## Top-level

```text
src/      frontend (React + routes + UI)
convex/   backend (schema + queries/mutations/actions)
scripts/  offline data and maintenance tooling
public/   runtime static assets (includes diagnostic_v2)
docs/     architecture, operations, process documentation
```

## Frontend (`src/`)

### Entrypoints

- `src/main.tsx`
- `src/App.tsx`

### Layout and auth

- `src/components/layout/DashboardLayout.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/components/layout/CheckInGate.tsx`
- `src/components/auth/ProtectedRoute.tsx`

### Student pages

`src/pages/student/` includes dashboard, check-in, sprint, deep work, diagnostic, reading, trust jar, vision board, character, settings.

### Admin pages

`src/pages/admin/` includes dashboard, students, student detail, sprints, projects, project detail, objectives, viva queue, presentations, books, character, trust jar, settings.

### Shared logic

- `src/hooks/useAuth.tsx`
- `src/lib/diagnostic.ts`
- `src/lib/featureFlags.ts`

## Backend (`convex/`)

### Core contracts

- `convex/schema.ts`
- `convex/_generated/*`

### Domain modules

- Auth/users: `auth.ts`, `users.ts`
- Check-in + sprint + goals + habits: `emotions.ts`, `sprints.ts`, `goals.ts`, `habits.ts`
- Learning graph: `domains.ts`, `objectives.ts`, `activities.ts`, `progress.ts`
- Reading: `books.ts`
- Projects: `projects.ts`, `projectLinks.ts`, `projectReflections.ts`
- Diagnostics: `diagnostics.ts`
- Character systems: `character.ts`, `characterAwards.ts`
- AI: `ai.ts`, `chatLogs.ts`
- Setup/migrations: `seed.ts`, `migrations.ts`

## Route map (from `src/App.tsx`)

### Public

- `/login`
- `/setup`

### Student

- `/dashboard`, `/check-in`, `/sprint`, `/deep-work`, `/deep-work/:domainId`
- `/deep-work/diagnostic/:majorObjectiveId`
- `/reading`, `/trust-jar`, `/vision-board`, `/character`, `/settings`

### Admin

- `/admin`, `/admin/students`, `/admin/students/:studentId`
- `/admin/sprints`, `/admin/projects`, `/admin/projects/:projectId`
- `/admin/objectives`, `/admin/viva`, `/admin/presentations`
- `/admin/books`, `/admin/norms`, `/admin/comments`
- `/admin/character`, `/admin/trust-jar`, `/admin/settings`

## Runtime assets and generated data

- Diagnostic runtime data: `public/diagnostic_v2/mastery_data.json`
- In-app changelog data: `src/data/whatsNew.generated.ts`

## If you need to change...

1. Auth/session: `src/hooks/useAuth.tsx` and `convex/auth.ts`
2. Student gate/check-in: `CheckInGate.tsx` and `convex/emotions.ts`
3. Objective status propagation: `convex/progress.ts` and `convex/objectives.ts`
4. Diagnostics: `DiagnosticPage.tsx`, `src/lib/diagnostic.ts`, `convex/diagnostics.ts`
5. AI contracts: `convex/ai.ts` and consuming component
