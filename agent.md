# Agent Operating Notes

Operational quick notes for this repo.

## Postmortem: 2026-02-17 Netlify Miss

What went wrong:
1. I validated with `npm run lint` and `npm run test:run` but skipped `npm run build` before the first push.
2. Netlify runs `tsc -b && vite build`, so TS-only failures were missed locally.
3. Branch mismatch also existed (`main` pushed while Netlify auto-published `master`).

Learning:
- Test pass != production build pass.
- For this repo, deploy branch must be treated as `master` only.

## Mandatory Pre-Push Gate (Master)

Before any push intended for Netlify production:

```bash
npm run lint
npm run test:run
npm run build
git push origin master
```

If any command fails, do not push.

## Mandatory Deploy Verification (Netlify CLI)

After pushing `master`, verify production with CLI:

```bash
npx netlify status
npx netlify deploy --prod --dir=dist --message "<summary>"
```

Record and check:
1. Production URL
2. Unique deploy URL
3. Build logs URL

## Deployment Sync Rule

If frontend code calls new Convex functions, deploy Convex first.

```bash
npx convex deploy -y
git push origin master
npx convex logs --prod --history 50
```

## Failure Signature

`Could not find public function for 'auth:<name>'`

Meaning: frontend reached production before Convex backend deploy.

## Where To Read Full Ops

- `docs/RUNBOOK.md`
- `docs/CONTRIBUTING.md`

## Process Safety Rule

Do not run `git add`/`git commit` in parallel with other mutating git commands.
Stage, commit, verify, then push in sequence.
