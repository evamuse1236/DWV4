# Runbook

Last updated: 2026-02-17

Use this file for deployment, seeding, rollback, and production troubleshooting.

## Environments

| Env | Convex slug | Convex URL |
|---|---|---|
| Dev | `ardent-penguin-515` | `https://ardent-penguin-515.convex.cloud` |
| Prod | `greedy-marten-449` | `https://greedy-marten-449.convex.cloud` |

Frontend target is controlled by `VITE_CONVEX_URL`.

## Deployment sequence

When backend and frontend both changed:

```bash
npx convex deploy -y
git push origin master
npx convex logs --prod --history 50
```

Rule: deploy Convex before frontend code that calls new Convex functions.

## Changelog generation

In-app changelog source:
- Generator: `scripts/generate-whats-new.mjs`
- Output: `src/data/whatsNew.generated.ts`

Manual refresh:

```bash
npm run changelog:generate
```

## Setup and seeding

Initial setup happens via `/setup` using `seed:seedAll`.

Common seed commands:

```bash
npx convex run seed:seedMathFromPlaylist
npx convex run seed:seedMathFromPlaylist --prod
npx convex run seed:seedBrilliantCurriculum
npx convex run seed:seedBrilliantCurriculum --prod
npx convex run seed:seedReadingObjectives
```

Curriculum workflow is documented in `docs/curriculum/WORKFLOW.md`.

## Diagnostic V2 runtime data

- Runtime payload: `public/diagnostic_v2/mastery_data.json`
- Sync command: `npm run diagnostic:v2:sync`
- Pass policy is backend-defined in `convex/diagnostics.ts`

## Common failures

### Missing Convex function in production

Symptom: `Could not find public function for 'auth:<name>'`

Fix:

```bash
npx convex deploy -y
npx convex logs --prod --history 50
```

### Wrong database target

`npx convex run` uses dev by default.
Use `--prod` for production mutations.

### AI feature failures

Check Convex env vars:
- `GROQ_API_KEY` required for AI flows.
- `OPENROUTER_API_KEY` optional fallback.

## Rollback

### Frontend rollback

Use Netlify deploy history and republish the last known-good build.

### Convex rollback

Revert `convex/` to known-good commit and redeploy:

```bash
git log --oneline convex/
git checkout <good-commit> -- convex/
npx convex deploy -y
```

## Dashboards

- Convex dev: `https://dashboard.convex.dev/d/ardent-penguin-515`
- Convex prod: `https://dashboard.convex.dev/d/greedy-marten-449`
