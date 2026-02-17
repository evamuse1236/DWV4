# Patterns and Conventions

## Naming

- Components: PascalCase (`GoalChatPalette.tsx`)
- Hooks: `use*` camelCase (`useAuth.tsx`)
- Convex modules: camelCase (`projectReflections.ts`)

## TypeScript rules

1. Convex files must use `import type` where applicable.
2. React components should omit explicit `JSX.Element` return types.
3. Prefer generated Convex types (`convex/_generated/*`).

## Data access patterns

- Guard Convex queries with `"skip"` when prerequisites are missing.
- Keep side effects and status transitions in backend mutations.
- Keep external API calls inside actions, not mutations/queries.

## Auth and route conventions

- Local storage token key: `deep-work-tracker-token`
- Route gating uses `ProtectedRoute` and role checks.
- Student routes under `DashboardLayout` are check-in gated.

## UI conventions

- Student-facing components: `src/components/paper/`
- Admin-facing components: `src/components/ui/`
- Keep student interactions calm and low-friction.
- Keep admin interactions dense and high-signal.

## AI contracts

Do not break fenced response block names or expected shapes:
- `goal-ready`
- `buddy-response`
- `project-data`

## Status conventions

- Use `studentMajorObjectives` for authoritative major mastery status.
- Treat legacy `studentObjectives.status` values as compatibility state.

## Testing conventions

- Vitest for unit/component tests.
- Keep tests near source files.
- Use `src/__tests__/convex/` for backend mock-db logic tests.
