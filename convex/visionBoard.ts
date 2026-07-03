import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserMatch } from "./authz";

/** Collage v2 size steps are 1..4 (S/M/L/XL). */
function clampSizeStep(step: number): number {
  return Math.min(4, Math.max(1, Math.round(step)));
}

/** Legacy named size → v2 step (mirrors src engine adapter). */
const LEGACY_SIZE_TO_STEP: Record<string, number> = {
  sm: 1,
  md: 2,
  tall: 2,
  wide: 3,
  lg: 3,
  hero: 4,
};

// ---------------------------------------------------------------------------
// Preset areas seeded on first load
// ---------------------------------------------------------------------------

const PRESET_AREAS = [
  { name: "Fun & Interests", emoji: "Sparkle" },
  { name: "Health & Fitness", emoji: "Barbell" },
  { name: "Friends", emoji: "Users" },
  { name: "Family", emoji: "House" },
  { name: "Academics & Career", emoji: "GraduationCap" },
] as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getAreas = query({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    return ctx.db
      .query("visionBoardAreas")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getCards = query({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    return ctx.db
      .query("visionBoardCards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Mutations — areas
// ---------------------------------------------------------------------------

/**
 * Idempotent: inserts 5 preset areas if the user has none.
 */
export const seedPresetAreas = mutation({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    const existing = await ctx.db
      .query("visionBoardAreas")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) return { seeded: false };

    for (const area of PRESET_AREAS) {
      await ctx.db.insert("visionBoardAreas", {
        userId: args.userId,
        name: area.name,
        emoji: area.emoji,
        isPreset: true,
      });
    }

    return { seeded: true };
  },
});

export const addArea = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    name: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    const areaId = await ctx.db.insert("visionBoardAreas", {
      userId: args.userId,
      name: args.name,
      emoji: args.emoji,
      isPreset: false,
    });
    return { areaId };
  },
});

export const updateArea = mutation({
  args: {
    token: v.string(),
    areaId: v.id("visionBoardAreas"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { token: _token, areaId, ...fields } = args;
    const area = await ctx.db.get(areaId);
    if (!area) throw new Error("Area not found");
    await requireUserMatch(ctx, args.token, area.userId);
    const updates: Record<string, unknown> = { isPreset: false };
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.emoji !== undefined) updates.emoji = fields.emoji;
    await ctx.db.patch(areaId, updates);
    return { success: true };
  },
});

export const deleteArea = mutation({
  args: { token: v.string(), areaId: v.id("visionBoardAreas") },
  handler: async (ctx, args) => {
    const area = await ctx.db.get(args.areaId);
    if (!area) throw new Error("Area not found");
    await requireUserMatch(ctx, args.token, area.userId);

    // Cascade-delete all cards in this area
    const cards = await ctx.db
      .query("visionBoardCards")
      .withIndex("by_user_area", (q) =>
        q.eq("userId", area.userId).eq("areaId", args.areaId),
      )
      .collect();

    for (const card of cards) {
      await ctx.db.delete(card._id);
    }

    await ctx.db.delete(args.areaId);
    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// Mutations — cards CRUD
// ---------------------------------------------------------------------------

export const createCard = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    areaId: v.id("visionBoardAreas"),
    cardType: v.union(
      v.literal("image_hero"),
      v.literal("counter"),
      v.literal("progress"),
      v.literal("streak"),
      v.literal("habits"),
      v.literal("mini_tile"),
      v.literal("motivation"),
      v.literal("journal"),
      v.literal("countdown"),
      v.literal("photo_strip"),
    ),
    title: v.string(),
    subtitle: v.optional(v.string()),
    emoji: v.optional(v.string()),
    colorVariant: v.union(
      v.literal("green"),
      v.literal("blue"),
      v.literal("pink"),
      v.literal("purple"),
      v.literal("orange"),
      v.literal("yellow"),
    ),
    // Collage v2 size step (1..4). Legacy named size still accepted so the
    // transition can roll back safely.
    sizeStep: v.optional(v.number()),
    size: v.optional(
      v.union(
        v.literal("sm"),
        v.literal("md"),
        v.literal("lg"),
        v.literal("tall"),
        v.literal("wide"),
        v.literal("hero"),
      ),
    ),
    // optional type-specific fields
    imageUrl: v.optional(v.string()),
    progressPercent: v.optional(v.number()),
    currentCount: v.optional(v.number()),
    targetCount: v.optional(v.number()),
    countLabel: v.optional(v.string()),
    description: v.optional(v.string()),
    totalSteps: v.optional(v.number()),
    completedSteps: v.optional(v.number()),
    stepsLabel: v.optional(v.string()),
    quote: v.optional(v.string()),
    streakCount: v.optional(v.number()),
    habits: v.optional(
      v.array(v.object({ label: v.string(), done: v.boolean() })),
    ),
    dayCount: v.optional(v.number()),
    textContent: v.optional(v.string()),
    entryDate: v.optional(v.string()),
    targetDate: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    const area = await ctx.db.get(args.areaId);
    if (!area || area.userId.toString() !== args.userId.toString()) {
      throw new Error("Unauthorized");
    }
    const { token: _token, ...cardInput } = args;
    const cardId = await ctx.db.insert("visionBoardCards", {
      ...cardInput,
      sizeStep: clampSizeStep(args.sizeStep ?? 2),
      schemaVersion: 2,
      order: Date.now(),
      createdAt: Date.now(),
    });
    return { cardId };
  },
});

export const updateCard = mutation({
  args: {
    token: v.string(),
    cardId: v.id("visionBoardCards"),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    emoji: v.optional(v.string()),
    colorVariant: v.optional(
      v.union(
        v.literal("green"),
        v.literal("blue"),
        v.literal("pink"),
        v.literal("purple"),
        v.literal("orange"),
        v.literal("yellow"),
      ),
    ),
    size: v.optional(
      v.union(
        v.literal("sm"),
        v.literal("md"),
        v.literal("lg"),
        v.literal("tall"),
        v.literal("wide"),
        v.literal("hero"),
      ),
    ),
    imageUrl: v.optional(v.string()),
    progressPercent: v.optional(v.number()),
    currentCount: v.optional(v.number()),
    targetCount: v.optional(v.number()),
    countLabel: v.optional(v.string()),
    description: v.optional(v.string()),
    totalSteps: v.optional(v.number()),
    completedSteps: v.optional(v.number()),
    stepsLabel: v.optional(v.string()),
    quote: v.optional(v.string()),
    streakCount: v.optional(v.number()),
    habits: v.optional(
      v.array(v.object({ label: v.string(), done: v.boolean() })),
    ),
    dayCount: v.optional(v.number()),
    textContent: v.optional(v.string()),
    entryDate: v.optional(v.string()),
    targetDate: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    // Collage v2
    sizeStep: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { token: _token, cardId, ...updates } = args;
    const card = await ctx.db.get(cardId);
    if (!card) throw new Error("Card not found");
    await requireUserMatch(ctx, args.token, card.userId);
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );
    if (typeof filtered.sizeStep === "number") {
      filtered.sizeStep = clampSizeStep(filtered.sizeStep);
      filtered.schemaVersion = 2;
    }
    await ctx.db.patch(cardId, filtered);
    return { success: true };
  },
});

/**
 * Lazy per-user migration of v1 cards into the collage v2 model.
 * Idempotent; fired once from the client when unmigrated cards exist.
 */
export const migrateMyCards = mutation({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    const cards = await ctx.db
      .query("visionBoardCards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let migrated = 0;
    for (const card of cards) {
      if (typeof card.sizeStep === "number") continue;
      await ctx.db.patch(card._id, {
        sizeStep: LEGACY_SIZE_TO_STEP[card.size ?? ""] ?? 2,
        schemaVersion: 2,
      });
      migrated += 1;
    }

    return { migrated };
  },
});

export const deleteCard = mutation({
  args: { token: v.string(), cardId: v.id("visionBoardCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");
    await requireUserMatch(ctx, args.token, card.userId);
    await ctx.db.delete(args.cardId);
    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// Mutations — atomic card interactions
// ---------------------------------------------------------------------------

export const incrementCounter = mutation({
  args: { token: v.string(), cardId: v.id("visionBoardCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");
    await requireUserMatch(ctx, args.token, card.userId);
    const next = Math.min(
      (card.currentCount ?? 0) + 1,
      card.targetCount ?? Infinity,
    );
    await ctx.db.patch(args.cardId, { currentCount: next });
    return { currentCount: next };
  },
});

export const incrementProgress = mutation({
  args: { token: v.string(), cardId: v.id("visionBoardCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");
    await requireUserMatch(ctx, args.token, card.userId);
    const next = Math.min(
      (card.completedSteps ?? 0) + 1,
      card.totalSteps ?? Infinity,
    );
    await ctx.db.patch(args.cardId, { completedSteps: next });
    return { completedSteps: next };
  },
});

export const incrementStreak = mutation({
  args: { token: v.string(), cardId: v.id("visionBoardCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");
    await requireUserMatch(ctx, args.token, card.userId);
    const next = (card.streakCount ?? 0) + 1;
    await ctx.db.patch(args.cardId, { streakCount: next });
    return { streakCount: next };
  },
});

export const toggleHabit = mutation({
  args: {
    token: v.string(),
    cardId: v.id("visionBoardCards"),
    habitIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");
    await requireUserMatch(ctx, args.token, card.userId);
    if (!card.habits) throw new Error("Card has no habits");

    const habits = card.habits.map((h, i) =>
      i === args.habitIndex ? { ...h, done: !h.done } : h,
    );
    await ctx.db.patch(args.cardId, { habits });
    return { success: true };
  },
});
