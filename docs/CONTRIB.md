# Contributing to Deep Work Tracker

**Last Updated:** 2026-01-29

## Prerequisites

- Node.js (v20+)
- npm
- Convex CLI (`npx convex` -- bundled with the `convex` dependency)

## Environment Setup

1. Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd DW
npm install
```

2. Create `.env.local` with the dev Convex deployment:

```bash
# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=dev:ardent-penguin-515
VITE_CONVEX_URL=https://ardent-penguin-515.convex.cloud
```

The project has **two Convex databases** (see RUNBOOK.md for details):
- **Dev**: `ardent-penguin-515` -- used by `npx convex dev` and local frontend
- **Prod**: `greedy-marten-449` -- used by `npx convex deploy` and Netlify

3. Set Convex environment variables for AI features (set these in the Convex dashboard, not in `.env.local`):

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | Yes | Primary AI provider (Kimi K2, Llama 8B) |
| `OPENROUTER_API_KEY` | No | Fallback AI provider |

## Development Workflow

### Start Development

Run these two commands in separate terminals:

```bash
# Terminal 1: Convex dev server (syncs schema + functions to dev database)
npx convex dev

# Terminal 2: Vite dev server (frontend)
npm run dev
```

### First-Time Setup

After starting both servers, open the app in a browser. The first visit routes to `/setup` where you create the admin account and seed initial data (emotions, domains, books).

## Available Scripts

### npm scripts (package.json)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server with hot reload |
| `build` | `tsc -b && vite build` | Type-check then build for production |
| `lint` | `eslint .` | Run ESLint across the project |
| `test` | `vitest` | Run Vitest in watch mode |
| `test:run` | `vitest run` | Run Vitest once (CI-friendly) |
| `preview` | `vite preview` | Preview the production build locally |

### Convex CLI commands

| Command | Description |
|---------|-------------|
| `npx convex dev` | Start the Convex dev server (syncs to dev DB) |
| `npx convex deploy` | Deploy schema + functions to prod DB |
| `npx convex run <function>` | Run a mutation/action on dev DB |
| `npx convex run <function> --prod` | Run a mutation/action on prod DB |

### Seed functions (via `npx convex run`)

| Function | Description |
|----------|-------------|
| `seed:seedAll` | Seed emotions, domains, books (run from SetupPage) |
| `seed:seedStudents` | Create test student accounts |
| `seed:seedMathFromPlaylist` | Seed MYP Math curriculum from playlist mapping |
| `seed:seedBrilliantCurriculum` | Seed Brilliant.org activities |
| `seed:seedReadingObjectives` | Seed reading learning objectives |
| `seed:seedTestObjectives` | Seed test/demo objectives |
| `seed:seedTestActivities` | Seed test/demo activities |
| `seed:reseedBooks` | Re-seed the book library |
| `seed:assignAllObjectivesToStudent` | Assign all objectives to a student |
| `seed:assignReadingToAllStudents` | Assign reading objectives to all students |
| `seed:migrateCurriculum` | Run curriculum migration |

### Curriculum scripts (run with `npx tsx` or `node --experimental-strip-types`)

These scripts manage the `playlist_mapping.json` file and generate seed data. They live in `scripts/` and are documented in detail in `scripts/README.md`.

| Script | Description |
|--------|-------------|
| `generate-seed-data.ts` | Generate seed data blocks from `playlist_mapping.json` |
| `apply-generated-seed-block.ts` | Inject generated seed block into `convex/seed.ts` |
| `fix-metadata.ts` | Normalize activity metadata (titles, types) |
| `fill-empty-rows.ts` | Fill objectives with zero activities |
| `dedup-khan-academy.ts` | Deduplicate Khan Academy URLs across objectives |
| `distribute-brilliant-lessons.ts` | Distribute Brilliant.org lessons across objectives |
| `repair-playlist-mapping.ts` | Trim oversized lists, clean text, soft-dedupe URLs |
| `patch-mismatch-risk-rows.ts` | Targeted cleanup for mismatch-risk rows |
| `validate-playlist-mapping.ts` | Validate mapping against quality contract |
| `audit-playlist-mapping.ts` | Audit mapping for coverage gaps |
| `analyze-duplicates.ts` | Find duplicate URLs across objectives |
| `analyze-semantic-mismatches.ts` | Find semantically mismatched activities |

Example usage:

```bash
npx tsx scripts/generate-seed-data.ts
npx tsx scripts/validate-playlist-mapping.ts
```

## Curriculum Seeding Workflow

The full workflow for updating curriculum data (see `docs/curriculum/WORKFLOW.md`):

```
1. Edit config files (chapter-assignment-config.json, ka-new-content-config.json)
2. Repair + normalize:     npx tsx scripts/repair-playlist-mapping.ts
3. Validate:               npx tsx scripts/validate-playlist-mapping.ts
4. Generate seed data:     npx tsx scripts/generate-seed-data.ts
5. Review output:          scripts/generated-seed-block.ts
6. Apply to seed file:     npx tsx scripts/apply-generated-seed-block.ts
7. Run seed on dev:        npx convex run seed:seedMathFromPlaylist
8. Run seed on prod:       npx convex run seed:seedMathFromPlaylist --prod
```

## Testing

Tests use **Vitest** with **jsdom** environment and **React Testing Library**.

```bash
# Watch mode (re-runs on file changes)
npm test

# Single run (for CI or pre-commit checks)
npm run test:run
```

Test configuration is in `vite.config.ts` under the `test` key. Setup file: `src/test/setup.ts`.

Test files live alongside source code:
- Component tests: `src/**/*.test.tsx`
- Utility tests: `src/**/*.test.ts`

See `docs/TEST-PLAN.md` for the full test plan and priorities.

## TypeScript Rules

**Convex files** (`convex/*.ts`):
- Use `import type` for type-only imports (required by `verbatimModuleSyntax`)
- Example: `import type { MutationCtx } from "./_generated/server";`

**React components**:
- Omit the return type (do not use `JSX.Element`)
- Example: `export function MyComponent() {`

## Project Structure

```
DW/
  src/                    # React frontend
    App.tsx               # Router + providers
    main.tsx              # React entrypoint
    components/           # UI components (paper/ for students, ui/ for admin)
    hooks/                # Custom hooks (useAuth, useVisionBoard, etc.)
    pages/                # Route pages (student/, admin/)
    lib/                  # Utility helpers
  convex/                 # Convex backend
    schema.ts             # Database schema (26 tables)
    seed.ts               # Seed data functions
    ai.ts                 # AI actions (Groq/OpenRouter)
    *.ts                  # Domain-specific queries/mutations
  scripts/                # Curriculum data management tools
  docs/                   # Architecture + guides + codemaps
    CODEMAPS/             # High-level architecture maps
    curriculum/           # Curriculum mapping documentation
```

## Related Documentation

| Doc | Purpose |
|-----|---------|
| [README.md](./README.md) | Documentation index |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture |
| [DATA-MODEL.md](./DATA-MODEL.md) | Database schema reference |
| [COMPONENTS.md](./COMPONENTS.md) | Component lookup |
| [PATTERNS.md](./PATTERNS.md) | Code conventions |
| [TEST-PLAN.md](./TEST-PLAN.md) | Test plan and priorities |
| [CODEMAPS/INDEX.md](./CODEMAPS/INDEX.md) | Architecture maps |
| [RUNBOOK.md](./RUNBOOK.md) | Deployment and operations |
