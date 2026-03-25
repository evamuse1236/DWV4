# Root Layout

Purpose: keep the app repo readable.

## Allowed top-level folders

- `src/`: runtime frontend code
- `convex/`: backend functions and schema
- `public/`: runtime static assets
- `scripts/`: repeatable tooling
- `docs/`: technical source of truth
- `docs-for-humans/`: plain-language operator docs
- `workspace/`: non-runtime scratch, reports, mirrors, and legacy material
- `tests/`: automated tests if added at repo root later

## `workspace/` rules

Use `workspace/` for:
- manual harnesses
- generated reports
- readable exports
- data mirrors
- reference code
- old standalone assets

Do not put runtime code, deployed assets, or canonical source data here.

## Naming rules

- Prefer plain nouns: `student`, `admin`, `diagnostics`, `reading`
- Prefer purpose over history
- Avoid vague buckets like `output`, `misc`, `web`, or `im`
- Avoid version names in active folders

## Current workspace folders

- `workspace/manual-tests/`
- `workspace/diagnostic-source-assets/`
- `workspace/diagnostic-reports/`
- `workspace/reports/`
- `workspace/reference-projects/`
- `workspace/legacy-web-assets/`
- `workspace/generated/`
- `workspace/legacy/`
