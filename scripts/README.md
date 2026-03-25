# Scripts

Purpose: offline maintenance tooling for curriculum data, diagnostics content, and generated artifacts.

## Run format

TypeScript scripts run with Node type-stripping:

```bash
node --experimental-strip-types scripts/<group>/<script>.ts
```

## Main script groups

### `scripts/curriculum/`

- `repair-playlist-mapping.ts`
- `generate-seed-data.ts`
- `apply-generated-seed-block.ts`

### `scripts/validate/`

- `analyze-duplicates.ts`
- `analyze-semantic-mismatches.ts`
- `validate-playlist-mapping.ts`

### `scripts/diagnostics/`

- `apply-readable-misconceptions.mjs`
- `export-diagnostic-v2-md.mjs`
- `normalize-misconceptions-tone.mjs`
- `rewrite-misconceptions-groq.mjs`

### `scripts/migration/`

- `fill-empty-rows.ts`
- `fill-q3-daily-goals.ts`
- `patch-mismatch-risk-rows.ts`
- `fix-metadata.ts`

### `scripts/reporting/`

- `generate-whats-new.mjs`
- `export-chat-logs.sh`

### `scripts/sync/`

- `sync-diagnostic-v2.mjs`

## Output locations

- Curriculum reports: `docs/curriculum/*.md`
- Generated seed block: `scripts/curriculum/generated-seed-block.ts`
- Misconception reports: `workspace/diagnostic-reports/parts/*report*.md`

## Primary references

- `docs/ROOT-LAYOUT.md`
- `docs/DATA_FLOW.md`
- `docs/OPERATIONS.md`
- `docs/curriculum/README.md`
