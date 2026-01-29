# Playlist Mapping Quality Audit (Historical)

Created: 2026-01-27

This is retained as a historical audit document. It may not match the current state of `playlist_mapping.json` after subsequent edits.

---

# Context: Playlist Mapping Quality Audit

## Project Overview

This is a math curriculum app (Convex + React). Two curricula:
- **MYP Y1** (Middle Years Programme Year 1, ~Grade 5-6): 58 learning objectives
- **PYP Y2** (Primary Years Programme Year 2, ~Grade 4-5): 52 learning objectives

Each LO has a `playlist_links` object with `khan_academy` and `brilliant` arrays — external activity links students use to learn the topic.

## File Structure

- `playlist_mapping.json` — Master mapping file (110 LOs with their activity links)
- `brilliant_links.json` — Brilliant.org course data with lesson slugs → human-readable titles (only covers the `math-fundamentals` course)
- `scripts/generate-seed-data.ts` — Reads playlist_mapping.json and generates TypeScript code for seed.ts
- `convex/seed.ts` — Database seed file with all activities inline
- `convex/schema.ts` — Activity type: `"video" | "exercise" | "reading" | "project" | "game"`

## What Was Already Fixed

1. Brilliant lesson titles now use human-readable names from brilliant_links.json (86 titles resolved from the math-fundamentals course)
2. KA titles stripped of grade/course prefixes
3. Activity types assigned from URL patterns
4. 8 targeted KA URLs added for coverage gaps

## Current Data Format

Each LO in playlist_mapping.json:
```json
{
  "curriculum": "MYP Y1",
  "row": 7,
  "topic": "Fractions Foundation",
  "learning_objective": "",
  "dw_handout": "Fraction Fundamentals: Add, Subtract fractions & Multiply fractions",
  "playlist_links": {
    "khan_academy": [
      {
        "source": "Khan Academy",
        "unit_name": "4th Grade - Add and subtract fractions",
        "unit_url": "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2",
        "match_quality": "suggested",
        "display_title": "Add and subtract fractions",
        "activity_type": "video"
      }
    ],
    "brilliant": []
  }
}
```

---

## ISSUE 1: PARTIAL COVERAGE (4 rows)

LO mentions multiple topics but activities only cover some.

### MYP Y1, Row 7
- **dw_handout**: "Fraction Fundamentals: Add, Subtract fractions & Multiply fractions"
- **Has**: KA "Add and subtract fractions" (covers add + subtract only)
- **Missing**: Fraction multiplication content (KA has https://www.khanacademy.org/math/cc-fifth-grade-math/5th-multiply-fractions for this)

### MYP Y1, Row 28
- **LO**: "SWBAT solve word problems involving addition, subtraction, multiplication, division of Fractions using equations and visual models."
- **Has**: KA "Add and subtract fractions (different denominators)" only
- **Missing**: Fraction multiplication/division word problems. KA has:
  - https://www.khanacademy.org/math/cc-fifth-grade-math/5th-multiply-fractions/imp-multiplying-fractions-word-problems (mult word problems)
  - https://www.khanacademy.org/math/cc-fifth-grade-math/divide-fractions/imp-dividing-fractions-and-whole-numbers-word-problems (div word problems)

### MYP Y1, Row 35
- **LO**: "SWBAT solve word problems involving addition, subtraction, multiplication, division of Decimals"
- **Has**: KA "Get ready for adding and subtracting decimals" (preparatory, not word-problem focused, only add/sub)
- **Missing**: Decimal multiplication and division word problems. KA has:
  - https://www.khanacademy.org/math/cc-fifth-grade-math/multiply-decimals (mult decimals)
  - https://www.khanacademy.org/math/cc-fifth-grade-math/divide-decimals (div decimals)

### MYP Y1, Row 34
- **LO**: "SWBAT explain patterns in the number of zeros when multiplying by powers of 10 and decimal point placement"
- **Has**: Brilliant "Exponents & Radicals" (general exponents, squares, roots)
- **Missing**: Specific content about decimal-point-shifting patterns with powers of 10. KA has:
  - https://www.khanacademy.org/math/cc-fifth-grade-math/powers-of-ten (5th grade powers of ten)

---

## ISSUE 2: CONTENT MISMATCH (11 rows)

Activity content doesn't match what the LO actually teaches.

### MYP Y1, Row 11
- **LO**: "SWBAT solve simple word problems using +, -, ×, ÷"
- **Has**: KA "Intro to multiplication" (introductory unit, not word problems, single operation)
- **Should be**: Multi-operation word problems unit. KA has:
  - https://www.khanacademy.org/math/cc-third-grade-math/imp-multiplication-and-division (word problems)
  - https://www.khanacademy.org/math/cc-fourth-grade-math/cc-4th-mult-div-topic (multi-step word problems)

### MYP Y1, Row 37
- **LO**: "SWBAT understand the relationship between 2D figures and 3D objects"
- **Has**: Brilliant scaling/similarity content
- **Should be**: Nets, cross-sections, how 2D shapes compose 3D solids. KA has:
  - https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:cc-6th-nets-of-3-dimensional-figures

### MYP Y1, Row 41
- **LO**: "SWBAT solve problems involving area of 2D figures (Triangles, Parallelograms, composite shapes)"
- **Has**: Brilliant surface-area chapter (3D surface area — pyramids, cones)
- **Problem**: 3D surface area linked to 2D area LO. The "Beautiful Geometry" composite-polygons chapter is fine, but the surface-area chapter is mismatched.

### MYP Y1, Row 51
- **LO**: "SWBAT solve equations of form x + p = q and px = q"
- **Has**: Brilliant inequalities, systems of equations, elimination methods
- **Problem**: Simple one-step equations. Inequalities, graphing inequalities, systems of equations, and elimination are far too advanced.

### MYP Y1, Row 60
- **LO**: "SWBAT read and interpret a line graph"
- **Has**: Brilliant means/distributions/balance-points chapters
- **Problem**: Statistical measures (means, distributions) ≠ line graph reading

### MYP Y1, Row 61
- **LO**: "SWBAT plot a line graph"
- **Has**: Brilliant median/quartile chapters
- **Problem**: Statistical measures (medians, quartiles) ≠ line graph plotting

### PYP Y2, Row 4
- **LO**: "SWBAT measure and sketch angles with protractor"
- **Has**: Brilliant perimeters/circle-arcs chapters
- **Problem**: Perimeter/arc-length content ≠ protractor measurement

### PYP Y2, Row 10
- **LO**: "SWBAT recognize lines of symmetry in 2D figures"
- **Has**: Brilliant full transformations course (translations, rotations, reflections, congruence)
- **Problem**: Only reflections and symmetry chapters are relevant. Translations and rotations are irrelevant to line-of-symmetry identification.

### PYP Y2, Row 36
- **LO**: "SWBAT express a fraction (a/b, a>1) as sum of unit fractions (1/b)"
- **Has**: Brilliant multiplying-fractions chapter
- **Problem**: Additive decomposition into unit fractions ≠ fraction multiplication

### PYP Y2, Row 43
- **LO**: "SWBAT calculate area for rectangles and composite rectangles"
- **Has**: Brilliant circles-11 (circle area) and scaling-areas-1
- **Problem**: Circle area ≠ rectangle area

### PYP Y2, Row 45
- **LO**: "SWBAT solve word problems involving area and perimeter of rectangles"
- **Has**: Brilliant 3D surface area (pyramids, cones)
- **Problem**: 3D surface area ≠ 2D rectangle area/perimeter word problems

---

## ISSUE 4: SLUG-BASED BRILLIANT TITLES (~200+ lessons)

The `brilliant_links.json` file only contains lesson slug→title mappings for the `math-fundamentals` course (86 lessons). All Brilliant lessons from other courses still use raw slugs as titles.

---

## Technical Constraints

1. All fixes go into `playlist_mapping.json` first
2. Then run `node --experimental-strip-types scripts/generate-seed-data.ts` to regenerate the seed block
3. Then replace the seed blocks in `convex/seed.ts`
4. Khan Academy URLs should be unit/topic landing pages, not individual videos
5. Brilliant URLs follow the pattern: `https://brilliant.org/courses/{course_slug}/{chapter_slug}/{lesson_slug}/`

