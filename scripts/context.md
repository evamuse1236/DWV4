# Curriculum mapping context (DW)

This repo seeds Math curriculum objectives from a single source-of-truth file:

- `playlist_mapping.json` (rows = learning objectives; links = activities)

The current pipeline is:

1) Edit `playlist_mapping.json`
2) Generate a seed block from it
   - `node --experimental-strip-types scripts/generate-seed-data.ts`
   - Output: `scripts/generated-seed-block.ts`
3) Apply that block into `convex/seed.ts`
   - `node --experimental-strip-types scripts/apply-generated-seed-block.ts`
4) Run the Convex seed mutations (in your Convex environment)
   - `seed:seedMathFromPlaylist` (MYP Y1)
   - `seed:seedPypMathFromPlaylist` (PYP Y2)

Auditing/validation tools:

- Snapshot: `node --experimental-strip-types scripts/audit-playlist-mapping.ts`
  - Output: `docs/curriculum/snapshot.md`
- Contract validation: `node --experimental-strip-types scripts/validate-playlist-mapping.ts`
  - Output: `docs/curriculum/validation.md`
- Duplicates inventory: `node --experimental-strip-types scripts/analyze-duplicates.ts`
- Deterministic cleanup pass: `node --experimental-strip-types scripts/repair-playlist-mapping.ts`
  - Output: `docs/curriculum/repair-report.md`

Reference docs:

- `docs/CURRICULUM-MATH-MAPPING.md` (what exists today)
- `docs/curriculum/QUALITY-CONTRACT.md` (what “good” means)
- `docs/curriculum/WORKFLOW.md` (how to safely edit + regenerate)

