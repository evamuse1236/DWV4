# Operations

Purpose: daily setup, deployment safety, rollback, and verification.

## Local setup

1. `npm install`
2. Create `.env.local` with:
   - `CONVEX_DEPLOYMENT=dev:ardent-penguin-515`
   - `VITE_CONVEX_URL=https://ardent-penguin-515.convex.cloud`
3. Terminal A: `npx convex dev`
4. Terminal B: `npm run dev`

First-time setup flow uses `/setup`.

## High-value commands

- `npm run lint`
- `npm run test:run`
- `npm run build`
- `npx convex deploy -y`
- `npm run changelog:generate`

## Deployment order

When backend and frontend both change:
1. Deploy Convex first: `npx convex deploy -y`
2. Push frontend changes.
3. Verify logs: `npx convex logs --prod --history 50`

Reason: frontend must not call functions that are missing in production backend.

## Rollback

- Frontend: republish previous Netlify deploy.
- Convex: restore prior `convex/` commit, then redeploy Convex.

## AI environment vars (Convex dashboard)

- `GROQ_API_KEY` (required)
- `OPENROUTER_API_KEY` (optional fallback)

## Curriculum maintenance workflow

1. `node --experimental-strip-types scripts/repair-playlist-mapping.ts`
2. `node --experimental-strip-types scripts/validate-playlist-mapping.ts`
3. Optional:
   - `node --experimental-strip-types scripts/analyze-semantic-mismatches.ts`
   - `node --experimental-strip-types scripts/patch-mismatch-risk-rows.ts`
4. `node --experimental-strip-types scripts/generate-seed-data.ts`
5. `node --experimental-strip-types scripts/apply-generated-seed-block.ts`
6. Seed Convex:
   - `npx convex run seed:seedMathFromPlaylist`
   - `npx convex run seed:seedPypMathFromPlaylist`

Generated curriculum reports are written under `docs/curriculum/`.

## Pre-ship verification

1. `npm run lint`
2. `npm run test:run`
3. `npm run build`
4. Manual sanity pass on:
   - Login and role routing
   - Check-in gating
   - Diagnostic attempt submit flow
   - Admin queue actions (viva, reading, comments)
