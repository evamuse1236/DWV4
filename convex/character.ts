import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  CHARACTER_XP,
  awardXpIfNotExists,
  domainStatLevelForDomain,
  ensureCharacterProfile,
  getDomainLevelSnapshot,
  ensureMomentumDomain,
  getReadingDomainId,
  inferDomainIdFromText,
  isStudentCharacterSystemEnabled,
  isCardEligibleForSnapshot,
  refreshProfileFromDomainLevels,
  unlockEligibleCards,
} from "./characterAwards";

const tarotRarity = v.union(
  v.literal("common"),
  v.literal("rare"),
  v.literal("epic"),
  v.literal("legendary")
);

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function toCardWithExtras(ctx: any, card: any) {
  const [imageUrl, domainAffinity] = await Promise.all([
    ctx.storage.getUrl(card.imageStorageId),
    card.domainAffinityId ? ctx.db.get(card.domainAffinityId) : null,
  ]);
  return {
    ...card,
    imageUrl,
    domainAffinity,
  };
}

async function buildCharacterPayload(
  ctx: any,
  userId: Id<"users">,
  options?: { timelineLimit?: number; includeUnlockRequirements?: boolean }
) {
  const profile = await ctx.db
    .query("characterProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  const snapshot = await getDomainLevelSnapshot(ctx, userId);

  const effectiveProfile = {
    userId,
    totalXp: snapshot.totalXp,
    level: snapshot.overallLevel,
    xpIntoLevel: snapshot.xpIntoLevel,
    xpNeededForNextLevel: snapshot.xpNeededForNextLevel,
    activeTarotCardId: profile?.activeTarotCardId,
  };

  const [domainStatsRows, unlockedRows, badgeRows, timelineRows, allCards] =
    await Promise.all([
      ctx.db
        .query("characterDomainStats")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("studentTarotUnlocks")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("studentBadges")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("characterXpLedger")
        .withIndex("by_user_awardedAt", (q: any) => q.eq("userId", userId))
        .order("desc")
        .take(Math.max(1, Math.min(options?.timelineLimit ?? 20, 100))),
      ctx.db.query("tarotCards").collect(),
    ]);

  const allCardsSorted = [...allCards].sort((a, b) => {
    const activeDiff = Number(b.isActive) - Number(a.isActive);
    if (activeDiff !== 0) return activeDiff;
    const unlockDiff = a.unlockLevel - b.unlockLevel;
    if (unlockDiff !== 0) return unlockDiff;
    return a.displayOrder - b.displayOrder;
  });

  const unlockedByCardId = new Map<string, any>();
  for (const row of unlockedRows) {
    unlockedByCardId.set(row.tarotCardId.toString(), row);
  }

  // For read paths, treat level-eligible active cards as unlocked even if unlock rows
  // haven't been persisted yet (e.g. a brand-new level-1 student profile).
  for (const card of allCardsSorted) {
    if (
      !unlockedByCardId.has(card._id.toString()) &&
      isCardEligibleForSnapshot(card, {
        overallLevel: effectiveProfile.level,
        domainLevels: snapshot.domainLevels,
      })
    ) {
      unlockedByCardId.set(card._id.toString(), {
        tarotCardId: card._id,
        unlockedAt: undefined,
        unlockReason: "level",
      });
    }
  }

  let effectiveActiveCardId = effectiveProfile.activeTarotCardId;
  if (!effectiveActiveCardId) {
    const fallbackCard = allCardsSorted.find((card) =>
      unlockedByCardId.has(card._id.toString())
    );
    effectiveActiveCardId = fallbackCard?._id;
  }

  const cards = await Promise.all(
    allCardsSorted.map(async (card) => {
      const cardWithExtras = await toCardWithExtras(ctx, card);
      const unlock = unlockedByCardId.get(card._id.toString()) ?? null;
      const includeUnlockRequirements =
        options?.includeUnlockRequirements !== false;
      return {
        ...cardWithExtras,
        unlockLevel: includeUnlockRequirements ? card.unlockLevel : undefined,
        domainAffinity: includeUnlockRequirements
          ? cardWithExtras.domainAffinity
          : null,
        domainAffinityId: includeUnlockRequirements ? card.domainAffinityId : undefined,
        unlocked: Boolean(unlock),
        unlockedAt: unlock?.unlockedAt,
        unlockReason: unlock?.unlockReason,
        equipped: effectiveActiveCardId === card._id,
      };
    })
  );

  const activeCard = cards.find((card) => card._id === effectiveActiveCardId) ?? null;

  const nextUnlock =
    options?.includeUnlockRequirements === false
      ? null
      : cards
          .filter(
            (card) =>
              card.isActive &&
              !isCardEligibleForSnapshot(card, {
                overallLevel: effectiveProfile.level,
                domainLevels: snapshot.domainLevels,
              })
          )
          .sort((a, b) => {
            const levelDiff = a.unlockLevel - b.unlockLevel;
            if (levelDiff !== 0) return levelDiff;
            return a.displayOrder - b.displayOrder;
          })[0] ?? null;

  const domainStatsById = new Map<string, any>(
    domainStatsRows.map((row: any) => [row.domainId.toString(), row])
  );
  const domainStats = snapshot.allDomains
    .map((domain: any) => {
      const row = domainStatsById.get(domain._id.toString());
      const snapshotDomain = snapshot.domainLevels.get(domain._id.toString());
      return {
        _id: row?._id || (`virtual:${userId}:${domain._id}` as any),
        userId,
        domainId: domain._id,
        xp: snapshotDomain?.xp ?? row?.xp ?? 0,
        statLevel: snapshotDomain?.level ?? row?.statLevel ?? 1,
        updatedAt: row?.updatedAt ?? null,
        domain,
      };
    })
    .sort((a, b) => {
      const levelDiff = b.statLevel - a.statLevel;
      if (levelDiff !== 0) return levelDiff;
      const xpDiff = b.xp - a.xp;
      if (xpDiff !== 0) return xpDiff;
      return (a.domain?.order ?? 0) - (b.domain?.order ?? 0);
    });

  const badgeDefs = await ctx.db.query("badgeDefinitions").collect();
  const badgeByCode = new Map(badgeDefs.map((badge: any) => [badge.code, badge]));
  const badges = badgeRows
    .map((row: any) => ({
      ...row,
      definition: badgeByCode.get(row.badgeCode) ?? null,
    }))
    .sort((a: any, b: any) => {
      const aOrder = a.definition?.displayOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.definition?.displayOrder ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.awardedAt - a.awardedAt;
    });

  const timeline = await Promise.all(
    timelineRows.map(async (row: any) => ({
      ...row,
      domain: row.domainId ? await ctx.db.get(row.domainId) : null,
    }))
  );

  return {
    profile: {
      ...effectiveProfile,
      activeTarotCardId: effectiveActiveCardId,
    },
    levelProgress: {
      level: effectiveProfile.level,
      totalXp: effectiveProfile.totalXp,
      xpIntoLevel: effectiveProfile.xpIntoLevel,
      xpNeededForNextLevel: effectiveProfile.xpNeededForNextLevel,
      progressPercent:
        effectiveProfile.xpNeededForNextLevel > 0
          ? Math.round(
              (effectiveProfile.xpIntoLevel / effectiveProfile.xpNeededForNextLevel) *
                100
            )
          : 0,
    },
    activeCard,
    unlockedCards: cards.filter((card) => card.unlocked),
    collection: cards,
    domainStats,
    badges,
    recentXp: timeline,
    nextUnlock,
  };
}

export const getMyCharacter = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    if (!isStudentCharacterSystemEnabled()) return null;
    return await buildCharacterPayload(ctx, args.userId, {
      timelineLimit: 25,
      includeUnlockRequirements: false,
    });
  },
});

export const getMyCollection = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    if (!isStudentCharacterSystemEnabled()) {
      return {
        activeTarotCardId: null,
        collection: [],
        unlockedCount: 0,
        totalCount: 0,
      };
    }

    const data = await buildCharacterPayload(ctx, args.userId, {
      timelineLimit: 1,
      includeUnlockRequirements: false,
    });
    return {
      activeTarotCardId: data.profile.activeTarotCardId,
      collection: data.collection,
      unlockedCount: data.unlockedCards.length,
      totalCount: data.collection.length,
    };
  },
});

export const getMyTimeline = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!isStudentCharacterSystemEnabled()) return [];

    const limit = Math.max(1, Math.min(args.limit ?? 25, 100));
    const rows = await ctx.db
      .query("characterXpLedger")
      .withIndex("by_user_awardedAt", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return await Promise.all(
      rows.map(async (row: any) => ({
        ...row,
        domain: row.domainId ? await ctx.db.get(row.domainId) : null,
      }))
    );
  },
});

export const equipCard = mutation({
  args: {
    userId: v.id("users"),
    tarotCardId: v.id("tarotCards"),
  },
  handler: async (ctx, args) => {
    if (!isStudentCharacterSystemEnabled()) {
      throw new Error("Character system is currently inactive.");
    }

    const [card, profile, unlock] = await Promise.all([
      ctx.db.get(args.tarotCardId),
      ensureCharacterProfile(ctx, args.userId),
      ctx.db
        .query("studentTarotUnlocks")
        .withIndex("by_user_card", (q: any) =>
          q.eq("userId", args.userId).eq("tarotCardId", args.tarotCardId)
        )
        .first(),
    ]);

    if (!card) {
      throw new Error("Tarot card not found.");
    }
    if (!card.isActive) {
      throw new Error("Card is not active.");
    }

    const snapshot = await getDomainLevelSnapshot(ctx, args.userId);
    const eligible = isCardEligibleForSnapshot(card, {
      overallLevel: snapshot.overallLevel,
      domainLevels: snapshot.domainLevels,
    });

    if (!unlock && !eligible) {
      throw new Error("Card is locked.");
    }

    if (!unlock && eligible) {
      await ctx.db.insert("studentTarotUnlocks", {
        userId: args.userId,
        tarotCardId: args.tarotCardId,
        unlockedAt: Date.now(),
        unlockReason: "level",
      });
    }

    await ctx.db.patch(profile._id, {
      activeTarotCardId: args.tarotCardId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getTarotCatalog = query({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("tarotCards").collect();
    const sorted = [...cards].sort((a, b) => {
      const activeDiff = Number(b.isActive) - Number(a.isActive);
      if (activeDiff !== 0) return activeDiff;
      const levelDiff = a.unlockLevel - b.unlockLevel;
      if (levelDiff !== 0) return levelDiff;
      return a.displayOrder - b.displayOrder;
    });

    return await Promise.all(sorted.map((card) => toCardWithExtras(ctx, card)));
  },
});

export const generateTarotUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

export const createTarotCard = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    imageStorageId: v.id("_storage"),
    unlockLevel: v.number(),
    domainAffinityId: v.optional(v.id("domains")),
    rarity: tarotRarity,
    isActive: v.optional(v.boolean()),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const slug = normalizeSlug(args.slug || args.name);
    const existingSlug = await ctx.db
      .query("tarotCards")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();
    if (existingSlug) {
      throw new Error("A tarot card with this slug already exists.");
    }

    const now = Date.now();
    let displayOrder = args.displayOrder;
    if (displayOrder === undefined) {
      const cards = await ctx.db.query("tarotCards").collect();
      displayOrder =
        cards.length === 0
          ? 0
          : Math.max(...cards.map((card: any) => card.displayOrder)) + 1;
    }

    const tarotCardId = await ctx.db.insert("tarotCards", {
      name: args.name.trim(),
      slug,
      description: args.description?.trim() || undefined,
      imageStorageId: args.imageStorageId,
      unlockLevel: Math.max(1, Math.floor(args.unlockLevel)),
      domainAffinityId: args.domainAffinityId,
      rarity: args.rarity,
      isActive: args.isActive ?? true,
      displayOrder,
      createdAt: now,
      updatedAt: now,
    });

    return { tarotCardId };
  },
});

export const updateTarotCard = mutation({
  args: {
    tarotCardId: v.id("tarotCards"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    unlockLevel: v.optional(v.number()),
    domainAffinityId: v.optional(v.id("domains")),
    rarity: v.optional(tarotRarity),
    isActive: v.optional(v.boolean()),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.tarotCardId);
    if (!card) throw new Error("Tarot card not found.");

    const updates: any = {};

    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.description !== undefined) {
      updates.description = args.description?.trim() || undefined;
    }
    if (args.imageStorageId !== undefined) updates.imageStorageId = args.imageStorageId;
    if (args.unlockLevel !== undefined) {
      updates.unlockLevel = Math.max(1, Math.floor(args.unlockLevel));
    }
    if (args.domainAffinityId !== undefined) updates.domainAffinityId = args.domainAffinityId;
    if (args.rarity !== undefined) updates.rarity = args.rarity;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.displayOrder !== undefined) updates.displayOrder = args.displayOrder;

    if (args.slug !== undefined || args.name !== undefined) {
      const targetSlug = normalizeSlug(args.slug || args.name || card.slug);
      const existingSlug = await ctx.db
        .query("tarotCards")
        .withIndex("by_slug", (q: any) => q.eq("slug", targetSlug))
        .first();
      if (existingSlug && existingSlug._id !== card._id) {
        throw new Error("A tarot card with this slug already exists.");
      }
      updates.slug = targetSlug;
    }

    updates.updatedAt = Date.now();
    await ctx.db.patch(args.tarotCardId, updates);

    return { success: true };
  },
});

export const archiveTarotCard = mutation({
  args: { tarotCardId: v.id("tarotCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.tarotCardId);
    if (!card) throw new Error("Tarot card not found.");
    await ctx.db.patch(args.tarotCardId, {
      isActive: false,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const getStudentCharacter = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const [user, character] = await Promise.all([
      ctx.db.get(args.userId),
      buildCharacterPayload(ctx, args.userId, { timelineLimit: 20 }),
    ]);

    return {
      user,
      ...character,
      summary: {
        totalXp: character.profile.totalXp,
        level: character.profile.level,
        badgeCount: character.badges.length,
        unlockedCards: character.unlockedCards.length,
      },
    };
  },
});

export const backfillPartialCharacterXp = mutation({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db
      .query("users")
      .withIndex("by_role", (q: any) => q.eq("role", "student"))
      .collect();

    let diagnosticAwards = 0;
    let masteredAwards = 0;
    let starterUnlocks = 0;

    for (const student of students) {
      await ensureCharacterProfile(ctx, student._id);
      const unlockResult = await unlockEligibleCards(ctx, student._id);
      starterUnlocks += unlockResult.newlyUnlocked.length;

      const attempts = await ctx.db
        .query("diagnosticAttempts")
        .filter((q: any) => q.eq(q.field("userId"), student._id))
        .collect();

      for (const attempt of attempts) {
        const diagnosticAward = await awardXpIfNotExists(ctx, {
          userId: student._id,
          sourceType: "diagnostic_attempt",
          sourceKey: `diagnostic_attempt:${attempt._id}`,
          xp: attempt.passed ? CHARACTER_XP.diagnosticPass : CHARACTER_XP.diagnosticFail,
          domainId: attempt.domainId,
          meta: {
            passed: attempt.passed,
            score: attempt.score,
            scorePercent: attempt.scorePercent,
          },
        });
        if (diagnosticAward.awarded) diagnosticAwards += 1;
      }

      const masteredMajorRows = await ctx.db
        .query("studentMajorObjectives")
        .withIndex("by_user", (q: any) => q.eq("userId", student._id))
        .filter((q: any) => q.eq(q.field("status"), "mastered"))
        .collect();

      for (const row of masteredMajorRows) {
        const major = await ctx.db.get(row.majorObjectiveId);
        if (!major) continue;
        const masteredAward = await awardXpIfNotExists(ctx, {
          userId: student._id,
          sourceType: "major_mastered",
          sourceKey: `major_mastered:${student._id}:${row.majorObjectiveId}`,
          xp: CHARACTER_XP.majorMastered,
          domainId: major.domainId,
          meta: {
            majorObjectiveId: row.majorObjectiveId,
            masteredAt: row.masteredAt,
          },
        });
        if (masteredAward.awarded) masteredAwards += 1;
      }
    }

    return {
      success: true,
      studentsProcessed: students.length,
      diagnosticAwards,
      masteredAwards,
      starterUnlocks,
    };
  },
});

export const backfillMissingXpDomains = mutation({
  args: {},
  handler: async (ctx) => {
    const readingDomainId = await getReadingDomainId(ctx);
    const momentumDomainId = await ensureMomentumDomain(ctx);
    const ledgerRows = await ctx.db.query("characterXpLedger").collect();

    let actionItemsPatched = 0;
    let habitsPatched = 0;
    let ledgerPatched = 0;
    const touchedUsers = new Set<string>();

    for (const row of ledgerRows) {
      if (row.domainId) continue;

      let resolvedDomainId: Id<"domains"> | undefined;

      if (row.sourceType === "action_item") {
        const parts = row.sourceKey.split(":");
        const actionItemId = parts.length >= 2 ? (parts[1] as Id<"actionItems">) : null;
        if (actionItemId) {
          const item = await ctx.db.get(actionItemId);
          if (item) {
            resolvedDomainId = item.domainId ?? momentumDomainId;
            if (!resolvedDomainId) {
              const goal = item.goalId ? await ctx.db.get(item.goalId) : null;
              resolvedDomainId =
                goal?.domainId ?? momentumDomainId;
              if (resolvedDomainId) {
                await ctx.db.patch(item._id, { domainId: resolvedDomainId });
                actionItemsPatched += 1;
              }
            }
          }
        }
      } else if (row.sourceType === "habit_completion") {
        const parts = row.sourceKey.split(":");
        const habitId = parts.length >= 2 ? (parts[1] as Id<"habits">) : null;
        if (habitId) {
          const habit = await ctx.db.get(habitId);
          if (habit) {
            resolvedDomainId = habit.domainId ?? momentumDomainId;
            if (!resolvedDomainId) {
              resolvedDomainId = momentumDomainId;
              if (resolvedDomainId) {
                await ctx.db.patch(habit._id, { domainId: resolvedDomainId });
                habitsPatched += 1;
              }
            }
          }
        }
      } else if (row.sourceType === "reading_milestone") {
        resolvedDomainId = readingDomainId;
      }

      if (!resolvedDomainId) continue;

      await ctx.db.patch(row._id, { domainId: resolvedDomainId });
      ledgerPatched += 1;
      touchedUsers.add(row.userId.toString());
    }

    let refreshedUsers = 0;
    for (const userId of touchedUsers) {
      await refreshProfileFromDomainLevels(ctx, userId as Id<"users">);
      await unlockEligibleCards(ctx, userId as Id<"users">);
      refreshedUsers += 1;
    }

    return {
      success: true,
      ledgerPatched,
      actionItemsPatched,
      habitsPatched,
      refreshedUsers,
    };
  },
});

export const backfillStarterTarotAffinities = mutation({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("tarotCards").collect();
    const now = Date.now();

    const affinityHints = new Map<string, string[]>([
      ["the-initiate", ["math", "mathematics", "numbers"]],
      ["the-storyweaver", ["writing", "english", "language"]],
      ["the-archivist", ["reading", "books", "literature"]],
      ["the-compiler", ["coding", "code", "programming"]],
    ]);

    let cardsPatched = 0;
    for (const card of cards) {
      if (card.domainAffinityId) continue;

      const hints = affinityHints.get(card.slug);
      if (!hints) continue;

      const inferredDomainId = await inferDomainIdFromText(ctx, [
        ...hints,
        card.name,
        card.description,
      ]);
      if (!inferredDomainId) continue;

      await ctx.db.patch(card._id, {
        domainAffinityId: inferredDomainId,
        updatedAt: now,
      });
      cardsPatched += 1;
    }

    return {
      success: true,
      cardsPatched,
    };
  },
});

export const migrateTasksAndHabitsToMomentum = mutation({
  args: {},
  handler: async (ctx) => {
    const momentumDomainId = await ensureMomentumDomain(ctx);
    const [goals, actionItems, habits, ledgerRows] = await Promise.all([
      ctx.db.query("goals").collect(),
      ctx.db.query("actionItems").collect(),
      ctx.db.query("habits").collect(),
      ctx.db.query("characterXpLedger").collect(),
    ]);
    const domains = await ctx.db.query("domains").collect();
    const domainNameById = new Map(
      domains.map((domain: any) => [domain._id.toString(), domain.name])
    );

    let goalsPatched = 0;
    for (const goal of goals) {
      if (goal.domainId === momentumDomainId) continue;
      await ctx.db.patch(goal._id, { domainId: momentumDomainId });
      goalsPatched += 1;
    }

    let actionItemsPatched = 0;
    for (const item of actionItems) {
      if (item.domainId === momentumDomainId) continue;
      await ctx.db.patch(item._id, { domainId: momentumDomainId });
      actionItemsPatched += 1;
    }

    let habitsPatched = 0;
    for (const habit of habits) {
      if (habit.domainId === momentumDomainId) continue;
      await ctx.db.patch(habit._id, { domainId: momentumDomainId });
      habitsPatched += 1;
    }

    const touchedUsers = new Set<string>();
    let ledgerPatched = 0;
    for (const row of ledgerRows) {
      if (
        row.sourceType !== "action_item" &&
        row.sourceType !== "habit_completion"
      ) {
        continue;
      }
      if (row.domainId === momentumDomainId) continue;
      await ctx.db.patch(row._id, { domainId: momentumDomainId });
      ledgerPatched += 1;
      touchedUsers.add(row.userId.toString());
    }

    // Rebuild per-user domain stats from the ledger after migration.
    let refreshedUsers = 0;
    for (const userId of touchedUsers) {
      const userLedger = await ctx.db
        .query("characterXpLedger")
        .withIndex("by_user_awardedAt", (q: any) => q.eq("userId", userId as Id<"users">))
        .collect();

      const xpByDomain = new Map<string, number>();
      for (const row of userLedger) {
        if (!row.domainId) continue;
        const key = row.domainId.toString();
        xpByDomain.set(key, (xpByDomain.get(key) ?? 0) + Math.max(0, row.xpAwarded));
      }

      const stats = await ctx.db
        .query("characterDomainStats")
        .withIndex("by_user", (q: any) => q.eq("userId", userId as Id<"users">))
        .collect();
      const statByDomain = new Map<string, any>(
        stats.map((stat: any) => [stat.domainId.toString(), stat])
      );

      for (const [domainId, xp] of xpByDomain.entries()) {
        const existing = statByDomain.get(domainId);
        if (existing) {
          await ctx.db.patch(existing._id, {
            xp,
            statLevel: domainStatLevelForDomain(
              xp,
              domainNameById.get(domainId) ?? null
            ),
            updatedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("characterDomainStats", {
            userId: userId as Id<"users">,
            domainId: domainId as Id<"domains">,
            xp,
            statLevel: domainStatLevelForDomain(
              xp,
              domainNameById.get(domainId) ?? null
            ),
            updatedAt: Date.now(),
          });
        }
        statByDomain.delete(domainId);
      }

      // Keep rows for untouched domains at zero XP to avoid stale totals.
      for (const stale of statByDomain.values()) {
        await ctx.db.patch(stale._id, {
          xp: 0,
          statLevel: 1,
          updatedAt: Date.now(),
        });
      }

      await refreshProfileFromDomainLevels(ctx, userId as Id<"users">);
      await unlockEligibleCards(ctx, userId as Id<"users">);
      refreshedUsers += 1;
    }

    return {
      success: true,
      momentumDomainId,
      goalsPatched,
      actionItemsPatched,
      habitsPatched,
      ledgerPatched,
      refreshedUsers,
    };
  },
});

export const recomputeCharacterDomainLevels = mutation({
  args: {},
  handler: async (ctx) => {
    const [domains, stats, students] = await Promise.all([
      ctx.db.query("domains").collect(),
      ctx.db.query("characterDomainStats").collect(),
      ctx.db
        .query("users")
        .withIndex("by_role", (q: any) => q.eq("role", "student"))
        .collect(),
    ]);

    const domainNameById = new Map(
      domains.map((domain: any) => [domain._id.toString(), domain.name])
    );

    let statsPatched = 0;
    for (const stat of stats) {
      const targetLevel = domainStatLevelForDomain(
        stat.xp,
        domainNameById.get(stat.domainId.toString()) ?? null
      );
      if (stat.statLevel === targetLevel) continue;
      await ctx.db.patch(stat._id, {
        statLevel: targetLevel,
        updatedAt: Date.now(),
      });
      statsPatched += 1;
    }

    let profilesRefreshed = 0;
    let unlocksUpdated = 0;
    for (const student of students) {
      await refreshProfileFromDomainLevels(ctx, student._id);
      profilesRefreshed += 1;
      const unlockResult = await unlockEligibleCards(ctx, student._id);
      unlocksUpdated += unlockResult.newlyUnlocked.length;
    }

    return {
      success: true,
      statsPatched,
      profilesRefreshed,
      unlocksUpdated,
    };
  },
});
