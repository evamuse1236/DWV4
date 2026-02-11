# Character System Implementation Plan

## 1. Objective
Build a new student-facing **Character** system that makes progress tangible through:
- XP and level progression
- Domain-based stats (Math/English/Reading/Coding via domain mapping)
- Unlockable tarot-style character cards
- Milestone badges
- A dedicated student Character page and admin catalog/progress controls

This plan is **decision-complete** so engineering can execute without open product decisions.

---

## 2. Confirmed Product Decisions

- XP model: weighted by work type
- Stat model: domain-driven stats
- Tarot source: admin-managed catalog
- Backfill: partial (diagnostic attempts + mastered major objectives only)
- Equip model: one active card per student
- Level curve: gentle scaling
- XP anti-abuse: award only on first valid completion event
- Badge policy: milestone auto-awards only
- Admin v1 scope: tarot catalog + student progress views
- Diagnostic XP policy: pass-heavy, fail-lite
- Card unlock policy: deterministic level thresholds
- Student entrypoint: dedicated Character page + sidebar item

---

## 3. Current System Grounding (Existing Code)

### Existing student activity events already in codebase
- `goals.toggleActionItem` (task completion)
- `habits.toggleCompletion` (habit completion per date)
- `progress.toggleActivity` (deep-work activity completion)
- `diagnostics.submitAttempt` (diagnostic submission with pass/fail)
- `objectives.updateStatus` (major objective status updates including mastered)
- `books.updateStatus` + presentation approval flow (reading milestones)

### Existing structure we must align with
- Domains live in `domains` table and already drive deep-work summaries.
- Student routes already include dashboard/sprint/deep-work/reading/trust-jar/vision-board/settings.
- No XP/character tables currently exist.

---

## 4. Data Model Changes (Convex Schema)

Add these tables:

### 4.1 `characterProfiles`
One row per student.
- `userId: Id<"users">` (indexed unique by query discipline)
- `totalXp: number`
- `level: number`
- `xpIntoLevel: number`
- `xpNeededForNextLevel: number`
- `activeTarotCardId?: Id<"tarotCards">`
- `createdAt: number`
- `updatedAt: number`
- Indexes: `by_user`

### 4.2 `characterDomainStats`
Per-user per-domain stat progression.
- `userId: Id<"users">`
- `domainId: Id<"domains">`
- `xp: number`
- `statLevel: number`
- `updatedAt: number`
- Indexes: `by_user`, `by_user_domain`

### 4.3 `characterXpLedger`
Idempotent audit trail for XP events.
- `userId: Id<"users">`
- `sourceType: "action_item" | "habit_completion" | "activity_completion" | "diagnostic_attempt" | "major_mastered" | "reading_milestone" | "manual_adjustment"`
- `sourceKey: string` (idempotency key within user)
- `xpAwarded: number`
- `domainId?: Id<"domains">`
- `meta?: any`
- `awardedAt: number`
- Indexes: `by_user_awardedAt`, `by_user_sourceKey`

### 4.4 `tarotCards`
Admin-managed card catalog.
- `name: string`
- `slug: string`
- `description?: string`
- `imageStorageId: Id<"_storage">`
- `unlockLevel: number`
- `domainAffinityId?: Id<"domains">`
- `rarity: "common" | "rare" | "epic" | "legendary"`
- `isActive: boolean`
- `displayOrder: number`
- `createdAt: number`
- `updatedAt: number`
- Indexes: `by_unlockLevel`, `by_active_order`

### 4.5 `studentTarotUnlocks`
Tracks which cards each student has unlocked.
- `userId: Id<"users">`
- `tarotCardId: Id<"tarotCards">`
- `unlockedAt: number`
- `unlockReason: "level" | "badge" | "admin"`
- Indexes: `by_user`, `by_user_card`

### 4.6 `badgeDefinitions`
Milestone badge config.
- `code: string`
- `name: string`
- `description: string`
- `icon: string`
- `thresholdType: "level" | "total_mastered" | "diagnostic_passes" | "habit_streak" | "reading_presented"`
- `thresholdValue: number`
- `displayOrder: number`
- `isActive: boolean`
- Indexes: `by_thresholdType`

### 4.7 `studentBadges`
Per-student awarded badges.
- `userId: Id<"users">`
- `badgeCode: string`
- `awardedAt: number`
- `meta?: any`
- Indexes: `by_user`, `by_user_badge`

---

## 5. XP + Level + Stat Rules

### 5.1 Level curve (gentle)
- Level starts at `1`.
- XP needed for next level:
  - `xpNeeded(level) = 100 + (level - 1) * 25`
- Support multi-level jumps in one award operation.

### 5.2 Domain stat formula
- `statLevel = 1 + floor(domainXp / 120)`
- Domain stats increase via domain-scoped XP events.

### 5.3 XP event weights (v1 constants)
- Action item first completion: `+8`
- Habit completion (first true for habit+date): `+6`
- Activity first completion: `+10`
- Diagnostic attempt:
  - pass: `+40`
  - fail: `+12`
- Major objective mastered: `+60`
- Reading milestones:
  - presentation requested: `+15`
  - presented: `+30`

### 5.4 Anti-farming/idempotency keys
All XP goes through one idempotent award helper:
- action item: `action_item:{itemId}`
- habit: `habit_completion:{habitId}:{date}`
- activity: `activity_completion:{studentObjectiveId}:{activityId}`
- diagnostic: `diagnostic_attempt:{attemptId}`
- mastered: `major_mastered:{userId}:{majorObjectiveId}`
- reading: `reading_milestone:{studentBookId}:{status}`

No XP on uncomplete/uncheck transitions.

---

## 6. Tarot Unlock + Equip Rules

- Unlock is deterministic by level threshold (`unlockLevel <= currentLevel`).
- On level-up, unlock all newly eligible active cards.
- Student can equip exactly one unlocked card.
- If no active card is equipped and at least one unlocked card exists, auto-equip the lowest `unlockLevel`, then lowest `displayOrder`.

---

## 7. Badge Rules (Auto-awarded)

Seed default badges:
- `LVL_5` (level >= 5)
- `LVL_10` (level >= 10)
- `MASTER_3` (3 major objectives mastered)
- `MASTER_10` (10 major objectives mastered)
- `DIAG_PASS_5` (5 passed diagnostics)
- `HABIT_STREAK_7` (7-day streak any habit)
- `READER_3` (3 books presented)

Badge evaluator runs after relevant XP events and inserts only if not already awarded.

---

## 8. Backend Modules and Interfaces

Create `convex/character.ts`.

### 8.1 Student-facing
- `getMyCharacter({ userId })`
  - returns profile, level progress, active card, unlocked cards, domain stats, badges, recent XP ledger slice
- `equipCard({ userId, tarotCardId })`
- `getMyCollection({ userId })`
- `getMyTimeline({ userId, limit })`

### 8.2 Admin-facing
- `getTarotCatalog()`
- `generateTarotUploadUrl()`
- `createTarotCard(...)`
- `updateTarotCard(...)`
- `archiveTarotCard({ tarotCardId })`
- `getStudentCharacter({ userId })`

### 8.3 Internal helpers
Create `convex/characterAwards.ts`:
- `ensureCharacterProfile(userId)`
- `awardXpIfNotExists({ userId, sourceType, sourceKey, xp, domainId?, meta? })`
- `applyLevelUps(profile, addedXp)`
- `unlockEligibleCards(userId, newLevel)`
- `evaluateAndAwardBadges(userId)`

---

## 9. Event Hook Integration (Existing Mutations)

Integrate XP award calls into these files:

1. `convex/goals.ts`
- In `toggleActionItem`: award XP only when item transitions from incomplete -> complete.

2. `convex/habits.ts`
- In `toggleCompletion`: award XP only when resulting state is `completed: true` and key not already awarded.

3. `convex/progress.ts`
- In `toggleActivity`: award XP only when activity transitions to complete.

4. `convex/diagnostics.ts`
- In `submitAttempt`: award pass/fail XP by attempt ID.

5. `convex/objectives.ts`
- In `updateStatus`: when status becomes `mastered`, award mastery XP once per major objective.

6. `convex/books.ts`
- In `updateStatus` and/or presentation approval mutation: award XP on `presentation_requested` and `presented` transitions.

---

## 10. Backfill Strategy (Partial)

Add one admin-only mutation in `convex/character.ts`:
- `backfillPartialCharacterXp()`

Behavior:
- Iterate students.
- For each diagnostic attempt, award XP via idempotent ledger key `diagnostic_attempt:{attemptId}`.
- For each major objective with status `mastered`, award XP via key `major_mastered:{userId}:{majorObjectiveId}`.
- Do **not** backfill goals/habits/activities/reading.
- Safe to rerun due to ledger idempotency.

---

## 11. Frontend Implementation

### 11.1 Student route + nav
- Add route in `src/App.tsx`: `/character` -> `CharacterPage`.
- Add sidebar item in `src/components/layout/Sidebar.tsx` labeled `Character`.

### 11.2 New page: `src/pages/student/CharacterPage.tsx`
Layout:
- Left column: active tarot card (large art frame)
- Right header: level + XP progress bar + next unlock hint
- Mid section: domain stats bars/cards
- Badges section: earned badges list
- Collection section: all cards (locked/unlocked/equipped), equip button on unlocked cards

Interactions:
- Equip card mutation call with optimistic UI.
- Load state skeletons.
- Clear empty-state if no cards unlocked.

### 11.3 Dashboard teaser (optional but included in v1)
- Add lightweight character snapshot card on `StudentDashboard`:
  - level
  - active card thumbnail
  - CTA to `/character`

### 11.4 Admin pages
1. `src/pages/admin/CharacterCatalogPage.tsx`
- CRUD tarot cards
- Upload image using `generateTarotUploadUrl`
- Set unlock level, rarity, active state, order

2. `src/pages/admin/StudentDetailPage.tsx`
- Add character progress card:
  - total XP, level, active card, top stats, badge count, recent XP entries

3. Admin route + nav
- Add `/admin/character` route in `src/App.tsx`
- Add sidebar item in `src/components/layout/AdminLayout.tsx`

---

## 12. Domain Label Normalization

Since stats are domain-driven, friendly labels for UI:
- if domain name includes `math` -> `Math`
- includes `writing` -> `English`
- includes `reading` -> `Reading`
- includes `coding` or `code` -> `Coding`
- otherwise fallback to domain name

This is display-only; persisted data stays domain IDs.

---

## 13. Seed and Bootstrap

- Seed default tarot cards and badge definitions in `convex/seed.ts`.
- Keep tarot card definitions editable in admin after seeding.
- Ensure at least one level-1 card exists so new students always have a starter unlock.

---

## 14. Testing Plan

### 14.1 Server/unit tests
- Idempotent XP ledger insertion
- Correct level progression and multi-level-ups
- Domain stat updates
- Card unlock boundary conditions
- Badge auto-award no duplicates

### 14.2 Mutation integration tests
- Task toggle completion awards once
- Habit completion awards once per habit/date
- Activity completion awards once
- Diagnostic pass/fail XP awarded correctly
- Mastered status awards once
- Reading milestones award on correct transitions

### 14.3 UI tests
- Student can view Character page and equip unlocked card
- Locked cards are visible but not equip-able
- Admin can create/edit/archive tarot cards
- Student detail shows character progress panel

### 14.4 Backfill tests
- Backfill awards expected totals
- Re-running backfill does not duplicate XP

---

## 15. Rollout Steps

1. Deploy schema + backend character modules.
2. Seed badge definitions + tarot starter set.
3. Deploy frontend student/admin pages and nav wiring.
4. Run one-time `backfillPartialCharacterXp`.
5. Validate sample students in admin panel.
6. Monitor for one week.

---

## 16. Monitoring & Validation Metrics

Track via temporary admin query/logging:
- XP events/day by sourceType
- duplicate sourceKey reject count
- distribution of level by cohort
- card unlock counts
- badge award counts

Success checks:
- No XP farming paths found in QA
- No duplicate awards on repeated toggles/retries
- Character page loads under normal dashboard performance constraints

---

## 17. Risks and Mitigations

1. **Risk:** Double-awards due to retries/race conditions.
- **Mitigation:** strict per-user source key idempotency ledger.

2. **Risk:** Domain mapping confusion across custom domain names.
- **Mitigation:** display normalization map + fallback to raw name.

3. **Risk:** Backfill overshoots expected XP.
- **Mitigation:** partial backfill only + dry-run reporting mutation before apply.

4. **Risk:** Large catalog image payloads.
- **Mitigation:** store optimized images in Convex storage; enforce upload size/type limits.

---

## 18. Definition of Done (v1)

- Student can open `/character`, see level, stats, badges, collection, and equip one card.
- XP updates automatically from existing learning actions using idempotent rules.
- Cards unlock deterministically by level.
- Admin can manage tarot catalog and inspect per-student character progress.
- Partial backfill runs once and is safe to re-run.
- Tests and build pass.
