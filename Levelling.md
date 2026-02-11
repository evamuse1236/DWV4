# Levelling System Context

Last updated: 2026-02-11

This document captures the current end-to-end character levelling system so it can be researched, tuned, and revised externally.

## 1. Product Intent

The system is designed to:

- Reward consistency and learning effort.
- Make progression domain-driven instead of purely volume-driven.
- Prevent runaway levelling from repeating only one behavior type.
- Keep tarot unlock criteria hidden for students (surprise unlocks).

## 2. Core Architecture

### 2.1 Tables

Character-specific tables:

- `characterProfiles`
  - Per student aggregate profile.
  - Fields: `userId`, `totalXp`, `level`, `xpIntoLevel`, `xpNeededForNextLevel`, `activeTarotCardId`, timestamps.
- `characterDomainStats`
  - Per student per domain XP and domain level.
  - Fields: `userId`, `domainId`, `xp`, `statLevel`, `updatedAt`.
- `characterXpLedger`
  - Idempotent XP event ledger.
  - Fields: `userId`, `sourceType`, `sourceKey`, `xpAwarded`, optional `domainId`, optional `meta`, `awardedAt`.
- `tarotCards`
  - Admin-managed catalog.
  - Fields: `name`, `slug`, `description`, `imageStorageId`, `unlockLevel`, optional `domainAffinityId`, `rarity`, `isActive`, `displayOrder`.
- `studentTarotUnlocks`
  - Per student unlocked card rows.
- `badgeDefinitions`
  - Badge rules.
- `studentBadges`
  - Awarded badges.

Related base tables used by levelling:

- `domains`
- `goals` (now has optional `domainId`)
- `actionItems` (now has optional `domainId`)
- `habits` (now has optional `domainId`)
- `diagnosticAttempts`
- `studentMajorObjectives`
- `studentBooks`

### 2.2 Event Integration Points

XP is awarded from:

- `goals.toggleActionItem`
- `habits.toggleCompletion`
- `progress.toggleActivity`
- `diagnostics.submitAttempt`
- `objectives.updateStatus` (mastered)
- `books.updateStatus`
- `books.approvePresentationRequest`

## 3. XP Values (Current)

From `CHARACTER_XP`:

- Action item completion: `+6`
- Habit completion: `+4`
- Activity completion: `+10`
- Diagnostic pass: `+40`
- Diagnostic fail: `+12`
- Major objective mastered: `+60`
- Reading presentation requested: `+15`
- Reading presented: `+30`

## 4. Domain Routing Rules

### 4.1 Momentum domain

A dedicated domain named `Momentum` is now used for tasks and habits.

- All action-item XP -> `Momentum`
- All habit XP -> `Momentum`
- New goals/action items/habits are normalized to use `Momentum` domain linkage.

If `Momentum` does not exist, it is auto-created with:

- Name: `Momentum`
- Icon: `⚡`
- Color: `#f59e0b`
- Description: consistency momentum through tasks/habits

### 4.2 Other sources

- Activity completion -> objective domain
- Diagnostics and mastery -> diagnostic/major domain
- Reading milestones -> Reading domain

Reading remains a first-class domain.

## 5. Anti-Farming and Idempotency

All XP flows through `awardXpIfNotExists`.

Idempotency keys:

- Action item: `action_item:{itemId}`
- Habit completion: `habit_completion:{habitId}:{date}`
- Activity completion: `activity_completion:{studentObjectiveId}:{activityId}`
- Diagnostic attempt: `diagnostic_attempt:{attemptId}`
- Major mastered: `major_mastered:{userId}:{majorObjectiveId}`
- Reading milestone: `reading_milestone:{studentBookId}:{status}`

Unchecking/undoing completion does not remove XP.
Repeated completion on same key does not re-award XP.

## 6. Momentum Balancing Controls

Current balancing:

- Lowered task/habit XP weights (`6` and `4`).
- Added daily cap for Momentum task/habit XP.

Daily cap:

- `MOMENTUM_DAILY_XP_CAP = 36`
- Applies only to `action_item` and `habit_completion` in `Momentum`.
- If cap is reached, award is skipped (`awarded: false`, reason `momentum_daily_cap_reached`).

Effect:

- Typical heavy day (4 tasks + 3 habits) yields `24 + 12 = 36`, exactly at cap.
- Doing more still records completions, but no extra Momentum XP that day.

## 7. Leveling Formulas

### 7.1 Domain level

Current per-domain divisors:

- Non-Momentum domains: `120`
- Momentum domain: `224`

Formula:

- `domainStatLevel = 1 + floor(domainXp / divisorForDomain)`

This intentionally slows Momentum-only levelling.

### 7.2 Overall level

Overall level is no longer computed from a standalone global XP curve.
It is derived from domain levels:

- `overallLevelRaw = average(all domain stat levels)`
- `overallLevel = floor(overallLevelRaw)`

Progress bar fields:

- `xpIntoLevel = round((overallLevelRaw - overallLevel) * 100)`
- `xpNeededForNextLevel = 100`

Profile totals:

- `totalXp = sum(domain XP across all domains)`

Notes:

- Legacy helper `xpNeeded(level)` still exists from the earlier global model, but current profile progression uses domain-average logic.
- Including all domains in the average intentionally creates scaling pressure to develop weaker domains.

## 8. Tarot Cards

## 8.1 Unlock logic

For active cards:

- If card has `domainAffinityId`: unlock when `that domain level >= unlockLevel`
- If no affinity: unlock when `overallLevel >= unlockLevel`

Students can equip one unlocked active card.

## 8.2 Student secrecy policy (active)

Student payload now hides unlock requirements:

- `unlockLevel` omitted
- `domainAffinity` hidden
- `nextUnlock` is `null`
- UI shows generic locked state and "hidden requirement" messaging

Admin-facing payloads can still include requirement details for management.

## 8.3 Default tarot starter set

Seeded defaults:

- The Initiate (common, unlock level 1)
- The Storyweaver (rare, unlock level 3)
- The Archivist (epic, unlock level 5)
- The Compiler (legendary, unlock level 8)

Starter affinity backfill maps these to:

- Initiate -> Math
- Storyweaver -> English/Writing
- Archivist -> Reading
- Compiler -> Coding

## 9. Badges (Current Default Set)

From `badgeDefinitions` seeds:

- `LVL_5`: level >= 5
- `LVL_10`: level >= 10
- `MASTER_3`: total mastered major objectives >= 3
- `MASTER_10`: total mastered major objectives >= 10
- `DIAG_PASS_5`: diagnostic passes >= 5
- `HABIT_STREAK_7`: any habit streak >= 7 days
- `READER_3`: books presented >= 3

Badge evaluator is idempotent and awards once per badge code per student.

## 10. API Surface Summary

Student-facing:

- `character.getMyCharacter`
- `character.getMyCollection`
- `character.getMyTimeline`
- `character.equipCard`

Admin/catalog/backfill:

- `character.getTarotCatalog`
- `character.createTarotCard`
- `character.updateTarotCard`
- `character.archiveTarotCard`
- `character.getStudentCharacter`
- `character.backfillPartialCharacterXp`
- `character.backfillMissingXpDomains`
- `character.backfillStarterTarotAffinities`
- `character.migrateTasksAndHabitsToMomentum`

## 11. Migrations and Operational Scripts

Important one-time/maintenance mutations:

- `backfillPartialCharacterXp`
  - Backfills diagnostics + mastered majors only.
- `backfillMissingXpDomains`
  - Repairs older ledger rows missing `domainId`.
- `backfillStarterTarotAffinities`
  - Adds missing affinity to starter tarot cards.
- `migrateTasksAndHabitsToMomentum`
  - Reassigns goals/actionItems/habits + historical task/habit ledger XP to Momentum.
  - Rebuilds domain stats and refreshes profiles/unlocks for touched users.

## 12. Current Tunable Knobs

High-impact tuning levers:

- `CHARACTER_XP` weights
- `MOMENTUM_DAILY_XP_CAP`
- Domain level divisors (`120` default, `224` Momentum)
- Overall progress scale (`100` points per level band)
- Tarot `unlockLevel` values
- Whether seeded tarot cards are domain-affinity vs overall-level cards
- Badge thresholds

## 13. Calibration Considerations

Recommended research questions:

- Is Momentum still dominating average level growth after cap?
- Should cap be static (36) or adaptive by cohort age/batch?
- Should Sunday have a lower cap modifier?
- Should activities also have a soft daily cap, or is cross-domain pressure enough?
- Should some tarot cards remain overall-level cards to avoid affinity lock frustration?
- Should badge thresholds be raised once Momentum reaches target stability?

## 14. Current Behavioral Outcome (Intended)

- Students can gain momentum through routine tasks/habits.
- Faster scaling in Momentum is constrained by cap.
- Overall level growth slows unless other domains improve.
- Reading is preserved and rewarded as its own domain.
- Unlock criteria are hidden and discovered through play.
