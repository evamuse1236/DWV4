import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all emotion categories with their subcategories
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("emotionCategories").collect();

    const categoriesWithSubs = await Promise.all(
      categories.map(async (cat) => {
        const subcategories = await ctx.db
          .query("emotionSubcategories")
          .withIndex("by_category", (q) => q.eq("categoryId", cat._id))
          .collect();
        return { ...cat, subcategories };
      })
    );

    return categoriesWithSubs.sort((a, b) => a.order - b.order);
  },
});

/**
 * Save an emotion check-in
 */
export const saveCheckIn = mutation({
  args: {
    userId: v.id("users"),
    categoryId: v.id("emotionCategories"),
    subcategoryId: v.id("emotionSubcategories"),
    journalEntry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const checkInId = await ctx.db.insert("emotionCheckIns", {
      userId: args.userId,
      categoryId: args.categoryId,
      subcategoryId: args.subcategoryId,
      journalEntry: args.journalEntry,
      timestamp: Date.now(),
    });

    return { success: true, checkInId };
  },
});


/**
 * Update an existing emotion check-in
 */
export const updateCheckIn = mutation({
  args: {
    checkInId: v.id("emotionCheckIns"),
    categoryId: v.optional(v.id("emotionCategories")),
    subcategoryId: v.optional(v.id("emotionSubcategories")),
    journalEntry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { checkInId, ...updates } = args;
    const checkIn = await ctx.db.get(checkInId);
    if (!checkIn) return { success: false };

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(checkInId, filteredUpdates);
    return { success: true };
  },
});

/**
 * Get today's check-in for a user
 */
export const getTodayCheckIn = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const checkIns = await ctx.db
      .query("emotionCheckIns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const todayCheckIn = checkIns.find(
      (c) => c.timestamp >= startOfDay.getTime()
    );

    if (!todayCheckIn) return null;

    // Get category and subcategory details
    const category = await ctx.db.get(todayCheckIn.categoryId);
    const subcategory = await ctx.db.get(todayCheckIn.subcategoryId);

    return {
      ...todayCheckIn,
      category,
      subcategory,
    };
  },
});

/**
 * Get check-in history for a user
 */
export const getHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;

    const checkIns = await ctx.db
      .query("emotionCheckIns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by timestamp descending and limit
    const sortedCheckIns = checkIns
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    // Get category and subcategory details for each
    const checkInsWithDetails = await Promise.all(
      sortedCheckIns.map(async (checkIn) => {
        const category = await ctx.db.get(checkIn.categoryId);
        const subcategory = await ctx.db.get(checkIn.subcategoryId);
        return { ...checkIn, category, subcategory };
      })
    );

    return checkInsWithDetails;
  },
});

/**
 * Get emotion stats for a user (for dashboard)
 */
export const getStats = query({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

    const checkIns = await ctx.db
      .query("emotionCheckIns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const recentCheckIns = checkIns.filter((c) => c.timestamp >= startDate);

    // Count by category
    const categoryCounts: Record<string, number> = {};
    for (const checkIn of recentCheckIns) {
      const catId = checkIn.categoryId;
      categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
    }

    // Get category details
    const categoryStats = await Promise.all(
      Object.entries(categoryCounts).map(async ([catId, count]) => {
        const category = await ctx.db.get(catId as any);
        return { category, count };
      })
    );

    return {
      totalCheckIns: recentCheckIns.length,
      streak: calculateStreak(checkIns),
      categoryStats,
    };
  },
});

/**
 * Get all today's check-ins (admin view)
 */
export const getTodayCheckIns = query({
  args: {},
  handler: async (ctx) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const checkIns = await ctx.db.query("emotionCheckIns").collect();

    const todayCheckIns = checkIns.filter(
      (c) => c.timestamp >= startOfDay.getTime()
    );

    // Get full details for each check-in
    const checkInsWithDetails = await Promise.all(
      todayCheckIns.map(async (checkIn) => {
        const user = await ctx.db.get(checkIn.userId);
        const category = await ctx.db.get(checkIn.categoryId);
        const subcategory = await ctx.db.get(checkIn.subcategoryId);
        return { ...checkIn, user, category, subcategory };
      })
    );

    // Sort by timestamp descending (most recent first)
    return checkInsWithDetails.sort((a, b) => b.timestamp - a.timestamp);
  },
});

// Helper to format date as string key (YYYY-M-D format for comparison)
function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Helper to calculate consecutive days streak
function calculateStreak(checkIns: Array<{ timestamp: number }>): number {
  if (checkIns.length === 0) return 0;

  const dates = checkIns
    .map((c) => formatDateKey(new Date(c.timestamp)))
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort()
    .reverse();

  let streak = 0;
  const today = new Date();
  let checkDate = new Date(today);

  for (const dateStr of dates) {
    const targetDate = formatDateKey(checkDate);

    if (dateStr === targetDate) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
