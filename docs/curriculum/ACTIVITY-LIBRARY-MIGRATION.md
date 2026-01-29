# Activity library migration (design + steps)

Goal: stop curriculum mappings from “looking duplicated” when the same URL is relevant to multiple objectives.

Today:

- Activities are stored in `activities` keyed by `objectiveId`.
- If the same URL appears in multiple objectives, it becomes multiple activity rows.

Proposed:

## 1) Schema changes (Convex)

Add two new tables:

1) `activityLibrary`
   - One row per unique `url`
   - Fields (suggested):
     - `url` (unique)
     - `title`
     - `type` (`video|exercise|reading|project|game`)
     - `platform` (`Khan Academy|Brilliant|...`)
     - `estimatedMinutes?`
     - `createdAt`, `createdBy`
2) `objectiveActivities`
   - Join table: which activities are part of which objective
   - Fields (suggested):
     - `objectiveId` (learningObjectives)
     - `activityId` (activityLibrary)
     - `order`
     - `coverageTags?` (e.g., `["unlike-denominators"]`)
   - Indexes:
     - `by_objective` (`objectiveId`)
     - `by_activity` (`activityId`)

Backwards compatibility options:

- **Option A (clean):** delete `activities` and update app code to only use the join.
- **Option B (safer rollout):** keep `activities` temporarily; add read paths to prefer `objectiveActivities` when present.

## 2) Migration strategy

Write a one-time migration mutation (similar to `migrations:migrateTrustJarToBatches`) that:

1) Reads all existing `activities`
2) Upserts into `activityLibrary` by `url`
3) Creates `objectiveActivities` linking the objective to the library activity, preserving `order`
4) Optional cleanup:
   - delete the old `activities` rows, or
   - keep them until rollout is stable

Important: preserve progress history.

If progress is currently tracked per `activityId` (old `activities` row), you must decide:

- **Progress keyed to library activity**: migrate progress to use `activityLibraryId`
- **Progress keyed to objective-activity link**: migrate progress to use `objectiveActivitiesId`

## 3) Seeding changes

Update `seedMathFromPlaylist` / `seedPypMathFromPlaylist` so that:

- it inserts activities into `activityLibrary` (dedup by URL)
- it inserts links into `objectiveActivities`

This should remove repeated activity duplication without losing the ability to order activities within each objective.

## 4) UI changes

Update objective views to load activities via:

- `objectiveActivities` (order + tags)
- joined `activityLibrary` rows (title/url/platform/type)

Optional UI improvement:

- If a library activity is shared across multiple objectives, show “Also used in …” to make reuse explicit (instead of looking like an error).

## 5) Validation changes

Extend validation tooling to check:

- Activity reuse is allowed but must be explicit via library/join (no more silent duplication).
- Objectives with constraint tags must have at least one activity tagged as covering it.

