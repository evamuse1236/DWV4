# Curriculum Mapping Quality Contract

This contract defines what “good” means for `playlist_mapping.json`, and what our scripts enforce.

## Scope

- Applies to the Math curriculum mapping stored in `playlist_mapping.json`.
- Applies to seeded objectives generated from that file (`scripts/generated-seed-block.ts` and `convex/seed.ts`).

## Identity rules

- A curriculum row is uniquely identified by `(curriculum, row)`.
- `row` is **not** globally unique across curricula.

## Activity rules

### Minimum coverage

- Every LO must have **at least 1** activity.
- “Complex” LOs must have **at least 2** activities.
  - Complex = LO text indicates multiple skills (e.g. multiple operations like add/subtract/multiply/divide, or explicit multi-topic phrasing).

### Maximum noise (seeded UI sanity)

To avoid seeded objectives turning into 30–40-link dumps:

- Each LO should have **no more than 8 total activities**.
- Per LO maximums:
  - Khan Academy: **≤ 3**
  - Brilliant lessons: **≤ 6**

### Duplicates

- No duplicate URLs within the same LO.
- Duplicates across different LOs are allowed only when:
  - removing the duplicate would drop an LO below its minimum coverage, or
  - the duplicate is explicitly allowed (tracked in the repair report).

## Text hygiene rules

- `learning_objective` and `dw_handout` should not contain leading/trailing whitespace.
- Avoid “accidental newlines” at the start of `learning_objective` that produce empty titles in seeded objectives.

## Enforcement

- `scripts/audit-playlist-mapping.ts` generates a snapshot of “what exists now”.
- `scripts/validate-playlist-mapping.ts` (added as part of the repair workflow) checks contract violations and reports them.
- `scripts/repair-playlist-mapping.ts` applies deterministic repairs (trim, dedupe, and activity trimming) and outputs a repair report.

