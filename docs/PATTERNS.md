# Patterns and Conventions

## Naming and structure

| Item | Convention | Example |
| --- | --- | --- |
| Components | PascalCase | `GoalChatPalette.tsx` |
| Hooks | `use*` camelCase | `useAuth.tsx` |
| Convex files | camelCase | `projectReflections.ts` |
| CSS modules | kebab-case | `sprint.module.css` |
| UI groups | feature folders | `components/reading/`, `pages/admin/` |

Preferred layout:

```
src/
  components/
  pages/
  hooks/
  lib/
  types/
convex/
  schema.ts
  <feature>.ts
```

Why: feature folders keep the UI and data logic aligned (a matching Convex file usually exists for a page or feature).

## TypeScript and import rules

### Type-only imports (required in Convex)
`verbatimModuleSyntax` requires explicit type imports in Convex files.

```ts
// Correct
import type { MutationCtx } from "./_generated/server";

// Incorrect
import { MutationCtx } from "./_generated/server";
```

### Do not annotate React returns with JSX.Element

```ts
// Correct
export function MyComponent() {
  return <div />;
}

// Incorrect
export function MyComponent(): JSX.Element {
  return <div />;
}
```

### Use generated Convex types when available

```ts
import type { Id } from "../../convex/_generated/dataModel";
```

`src/types/index.ts` is a temporary fallback and does not mirror the full schema.

## Data access patterns (Convex)

### Queries with conditional args

```ts
const data = useQuery(
  api.books.getCurrentlyReading,
  user ? { userId: user._id } : "skip"
);
```

- `undefined` means loading; `null` means no data.
- Always guard queries with `"skip"` when prerequisites are missing.

### Mutations and patching

```ts
const updateSprint = useMutation(api.sprints.update);
await updateSprint({ sprintId, name, endDate });
```

Convex mutations typically filter out `undefined` fields before patching. Follow that pattern in new mutations.

### Actions for external services

```ts
const response = await useAction(api.ai.libraryChat)(args);
```

Actions are used for AI calls because they can reach external APIs. Queries and mutations should stay data-only.

## Auth and routing

### Token handling
- Local storage key: `deep-work-tracker-token`.
- Auth provider: `src/hooks/useAuth.tsx`.

### Guarded routes

```tsx
<ProtectedRoute allowedRoles={["student"]}>
  <DashboardLayout />
</ProtectedRoute>
```

`ProtectedRoute` redirects by role and shows `LoadingSpinner` while `useAuth` resolves.

## UI patterns

### Dual design systems
- Student pages use Paper UI (`src/components/paper/`).
- Admin pages use shadcn UI (`src/components/ui/`).

Why: the student UI optimizes for calm focus; the admin UI optimizes for density and speed.

### Layout usage
- Student: `DashboardLayout` wraps routes and includes `CheckInGate`.
- Admin: `AdminLayout` provides a sidebar and header based on route.

### CSS and tokens
- Global tokens live in `src/index.css`.
- Page-specific styles use CSS modules (for example `src/pages/student/sprint.module.css`).
- `src/styles/muse.module.css` provides special AI-themed styling.

## AI response contracts

Several UI components parse structured JSON from AI actions. Keep these formats stable:

### Goal chat (`api.ai.chat`)
```text
```goal-ready
{ "goal": { ... }, "suggestedTasks": [ ... ] }
```
```

### Book Buddy (`api.ai.libraryChat`)
```text
```buddy-response
{ "message": "...", "suggestedReplies": [ ... ], "books": [ ... ] }
```
```

### Project data chat (`api.ai.projectDataChat`)
```text
```project-data
{ "students": [ ... ], "summary": "..." }
```
```

The UI falls back to plain text if parsing fails, so keep responses strict when updating prompts.

## State and status rules

- Use `api.progress.toggleActivity` to update activity completion; it recalculates `studentObjectives.status` and may adjust `studentMajorObjectives.status`.
- Use `api.objectives.updateStatus` to change major objective status (viva workflow).
- Use `api.books.updateStatus` to move `studentBooks` through reading/presentation states.

## Tests

- Runner: Vitest (`npm run test`, `npm run test:run`).
- Location: tests live next to source files (`*.test.ts` / `*.test.tsx`).

## Gotchas (project-specific)

- Two Convex deployments exist: dev `ardent-penguin-515`, prod `greedy-marten-449`. Always verify which database you are targeting.
- Use `import type` in Convex files; missing this breaks builds.
- Do not annotate React components with `JSX.Element` return types.
- Use `deep-work-tracker-token` for localStorage auth token (not `auth_token`).
- `studentObjectives.status` includes legacy values (`mastered`, `viva_requested`). Prefer `studentMajorObjectives` for viva/milestones.
- `studentBooks.status` treats `completed` as legacy and still feeds the presentation queue.
- Admin trust jar mutations require the admin session token passed as `adminToken`.
