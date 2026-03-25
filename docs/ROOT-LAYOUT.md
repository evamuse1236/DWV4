# Root Layout

This repo stays readable only if the root stays strict.

## Allowed Top-Level Folders

- `src/`: frontend runtime code
- `convex/`: backend functions and schema
- `public/`: static runtime assets
- `scripts/`: repeatable tooling
- `docs/`: technical documentation
- `docs-for-humans/`: plain-language guidance
- `workspace/`: non-runtime material
- `tests/`: repo-level automated tests if needed later

## What Belongs In `workspace/`

Put these here:
- manual harnesses
- generated reports
- readable exports
- mirrored source assets
- reference code
- legacy standalone assets

Do not put app runtime code, deployed assets, or source-of-truth data here.

## Naming Rules

- use plain purpose-first names like `student`, `admin`, `diagnostics`, `reading`
- prefer present purpose over old history
- avoid vague names like `output`, `misc`, `web`, or `im`
- avoid version labels in active folders

## Current `workspace/` Folders

- `workspace/manual-tests/`
- `workspace/diagnostic-source-assets/`
- `workspace/diagnostic-reports/`
- `workspace/reports/`
- `workspace/reference-projects/`
- `workspace/legacy-web-assets/`
- `workspace/generated/`
- `workspace/legacy/`
