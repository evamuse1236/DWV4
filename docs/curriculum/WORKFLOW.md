# Curriculum Mapping Workflow (Math)

This workflow keeps `playlist_mapping.json` and seeded Convex objectives in sync.

## 1) Repair + normalize the mapping

- `node --experimental-strip-types scripts/repair-playlist-mapping.ts`

Outputs:
- `docs/curriculum/repair-report.md`

## 2) Validate against the quality contract

- `node --experimental-strip-types scripts/validate-playlist-mapping.ts`

Outputs:
- `docs/curriculum/validation.md`

## 2b) (Recommended) Diagnose mismatch-risk rows

- `node --experimental-strip-types scripts/analyze-semantic-mismatches.ts`

Outputs:
- `docs/curriculum/semantic-mismatch-report.md`

If you want a quick, deterministic cleanup for the most common issues (digit-specific objective wording + missing KA display titles), run:

- `node --experimental-strip-types scripts/patch-mismatch-risk-rows.ts`

Outputs:
- `docs/curriculum/mismatch-risk-patch-report.md`

If you are doing taxonomy work, use:

- `docs/curriculum/CCSS-G6-REFACTOR-PLAN.md`

## 3) Regenerate seed data

- `node --experimental-strip-types scripts/generate-seed-data.ts`

Outputs:
- `scripts/generated-seed-block.ts`

## 4) Apply seed block into Convex seed file

- `node --experimental-strip-types scripts/apply-generated-seed-block.ts`

This replaces the two marked sections in `convex/seed.ts`.

## 5) Apply to the database (manual)

Run the Convex mutations:
- `seed:seedMathFromPlaylist` (MYP Y1)
- `seed:seedPypMathFromPlaylist` (PYP Y2)
