# Project Notes

## Convex Database

This project has **two separate databases**:
- **Dev**: `ardent-penguin-515` (used by `npx convex dev` and local development)
- **Prod**: `greedy-marten-449` (used by `npx convex deploy`)

- **Local dev** uses the dev database (see `VITE_CONVEX_URL` in `.env.local`)
- **Students (deployed app)** use the **prod database** (see `.env.production`)

When running Convex mutations:
- `npx convex run <function>` → runs on **dev**
- `npx convex run <function> --prod` → runs on **prod**

Always check which database you're targeting before running mutations!

## TypeScript Build Rules

**Convex files** (`convex/*.ts`):
- Use `import type` for type-only imports (required by `verbatimModuleSyntax`)
- Example: `import type { MutationCtx } from "./_generated/server";`
- NOT: `import { MutationCtx } from "./_generated/server";`

**React components**:
- Don't use `JSX.Element` return type - just omit the return type
- Example: `export function MyComponent() {` NOT `export function MyComponent(): JSX.Element {`

**Auth token key**:
- The localStorage key is `"deep-work-tracker-token"` (not `"auth_token"`)
