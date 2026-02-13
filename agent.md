# Agent Operating Notes

## Deployment Sync Rule

If frontend changes call a new Convex public function, deploy Convex to production before validating the frontend.

## Required Production Steps

```bash
# 1) Deploy Convex backend functions/schema
npx convex deploy -y

# 2) Deploy frontend from latest master
git push origin master

# 3) Check production logs for missing functions
npx convex logs --prod --history 50
```

## Failure Signature

If logs show:

`Could not find public function for 'auth:<functionName>'`

then production frontend is ahead of production Convex backend. Deploy Convex and re-check.

## Quick Verification

1. Confirm remote commit contains both frontend and `convex/` changes.
2. Confirm Convex prod deploy completed successfully.
3. Hard refresh browser (`Ctrl+Shift+R`) and retest.

## Changelog Freshness Rule

The in-app top-right "What's New" panel must be regenerated from git history on every run.

- Generator: `scripts/generate-whats-new.mjs`
- Output: `src/data/whatsNew.generated.ts`
- Enforced by npm lifecycle hooks:
  - `predev` runs before `npm run dev`
  - `prebuild` runs before `npm run build`

If entries look stale, run:

```bash
npm run changelog:generate
```
