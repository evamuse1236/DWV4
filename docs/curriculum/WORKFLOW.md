# Curriculum Mapping Workflow (Math)

Use this workflow when updating `playlist_mapping.json` and reseeding Convex data.

## 1. Repair mapping

```bash
node --experimental-strip-types scripts/repair-playlist-mapping.ts
```

Generates `docs/curriculum/repair-report.md`.

## 2. Validate contract

```bash
node --experimental-strip-types scripts/validate-playlist-mapping.ts
```

Generates `docs/curriculum/validation.md`.

## 3. Optional semantic audit and targeted patch

```bash
node --experimental-strip-types scripts/analyze-semantic-mismatches.ts
node --experimental-strip-types scripts/patch-mismatch-risk-rows.ts
```

Generates mismatch reports under `docs/curriculum/`.

## 4. Generate seed block

```bash
node --experimental-strip-types scripts/generate-seed-data.ts
```

Outputs `scripts/generated-seed-block.ts`.

## 5. Apply generated block to seed file

```bash
node --experimental-strip-types scripts/apply-generated-seed-block.ts
```

## 6. Run Convex seed mutations

```bash
npx convex run seed:seedMathFromPlaylist
npx convex run seed:seedPypMathFromPlaylist
```

Use `--prod` only when explicitly targeting production.
