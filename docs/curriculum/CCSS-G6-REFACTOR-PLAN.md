# CCSS Grade 6 refactor plan (curriculum mapping)

This plan fixes repeated “bad curriculum mapping” outcomes (duplicated activities, forced matches, and confusing chapter structure) by rebuilding the **taxonomy and mapping workflow** around **CCSS Grade 6**.

## 0) Current diagnosis (why it keeps going wrong)

The recurring failures are structural, not “bad links”:

1) **Objective granularity ≠ activity granularity**
   - Many objectives are *micro-specific* (e.g., “3-digit by 2-digit”, “unlike denominators”).
   - Many links are *unit-level* pages (broad), so they cannot guarantee coverage for the micro-constraint.
2) **Overlapping/duplicated majors**
   - Example: “Fractions Foundation” + “Fractions” makes it unclear where an activity belongs and encourages reusing the same URLs in multiple places.
3) **Forced matches to satisfy coverage**
   - When an LO has no clear 1:1 match in Khan/Brilliant, the system still needs activities, so it “closest matches”, creating semantic mismatch.
4) **Data model encourages duplication**
   - Activities are stored *per learning objective* (`activities` table keyed by `objectiveId`), so reusing a URL creates multiple activity rows that look like copy/paste in the UI.

Supporting evidence:

- `docs/curriculum/semantic-mismatch-report.md` (generated): duplicated URLs + mismatch-risk rows.

## 1) Target taxonomy (CCSS Grade 6)

Use CCSS Grade 6 domains as majors:

- `6.RP` Ratios & Proportional Relationships
- `6.NS` The Number System
- `6.EE` Expressions & Equations
- `6.G` Geometry
- `6.SP` Statistics & Probability

Reference:

- `docs/curriculum/CCSS-GRADE-6.md`
- `docs/curriculum/ccss-grade-6.json`

### Decision: prerequisites

Your current MYP Y1 mapping contains **below-grade prerequisites** (e.g., multi-digit multiplication, fraction equivalence).

Pick one (don’t mix):

- **Option A (recommended):** Keep prerequisites, but explicitly tag them as `prereq` and treat them as “bridge skills” inside `6.NS`.
- **Option B:** Split them into a separate major like `Bridge: Grade 4–5 Foundations` (cleaner pedagogy, but adds a non-CCSS major).

## 2) Objective design rules (to stop forced mismatches)

### Rule 2.1 — Make objectives “resource-shaped”

An objective should be roughly the size of a realistic resource bundle:

- 1–2 instruction activities (video/reading)
- 1–2 practice activities (exercise)

If an objective requires a micro-constraint (“unlike denominators”), the activities must be **lesson-level**, not a broad unit page.

### Rule 2.2 — Eliminate digit-specific objectives

Replace objectives like “3-digit by 2-digit” with a broader skill:

- “Multiply multi-digit whole numbers (standard algorithm + place value reasoning)”

Keep the digit sizes as **examples** in the description, not the objective title.

### Rule 2.3 — One objective, one concept boundary

Avoid “Add/Subtract & Multiply fractions” as a single objective unless the activity bundle truly covers both in a cohesive sequence.

## 3) Data-model fix (stop duplication at the source)

Introduce an **activity library** so one URL is one activity record:

- New table: `activityLibrary` (unique by `url`)
- New join: `objectiveActivities` (objectiveId → activityLibraryId + order + optional coverage tags)

Benefits:

- Reusing an activity doesn’t look like duplicated content; it’s explicitly shared.
- You can attach **coverage tags** per objective-activity link (“covers unlike denominators”).

## 4) Mapping data changes (playlist_mapping.json)

Add **metadata** to each row so mapping can be validated and improved automatically:

- `ccss.domain` (one of `6.RP|6.NS|6.EE|6.G|6.SP`)
- `ccss.standards` (array of codes like `["6.NS.1"]`)
- `tags` (e.g., `["unlike-denominators", "mixed-numbers", "percent"]`)
- Optional: `objective_group_id` to merge multiple spreadsheet rows into one seeded objective (when the split is artificial)

## 5) Validation gates (prevent regressions)

Extend validation beyond “has links”:

- No duplicate URLs *within the same objective*
- Objectives with constraint tags must have at least one linked activity that either:
  - contains the keyword in title, or
  - is tagged as covering it
- Digit-specific objective titles are rejected (must be rewritten)
- CCSS domain required for every MYP Y1 objective

## 6) Execution sequence (safe rollout)

1) **Freeze** mapping edits; regenerate baseline reports
   - `node --experimental-strip-types scripts/audit-playlist-mapping.ts`
   - `node --experimental-strip-types scripts/analyze-semantic-mismatches.ts`
2) **Taxonomy realign**
   - Ensure MYP Y1 majors are CCSS-domain majors (already done in seed generation).
3) **Retag + rewrite objectives**
   - Add `ccss` + `tags` metadata.
   - Rewrite the mismatch-risk objectives first (see report).
4) **Deepen activity granularity where needed**
   - Replace unit-level links with lesson-level links for constraint-heavy objectives.
5) **Ship activity library + migration**
   - Add new tables + join reads in backend/frontend.
   - Migration converts existing per-objective activities into library + links.
6) **Reseed + verify**
   - Regenerate seed block and run `seedMathFromPlaylist`.

## 7) Immediate next actions (recommended)

- Decide on **Prerequisite Option A vs B**.
- Start with the 11 mismatch-risk rows in `docs/curriculum/semantic-mismatch-report.md`:
  - rewrite the objective titles/descriptions (remove digit-specific wording),
  - replace broad unit links with more specific activities where necessary,
  - tag each with CCSS domain + standard codes.

