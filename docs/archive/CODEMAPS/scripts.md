# Scripts Codemap

**Last Updated:** 2026-02-17
**Location:** `scripts/`
**Runtime:** TypeScript scripts via `npx tsx`, `.mjs` scripts via `node`

## Purpose

The scripts directory contains offline data management tools for maintaining curriculum content (activities, objectives, playlist mappings). These run locally against the Convex dev or prod database.

## Script Inventory

### Seed Data Generation
| Script | Purpose |
|--------|---------|
| `generate-seed-data.ts` | Generate seed data blocks from playlist mappings and configs |
| `generated-seed-block.ts` | Output of generate-seed-data (paste into seed.ts) |
| `apply-generated-seed-block.ts` | Inject generated seed block into `convex/seed.ts` |

### Curriculum Maintenance
| Script | Purpose |
|--------|---------|
| `distribute-brilliant-lessons.ts` | Distribute Brilliant.org lesson URLs across objectives |
| `dedup-khan-academy.ts` | Deduplicate Khan Academy URLs across objectives |
| `fill-empty-rows.ts` | Fill objectives that have zero activities |
| `fix-metadata.ts` | Fix activity metadata (titles, types, platforms) |

### Validation and Auditing
| Script | Purpose |
|--------|---------|
| `validate-playlist-mapping.ts` | Validate playlist_mapping.json structure and URLs |
| `audit-playlist-mapping.ts` | Audit playlist mappings for coverage gaps |
| `analyze-duplicates.ts` | Find duplicate URLs across objectives |
| `analyze-semantic-mismatches.ts` | Find semantically mismatched activities |

### Data Repair
| Script | Purpose |
|--------|---------|
| `repair-playlist-mapping.ts` | Repair broken playlist mappings |
| `patch-mismatch-risk-rows.ts` | Patch rows flagged as mismatch risks |

### Utilities
| Script | Purpose |
|--------|---------|
| `export-chat-logs.sh` | Export AI chat logs from Convex |
| `sync-diagnostic-v2.mjs` | Sync Diagnostic V2 assets into `public/diagnostic_v2/` |
| `export-diagnostic-v2-md.mjs` | Export Diagnostic V2 `mastery_data.json` into a readable markdown snapshot |
| `generate-whats-new.mjs` | Generate `src/data/whatsNew.generated.ts` from recent git history |

## Config Files

| File | Purpose |
|------|---------|
| `chapter-assignment-config.json` | Maps chapters to learning objectives for seed generation |
| `ka-coverage-fixes.json` | Khan Academy coverage fix instructions |
| `ka-new-content-config.json` | New Khan Academy content to add |
| `context.md` | Documentation for script maintainers |

## Report Files

| File | Purpose |
|------|---------|
| `fill-empty-report.txt` | Report from fill-empty-rows.ts |
| `fix-metadata-report.txt` | Report from fix-metadata.ts |

## Related Top-Level Files

| File | Purpose |
|------|---------|
| `brilliant_links.json` | Brilliant.org lesson URLs for distribution |
| `playlist_mapping.json` | Khan Academy playlist -> objective mappings |

## Related Convex Files

| File | Purpose |
|------|---------|
| `convex/seed.ts` | Main seed function -- seeds emotions, domains, MYP/PYP curricula, Brilliant activities |
| `convex/migrations.ts` | One-time data migrations (trust jar batch split) |

## Curriculum Documentation

See [docs/curriculum/README.md](../../curriculum/README.md) for the full index of curriculum docs (workflow, quality contract, CCSS mappings, generated reports).

## Typical Workflow

```
1. Edit config (chapter-assignment-config.json or ka-new-content-config.json)
2. Run: npx tsx scripts/generate-seed-data.ts
3. Review: scripts/generated-seed-block.ts
4. Apply: npx tsx scripts/apply-generated-seed-block.ts
5. Validate: npx tsx scripts/validate-playlist-mapping.ts
6. Audit: npx tsx scripts/audit-playlist-mapping.ts
```

Diagnostic V2 asset sync workflow:

```bash
npm run diagnostic:v2:sync
```
