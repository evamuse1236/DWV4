# Curriculum: Math LO → Objective → Activity Mapping

This project seeds the Math domain from a JSON mapping file. The goal of this document is to describe **what exists right now** (data shape + how it becomes majors/sub-objectives/activities), not to propose “better mappings”.

## Source of truth

- `playlist_mapping.json` is the master file for **MYP Y1** and **PYP Y2**.
- `brilliant_links.json` provides a (partial) Brilliant `lesson_slug → title` lookup (currently only for `math-fundamentals`).
- Supporting inputs used by scripts:
  - `scripts/ka-new-content-config.json` (used by `scripts/fill-empty-rows.ts`)
  - `scripts/chapter-assignment-config.json` (used by `scripts/distribute-brilliant-lessons.ts`)

## Terminology (app-side)

- `majorObjectives` = “chapters” (top-level nodes under a domain)
- `learningObjectives` = “sub-objectives” under a major objective (these correspond 1:1 with rows/LOs in `playlist_mapping.json`)
- `activities` = individual links students complete (Khan Academy unit URL, or a Brilliant lesson URL)

## Terminology (data-side)

Each entry in `playlist_mapping.json.learning_objectives[]` is a “row” from the curriculum spreadsheet:

- **Identity**: `curriculum + row` (row numbers repeat across curricula; do not treat `row` as globally unique)
- **Grouping**:
  - For **MYP Y1**, `topic` is mapped into a **CCSS Grade 6 domain major** by `scripts/generate-seed-data.ts` (to avoid overlapping majors like “Fractions Foundation” vs “Fractions”).
  - For **PYP Y2**, `topic` is mapped into playful major titles (e.g., “Fraction Adventures”) by `scripts/generate-seed-data.ts`.
- **Objective text**:
  - `dw_handout` (if present) is used as the human-facing “title/description” source
  - otherwise `learning_objective` (“SWBAT …”) is used
- **Activities**:
  - `playlist_links.khan_academy[].unit_url` becomes an activity
  - `playlist_links.brilliant[].lessons[].url` becomes an activity

## How the mapping becomes seeded data

### 1) `playlist_mapping.json` → a seed block

`scripts/generate-seed-data.ts` reads `playlist_mapping.json`, groups rows by topic, and outputs a code block to:

- `scripts/generated-seed-block.ts`

This block is intended to be copied into `convex/seed.ts` (see below).

Run it with:

- `node --experimental-strip-types scripts/generate-seed-data.ts`

### 1b) Apply the generated block to `convex/seed.ts`

`convex/seed.ts` contains two marked sections:

- `BEGIN GENERATED SEED (MYP Y1)` / `END GENERATED SEED (MYP Y1)`
- `BEGIN GENERATED SEED (PYP Y2)` / `END GENERATED SEED (PYP Y2)`

Update them automatically with:

- `node --experimental-strip-types scripts/apply-generated-seed-block.ts`

### 2) `convex/seed.ts` writes to the database

Two Convex mutations use the generated data:

- `seedMathFromPlaylist` (replaces all Math majors/sub-objectives/activities; seeds **MYP Y1** majors with `curriculum: "MYP Y1"`).
- `seedPypMathFromPlaylist` (deletes and replaces only majors with `curriculum: "PYP Y2"`).

Both create **independent activity rows per sub-objective**. If the same URL appears in multiple LOs, the app will have multiple activity records (one per sub-objective).

## Auditing what we have today

### Snapshot (counts + duplicates)

- `docs/curriculum/snapshot.md` is a generated snapshot of the current mapping: totals, topic breakdown, and reused activity URLs.

Regenerate it with:

- `node --experimental-strip-types scripts/audit-playlist-mapping.ts`

### Duplicate-chapter audit (Brilliant chapters / KA units)

- `scripts/analyze-duplicates.ts` reports duplicated Brilliant *chapters* and duplicated KA *unit URLs* across rows.

## Common failure modes (current behavior)

- **Repeated activities across different objectives**: allowed by the current model, but can be confusing pedagogically.
- **“Closest objective matched” but activity doesn’t cover it**: this is a semantic quality problem in `playlist_mapping.json` (the system has no automatic coverage validation).
- **Title weirdness**: objective titles are derived heuristically (mainly from `dw_handout` or the first non-empty line of `learning_objective`).
