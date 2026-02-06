# Runbook -- Deep Work Tracker

**Last Updated:** 2026-02-06

## Environments

| Environment | Convex Slug | Convex URL | Used By |
|-------------|-------------|------------|---------|
| Dev | `ardent-penguin-515` | `https://ardent-penguin-515.convex.cloud` | `npx convex dev`, local frontend |
| Prod | `greedy-marten-449` | `https://greedy-marten-449.convex.cloud` | `npx convex deploy`, Netlify |

The frontend environment variable `VITE_CONVEX_URL` determines which database the browser connects to:
- `.env.local` points to dev (`ardent-penguin-515`)
- `.env.production` points to prod (`greedy-marten-449`)

## Deployment

### Frontend (Netlify)

The frontend is deployed via **Netlify**. Configuration lives in `.netlify/netlify.toml`.

- **Build command:** `npm run build` (runs `tsc -b && vite build`)
- **Publish directory:** `dist/`
- **Build trigger:** Pushes to the main branch trigger a Netlify build automatically

Netlify uses `.env.production` during the build, so the deployed frontend connects to the **prod Convex database**.

### Backend (Convex)

Convex functions and schema are deployed separately from the frontend.

```bash
# Deploy to prod (schema + all functions)
npx convex deploy
```

This pushes the contents of `convex/` (schema, queries, mutations, actions) to the prod deployment (`greedy-marten-449`).

**Important:** `npx convex deploy` is separate from Netlify. You must deploy Convex changes before (or alongside) frontend changes that depend on new schema or functions.

### Full Deployment Sequence

When both backend and frontend changes are needed:

```bash
# 1. Deploy Convex backend to prod
npx convex deploy

# 2. Push to main branch (triggers Netlify build)
git push origin master
```

If only Convex functions changed (no frontend changes), just run `npx convex deploy`.
If only frontend changed (no schema/function changes), just push to master.

## Seeding Data

### Initial Setup (new database)

After deploying to a fresh Convex environment:

1. Open the app in a browser -- it will route to `/setup`
2. Create the admin account
3. The setup page calls `seed:seedAll` which seeds emotions, domains, and books

### Seeding Curriculum

Curriculum data is seeded via Convex mutations. Always be explicit about which database you are targeting.

```bash
# Seed MYP Math curriculum to DEV
npx convex run seed:seedMathFromPlaylist

# Seed MYP Math curriculum to PROD
npx convex run seed:seedMathFromPlaylist --prod

# Seed Brilliant.org activities to DEV
npx convex run seed:seedBrilliantCurriculum

# Seed Brilliant.org activities to PROD
npx convex run seed:seedBrilliantCurriculum --prod
```

Other useful seed functions:

```bash
# Seed reading objectives
npx convex run seed:seedReadingObjectives

# Assign all objectives to a specific student
npx convex run seed:assignAllObjectivesToStudent '{"studentId": "<student_id>"}'

# Re-seed book library
npx convex run seed:reseedBooks
```

### Updating Curriculum Data

When curriculum content changes (new activities, updated mappings):

```bash
# 1. Run curriculum scripts locally (modifies playlist_mapping.json)
npx tsx scripts/repair-playlist-mapping.ts
npx tsx scripts/validate-playlist-mapping.ts

# 2. Regenerate seed data
npx tsx scripts/generate-seed-data.ts

# 3. Inject into seed file
npx tsx scripts/apply-generated-seed-block.ts

# 4. Deploy updated seed function
npx convex deploy

# 5. Run the seed mutation on prod
npx convex run seed:seedMathFromPlaylist --prod
```

## Diagnostic Question Sets

Pre-built sets: 10 per module group, 30 questions each, deterministic (same set index = same questions). Set selection: `attemptCount % 10` via Convex `getAttemptCount`. See [CODEMAPS/diagnostics.md](./CODEMAPS/diagnostics.md) for architecture details.

**Rebuilding after question bank changes:**

```bash
# 1. Rebuild data.js + data-sets.js from raw Eedi data
cd diagnostic-check && python tools/build_ka_diagnostic.py && cd ..

# 2. Export to public/diagnostic/ for the frontend
node scripts/export-diagnostic-data.mjs

# 3. Verify: public/diagnostic/diagnostic-sets.json should have 70 sets, 30 questions each
```

Sets reference question IDs from `data.js`. If the question bank changes, sets must be regenerated.

## Common Issues and Fixes

### "Already seeded" message from seedAll

**Symptom:** `seed:seedAll` returns `{ success: true, message: "Already seeded" }`.

**Cause:** The function checks for existing emotion categories before seeding. If they exist, it skips.

**Fix:** This is expected behavior. The function is idempotent -- it only seeds once. If you need to re-seed, you must clear the relevant tables first via the Convex dashboard.

### AI features not working

**Symptom:** AI chat returns an error about missing API keys.

**Cause:** `GROQ_API_KEY` (and optionally `OPENROUTER_API_KEY`) are not set in the Convex environment.

**Fix:** Set the keys in the Convex dashboard (Settings > Environment Variables) for the target deployment:
1. Go to https://dashboard.convex.dev
2. Select the deployment (dev or prod)
3. Settings > Environment Variables
4. Add `GROQ_API_KEY` (required) and `OPENROUTER_API_KEY` (optional fallback)

### Frontend connects to wrong database

**Symptom:** Data appears in dev but not in production (or vice versa).

**Cause:** `VITE_CONVEX_URL` in the active environment file points to the wrong deployment.

**Fix:** Check which env file is active:
- Local dev: `.env.local` should point to `ardent-penguin-515`
- Production build: `.env.production` should point to `greedy-marten-449`

### Convex function runs on wrong database

**Symptom:** You ran `npx convex run seed:seedMathFromPlaylist` but data appeared in dev instead of prod.

**Cause:** Without `--prod`, `npx convex run` targets the dev deployment.

**Fix:** Always use the `--prod` flag when targeting production:

```bash
npx convex run seed:seedMathFromPlaylist --prod
```

### TypeScript build errors in Convex files

**Symptom:** `tsc` errors about imports in `convex/*.ts` files.

**Cause:** Convex files require `import type` for type-only imports due to `verbatimModuleSyntax`.

**Fix:** Change value imports to type imports:

```typescript
// Wrong
import { MutationCtx } from "./_generated/server";

// Correct
import type { MutationCtx } from "./_generated/server";
```

### Seed function exceeds Convex mutation size limits

**Symptom:** Running a seed mutation fails with a size or timeout error.

**Cause:** `convex/seed.ts` is very large (~2800+ lines). Some seed functions insert many rows in a single mutation.

**Fix:** Run the seed function again -- most seed functions are designed to skip already-seeded data. If it consistently fails, check the Convex dashboard logs for the specific error and consider running in smaller batches.

## Rollback Procedures

### Rolling Back Frontend (Netlify)

1. Go to the Netlify dashboard
2. Navigate to Deploys
3. Find the previous working deploy
4. Click "Publish deploy" on that version

This instantly switches the live site to the previous build without requiring a new git push.

### Rolling Back Convex Backend

Convex does not have a built-in deploy rollback. To revert:

```bash
# 1. Revert the code to the previous working state
git log --oneline convex/   # find the good commit
git checkout <good-commit> -- convex/

# 2. Redeploy the reverted code
npx convex deploy

# 3. Clean up (commit the revert or reset)
git checkout master -- convex/   # if you want to undo the local checkout
```

**Important:** Convex schema changes are forward-only for indexes and table definitions. If you added a new table or index, reverting the code will not remove it from the database. To remove tables/indexes, you must update the schema explicitly.

### Rolling Back Data (Seed Mutations)

Seed mutations are generally **additive** -- they insert new rows but do not delete existing ones. If bad data was seeded:

1. Open the Convex dashboard for the target deployment
2. Navigate to the affected table(s)
3. Manually delete or fix the problematic rows
4. Re-run the corrected seed function

There is no automated "undo seed" mechanism.

## Monitoring

### Convex Dashboard

- **Dev:** https://dashboard.convex.dev/d/ardent-penguin-515
- **Prod:** https://dashboard.convex.dev/d/greedy-marten-449

The dashboard provides:
- Function logs (queries, mutations, actions)
- Table browser (view and edit data)
- Schema viewer
- Environment variable management
- Usage metrics

### Netlify Dashboard

The Netlify dashboard shows:
- Deploy history and status
- Build logs
- Site analytics

## Environment Variable Reference

### Vite (frontend, `.env.local` / `.env.production`)

| Variable | Description |
|----------|-------------|
| `CONVEX_DEPLOYMENT` | Convex deployment slug (dev only, used by `npx convex dev`) |
| `VITE_CONVEX_URL` | Convex cloud URL the frontend connects to |
| `VITE_CONVEX_SITE_URL` | Convex HTTP actions endpoint (dev only) |

### Convex (set in Convex dashboard, not in files)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes (for AI) | Groq API key for Kimi K2 / Llama models |
| `OPENROUTER_API_KEY` | No | OpenRouter API key (fallback AI provider) |
