# Scripts Codemap

**Last Updated:** 2026-01-29
**Location:** `scripts/`
**Runtime:** Node.js via `npx tsx scripts/<name>.ts`

## Purpose

The scripts directory contains offline data management tools for maintaining curriculum content (activities, objectives, playlist mappings). These run locally against the Convex dev or prod database.

## Script Inventory

### Seed Data Generation
| Script | Purpose |
|--------|---------|
| `generate-seed-data.ts` | Generate seed data blocks from playlist mappings and configs |
| `generated-seed-block.ts` | Output of generate-seed-data (paste into seed.ts) |
| `apply-generated-seed-block.ts` | Apply a generated seed block to the database |

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
| `export-diagnostic-data.mjs` | Export diagnostic question bank |

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
| `convex/seed.ts` | Main seed function (2841 lines) -- seeds emotions, domains, MYP/PYP curricula, Brilliant activities |
| `convex/migrations.ts` | One-time data migrations (trust jar batch split) |

## Curriculum Documentation

The `docs/curriculum/` directory contains detailed documentation about the curriculum mapping process:

| Doc | Purpose |
|-----|---------|
| `README.md` | Overview of curriculum workflow |
| `WORKFLOW.md` | Step-by-step seeding process |
| `QUALITY-CONTRACT.md` | Quality standards for curriculum data |
| `ACTIVITY-LIBRARY-MIGRATION.md` | Migration plan for activity library |
| `CCSS-GRADE-6.md` | Common Core State Standards Grade 6 mapping |
| `CCSS-G6-REFACTOR-PLAN.md` | Grade 6 refactor plan |
| `ccss-grade-6.json` | Grade 6 standards data |
| `snapshot.md` | Database snapshot documentation |
| `validation.md` | Validation rules and results |
| `repair-report.md` | Repair action log |
| `semantic-mismatch-report.md` | Semantic mismatch analysis |
| `mismatch-risk-patch-report.md` | Patch action log |

## Typical Workflow

```
1. Edit config (chapter-assignment-config.json or ka-new-content-config.json)
2. Run: npx tsx scripts/generate-seed-data.ts
3. Review: scripts/generated-seed-block.ts
4. Apply: npx tsx scripts/apply-generated-seed-block.ts
5. Validate: npx tsx scripts/validate-playlist-mapping.ts
6. Audit: npx tsx scripts/audit-playlist-mapping.ts
```
