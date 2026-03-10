# Curriculum Map Context

Purpose: local source-of-truth notes for the standalone curriculum mapping page at `im/curriculum-map.html`.

## Goal

This page supports project-based teaching in deep work.

For each project/topic area, it shows:
1. The directly mapped Common Core standards already covered by the project work
2. The advanced extension standards for the stronger batch
3. Curated Illustrative Math teacher links for both the direct and advanced tracks

The page is meant to remove the need to juggle:
- your own project-topic mapping
- Common Core standards sheets
- the Illustrative Math site

## Inputs

Workbook inputs live beside this file:
- `im/cc_standards_mapping.xlsx`
- `im/advanced_extensions_cc.xlsx`

The HTML page embeds normalized data derived from those two workbooks. It does not fetch or parse Excel at runtime.

## Canonical Topic Groups

The standalone page normalizes the workbook rows into these topic groups:
- Fractions
- Decimals
- Arithmetic MYP 1
- Factors & Multiples
- Geometry
- Measurement & Areas
- Algebra Foundations
- Algebra
- Rates
- Percentage
- Data
- Problem Solving

## Alias Rules

These workbook naming mismatches are intentionally merged:
- `Fraction Fundamentals` -> `Fractions`
- `Fractions (MYP 1)` -> `Fractions`
- `Decimal Fundamentals` -> `Decimals`
- `Decimals (MYP 1)` -> `Decimals`

Reason: the advanced workbook uses the MYP labels, while the direct workbook includes both fundamentals and MYP variants. The standalone page groups them so the teacher can scan one fraction lane and one decimal lane instead of mentally reconciling two near-duplicate buckets.

## Data Shape In The HTML

Each topic group is rendered with:
- `title`
- `aliases[]`
- `directMappings[]`
- `advancedMappings[]`
- `imLinks.direct[]`
- `imLinks.advanced[]`

Each direct mapping row carries:
- `sourceTopic`
- `swbat`
- `code`
- `description`
- `grade`

Each advanced mapping row carries the same fields plus:
- `whyItFits`

## IM Link Policy

IM links are curated by hand in v1.

They are:
- teacher-view `accessim.org` links
- mostly unit-level launch points
- chosen as practical entry points, not exact one-row-to-one-page guarantees
- exposed through a lane-aware dropdown menu so the visible Direct or Advanced lane determines which IM links are offered

When multiple IM units are useful for a topic, keep multiple links in that topic lane instead of forcing a single link.

## Updating This Page Later

When the spreadsheets change:
1. Re-check the topic names in both workbooks
2. Update alias rules if naming diverges further
3. Refresh the embedded row data inside `im/curriculum-map.html`
4. Re-check the curated IM links against the current `accessim.org` teacher pages
5. Open the HTML locally and verify search, grade filter, code filter, lane switching, and the lane-aware IM dropdown

## Scope Notes

This v1 is intentionally standalone.

It is not yet integrated into the React app, Convex, or admin routing. When the page is later folded into the app, this file should remain the quick owner note for:
- merge rules
- workbook source files
- curated IM link intent
