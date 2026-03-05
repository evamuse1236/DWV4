# Daily Ops Checklist

## Run locally

1. Start backend: `npx convex dev`
2. Start app: `npm run dev`
3. Open `http://localhost:5173`

## Before shipping changes

1. `npm run lint`
2. `npm run test:run`
3. `npm run build`
4. If backend changed, deploy backend first (`npx convex deploy -y`).

## If production breaks

1. Check Convex logs: `npx convex logs --prod --history 50`
2. Confirm frontend is pointed at the right Convex URL.
3. If needed:
   - Roll back frontend from Netlify deploy history.
   - Roll back Convex by restoring previous `convex/` code and redeploying.

## Quick reminders

- New backend functions must be deployed before frontend that calls them.
- If a status flow feels wrong, check backend mutations first.
- If AI output parsing fails, inspect fenced block format in the AI response.
