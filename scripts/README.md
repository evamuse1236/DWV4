# Scripts

Purpose: offline maintenance tooling for curriculum data, diagnostics content, and generated artifacts.

## Run format

TypeScript scripts run with Node type-stripping:

```bash
node --experimental-strip-types scripts/<script>.ts
```

## Main script groups

### Curriculum repair and generation

- `repair-playlist-mapping.ts`
- `validate-playlist-mapping.ts`
- `generate-seed-data.ts`
- `apply-generated-seed-block.ts`

### Curriculum diagnostics and audits

- `audit-playlist-mapping.ts`
- `analyze-duplicates.ts`
- `analyze-semantic-mismatches.ts`
- `patch-mismatch-risk-rows.ts`

### Diagnostic misconception tooling

- `apply-readable-misconceptions.mjs`
- `normalize-misconceptions-tone.mjs`
- `rewrite-misconceptions-groq.mjs`

## Output locations

- Curriculum reports: `docs/curriculum/*.md`
- Generated seed block: `scripts/generated-seed-block.ts`
- Misconception reports: `readable/*report*.md`

## Primary references

- `docs/curriculum/WORKFLOW.md`
- `docs/curriculum/QUALITY-CONTRACT.md`
- `scripts/context.md`
