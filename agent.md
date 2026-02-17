# Agent Operating Notes

Operational quick notes for this repo.

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
