# Scripts

This folder contains one-off tooling around curriculum mapping and seed generation.

All `.ts` scripts here are designed to run on Node (type-stripping) without extra tooling:

- `node --experimental-strip-types scripts/<script>.ts`

## Curriculum mapping

- `scripts/fix-metadata.ts`: Normalizes metadata in `playlist_mapping.json` (KA display titles, activity types, Brilliant lesson titles where available). Writes `scripts/fix-metadata-report.txt`.
- `scripts/fill-empty-rows.ts`: Fills empty rows using `scripts/ka-new-content-config.json`. Writes `scripts/fill-empty-report.txt`.
- `scripts/dedup-khan-academy.ts`: Attempts to ensure each KA unit URL is assigned to only one LO row (heuristic).
- `scripts/distribute-brilliant-lessons.ts`: Deduplicates Brilliant chapter/lesson assignments using `scripts/chapter-assignment-config.json`.
- `scripts/repair-playlist-mapping.ts`: Trims oversized activity lists, cleans text, and soft-dedupes reused URLs. Writes `docs/curriculum/repair-report.md`.
- `scripts/patch-mismatch-risk-rows.ts`: Targeted cleanup for mismatch-risk rows (remove digit-specific objective wording; add KA display titles). Writes `docs/curriculum/mismatch-risk-patch-report.md`.
- `scripts/generate-seed-data.ts`: Generates `scripts/generated-seed-block.ts` from `playlist_mapping.json`.
- `scripts/apply-generated-seed-block.ts`: Injects `scripts/generated-seed-block.ts` into `convex/seed.ts` between the `BEGIN/END GENERATED SEED` markers.

## Audits (read-only)

- `scripts/audit-playlist-mapping.ts`: Generates `docs/curriculum/snapshot.md` (counts + reused URLs).
- `scripts/analyze-duplicates.ts`: Reports duplicated Brilliant chapters and duplicated KA unit URLs across rows.
- `scripts/validate-playlist-mapping.ts`: Validates `playlist_mapping.json` against `docs/curriculum/QUALITY-CONTRACT.md` and writes `docs/curriculum/validation.md`.
- `scripts/analyze-semantic-mismatches.ts`: Heuristic report for why mappings feel off (overly-specific LOs + constraint mismatch vs activity titles). Writes `docs/curriculum/semantic-mismatch-report.md`.

## Diagnostic misconception tooling

- `scripts/apply-readable-misconceptions.mjs`: Applies misconception text from readable markdown into diagnostic JSON files with mismatch safeguards. Writes `readable/misconception-sync-report.md`.
- `scripts/normalize-misconceptions-tone.mjs`: Normalizes misconception tone and cleans common artifacts. Writes `readable/misconception-tone-normalization-report.md`.
- `scripts/rewrite-misconceptions-groq.mjs`: Uses Groq chat completions to batch-rewrite misconception text in warm/friendly tone while preserving math meaning, with retry + fallback model support. Writes `readable/misconception-groq-rewrite-report.md`.

### Groq rewrite usage

- Env: set `GROQ_API_KEY`.
- Run full rewrite: `npm run diagnostic:misconceptions:rewrite:groq`
- Dry run sample: `node scripts/rewrite-misconceptions-groq.mjs --limit 24 --batch-size 8 --dry-run`
- Targeted pass: `node scripts/rewrite-misconceptions-groq.mjs --target-keys-file readable/misconception-pass2-target-keys.txt --allow-missing-numeric-tokens`
- Generated audit files are written under `readable/` and are git-ignored.
