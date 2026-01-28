import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("visionBoardAreas")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getCards = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
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
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
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
    userId: v.id("users"),
    name: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
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
    areaId: v.id("visionBoardAreas"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { areaId, ...fields } = args;
    const updates: Record<string, unknown> = { isPreset: false };
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.emoji !== undefined) updates.emoji = fields.emoji;
    await ctx.db.patch(areaId, updates);
    return { success: true };
  },
});

export const deleteArea = mutation({
  args: { areaId: v.id("visionBoardAreas") },
  handler: async (ctx, args) => {
    const area = await ctx.db.get(args.areaId);
    if (!area) throw new Error("Area not found");

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
    size: v.union(
      v.literal("sm"),
      v.literal("md"),
      v.literal("lg"),
      v.literal("tall"),
      v.literal("wide"),
      v.literal("hero"),
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
  },
  handler: async (ctx, args) => {
    const cardId = await ctx.db.insert("visionBoardCards", {
      ...args,
      order: Date.now(),
      createdAt: Date.now(),
    });
    return { cardId };
  },
});

export const updateCard = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const { cardId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );
    await ctx.db.patch(cardId, filtered);
    return { success: true };
  },
});

export const deleteCard = mutation({
  args: { cardId: v.id("visionBoardCards") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cardId);
    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// Mutations — atomic card interactions
// ---------------------------------------------------------------------------

export const incrementCounter = mutation({
  args: { cardId: v.id("visionBoardCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");
    const next = Math.min(
      (card.currentCount ?? 0) + 1,
      card.targetCount ?? Infinity,
    );
    await ctx.db.patch(args.cardId, { currentCount: next });
    return { currentCount: next };
  },
});

export const incrementProgress = mutation({
  args: { cardId: v.id("visionBoardCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");
    const next = Math.min(
      (card.completedSteps ?? 0) + 1,
      card.totalSteps ?? Infinity,
    );
    await ctx.db.patch(args.cardId, { completedSteps: next });
    return { completedSteps: next };
  },
});

export const incrementStreak = mutation({
  args: { cardId: v.id("visionBoardCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");
    const next = (card.streakCount ?? 0) + 1;
    await ctx.db.patch(args.cardId, { streakCount: next });
    return { streakCount: next };
  },
});

export const toggleHabit = mutation({
  args: {
    cardId: v.id("visionBoardCards"),
    habitIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");
    if (!card.habits) throw new Error("Card has no habits");

    const habits = card.habits.map((h, i) =>
      i === args.habitIndex ? { ...h, done: !h.done } : h,
    );
    await ctx.db.patch(args.cardId, { habits });
    return { success: true };
  },
});
