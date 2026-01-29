# Semantic mismatch report (heuristics)

This is a *heuristic* report to explain recurring mapping issues (duplicates and forced mismatches). It does not assert correctness; it highlights where the data model and objective granularity commonly drift from real activity coverage.

Generated from `playlist_mapping.json`.

## Summary

- Total rows: 110
- Duplicated activity URLs (any platform): 19
- Rows flagged as likely mismatch-risk: 6

## A) Most duplicated activity URLs

| Count | URL | Rows (curriculum/row/topic) |
| ---: | --- | --- |
| 4 | https://www.khanacademy.org/math/cc-fourth-grade-math/cc-4th-mult-div-topic | MYP Y1#9 (Arithmetic MYP 1), MYP Y1#11 (Arithmetic MYP 1), MYP Y1#12 (Arithmetic MYP 1), PYP Y2#19 (Arithmetic) |
| 4 | https://www.khanacademy.org/math/cc-fourth-grade-math/cc-4th-add-sub-topic | MYP Y1#11 (Arithmetic MYP 1), MYP Y1#12 (Arithmetic MYP 1), PYP Y2#19 (Arithmetic), PYP Y2#22 (Arithmetic) |
| 3 | https://www.khanacademy.org/math/cc-fourth-grade-math/comparing-fractions-and-equivalent-fractions | MYP Y1#5 (Fractions Foundation), MYP Y1#6 (Fractions Foundation), PYP Y2#35 (Fractions) |
| 2 | https://www.khanacademy.org/math/cc-fifth-grade-math/5th-multiply-fractions | MYP Y1#7 (Fractions Foundation), PYP Y2#31 (Fractions) |
| 2 | https://www.khanacademy.org/math/cc-fourth-grade-math/division | MYP Y1#10 (Arithmetic MYP 1), PYP Y2#18 (Arithmetic) |
| 2 | https://www.khanacademy.org/math/cc-third-grade-math/imp-addition-and-subtraction | MYP Y1#13 (Arithmetic MYP 1), PYP Y2#15 (Arithmetic) |
| 2 | https://www.khanacademy.org/math/cc-third-grade-math/imp-multiplication-and-division | MYP Y1#14 (Arithmetic MYP 1), PYP Y2#22 (Arithmetic) |
| 2 | https://www.khanacademy.org/math/cc-fourth-grade-math/imp-place-value-and-rounding | MYP Y1#14 (Arithmetic MYP 1), PYP Y2#12 (Arithmetic) |
| 2 | https://www.khanacademy.org/math/arithmetic-home/arith-review-fractions/add-sub-mixed-numbers | MYP Y1#24 (Fractions), PYP Y2#38 (Fractions) |
| 2 | https://www.khanacademy.org/math/arithmetic/x18ca194a:add-and-subtract-fractions-different-denominators | MYP Y1#28 (Fractions), PYP Y2#39 (Fractions) |
| 2 | https://www.khanacademy.org/math/cc-fifth-grade-math/subtract-decimals | MYP Y1#29 (Decimals), PYP Y2#61 (Decimal) |
| 2 | https://www.khanacademy.org/math/arithmetic/arith-decimals | MYP Y1#31 (Decimals), PYP Y2#64 (Decimal) |
| 2 | https://www.khanacademy.org/math/cc-fifth-grade-math/divide-decimals | MYP Y1#32 (Decimals), PYP Y2#63 (Decimal) |
| 2 | https://www.khanacademy.org/math/cc-fourth-grade-math/plane-figures/imp-classifying-triangles | MYP Y1#38 (Geometry), PYP Y2#8 (Geometry (2D shapes)) |
| 2 | https://www.khanacademy.org/math/cc-fifth-grade-math/imp-algebraic-thinking | MYP Y1#45 (Algebra foundations), PYP Y2#21 (Arithmetic) |
| 2 | https://www.khanacademy.org/math/cc-fifth-grade-math/coordinate-plane | MYP Y1#61 (Data), PYP Y2#51 (Coordinate Geometry) |
| 2 | https://www.khanacademy.org/math/cc-fourth-grade-math/imp-multiplication-and-division-2 | PYP Y2#16 (Arithmetic), PYP Y2#20 (Arithmetic) |
| 2 | https://www.khanacademy.org/math/cc-fourth-grade-math/cc-4th-fractions-topic | PYP Y2#28 (Fractions), PYP Y2#35 (Fractions) |
| 2 | https://www.khanacademy.org/math/arithmetic-home/arith-review-fractions/mixed-number | PYP Y2#33 (Fractions), PYP Y2#34 (Fractions) |

## B) Likely mismatch-risk rows

Flagged when an objective is very specific (digits) or includes constraints that aren't visible in linked activity titles/URLs (e.g., 'unlike denominators' but the activity title is generic).

| Curriculum | Row | Topic | Objective label | Missing constraints | Note |
| --- | ---: | --- | --- | --- | --- |
| MYP Y1 | 9 | Arithmetic MYP 1 | multiply multi-digit whole numbers using the standard algorithm (e.g., 3-digit × 2-digit). | digit-specific | Objective granularity likely too specific vs available activities. |
| MYP Y1 | 10 | Arithmetic MYP 1 | divide multi-digit whole numbers using standard algorithms and reasoning (e.g., up to 4-digit ÷ 2-digit). | digit-specific | Objective granularity likely too specific vs available activities. |
| PYP Y2 | 6 | Geometry ( Angles) | solve word problems involving angles | angles | Objective includes constraints not reflected in linked activity titles/URLs. |
| PYP Y2 | 16 | Arithmetic | multiply multi-digit whole numbers by 1-digit using algorithms and area models (e.g., 4-digit × 1-digit). | digit-specific | Objective granularity likely too specific vs available activities. |
| PYP Y2 | 18 | Arithmetic | divide multi-digit whole numbers by 1-digit (quotients and remainders) using place value strategies (e.g., up to 4-digit ÷ 1-digit). | digit-specific | Objective granularity likely too specific vs available activities. |
| PYP Y2 | 20 | Arithmetic | multiply two multi-digit whole numbers using place value and algorithms (e.g., 2-digit × 2-digit). | digit-specific | Objective granularity likely too specific vs available activities. |

## What this suggests

- **Objective granularity vs activity granularity is mismatched**: many rows are more specific than a unit-level link can prove coverage for.
- **The model stores activities per objective**: reusing a KA unit across multiple objectives is currently the easiest way to get coverage, but it looks like duplication in the UI.
- **Fix requires taxonomy + data-model decisions**: either (a) make objectives broader, (b) link deeper (lesson-level instead of unit-level), or (c) introduce an activity library + coverage tagging so one activity can cover multiple objectives without looking like copy/paste.
