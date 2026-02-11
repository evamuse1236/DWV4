import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  CHARACTER_XP,
  awardXpIfNotExists,
  ensureMomentumDomain,
} from "./characterAwards";

/**
 * Get habits for a user in a sprint (with completions)
 */
export const getByUserAndSprint = query({
  args: {
    userId: v.id("users"),
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_sprint", (q) =>
        q.eq("userId", args.userId).eq("sprintId", args.sprintId)
      )
      .collect();

    // Fetch completions for each habit
    const habitsWithCompletions = await Promise.all(
      habits.map(async (habit) => {
        const completions = await ctx.db
          .query("habitCompletions")
          .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
          .collect();
        return { ...habit, completions };
      })
    );

    return habitsWithCompletions;
  },
});

/**
 * Get a habit with its completions
 */
export const getWithCompletions = query({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    if (!habit) return null;

    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();

    return { ...habit, completions };
  },
});

/**
 * Create a new habit
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    sprintId: v.id("sprints"),
    domainId: v.optional(v.id("domains")),
    name: v.string(),
    description: v.optional(v.string()),
    whatIsHabit: v.string(),
    howToPractice: v.string(),
    cue: v.optional(v.string()),
    reward: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const momentumDomainId = await ensureMomentumDomain(ctx);
    const habitId = await ctx.db.insert("habits", {
      ...args,
      domainId: momentumDomainId,
      createdAt: Date.now(),
    });
    return { success: true, habitId };
  },
});

/**
 * Update a habit
 */
export const update = mutation({
  args: {
    habitId: v.id("habits"),
    domainId: v.optional(v.id("domains")),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    whatIsHabit: v.optional(v.string()),
    howToPractice: v.optional(v.string()),
    cue: v.optional(v.string()),
    reward: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { habitId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(habitId, filteredUpdates);
    return { success: true };
  },
});

/**
 * Delete a habit and its completions
 */
export const remove = mutation({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    // Delete completions first
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();

    for (const completion of completions) {
      await ctx.db.delete(completion._id);
    }

    await ctx.db.delete(args.habitId);
    return { success: true };
  },
});

/**
 * Toggle habit completion for a date
 */
export const toggleCompletion = mutation({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    if (!habit) throw new Error("Habit not found");
    const momentumDomainId = await ensureMomentumDomain(ctx);

    // Check if completion exists
    const existing = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", args.date)
      )
      .first();

    let becameCompleted = false;
    if (existing) {
      // Toggle existing
      becameCompleted = !existing.completed;
      await ctx.db.patch(existing._id, { completed: becameCompleted });
    } else {
      // Create new completion
      await ctx.db.insert("habitCompletions", {
        habitId: args.habitId,
        userId: args.userId,
        date: args.date,
        completed: true,
      });
      becameCompleted = true;
    }

    if (becameCompleted) {
      if (habit.domainId !== momentumDomainId) {
        await ctx.db.patch(args.habitId, { domainId: momentumDomainId });
      }

      await awardXpIfNotExists(ctx, {
        userId: args.userId,
        sourceType: "habit_completion",
        sourceKey: `habit_completion:${args.habitId}:${args.date}`,
        xp: CHARACTER_XP.habitCompletion,
        domainId: momentumDomainId,
        meta: {
          habitId: args.habitId,
          date: args.date,
        },
      });
    }

    return { success: true };
  },
});

/**
 * Get habit completions for a user over a date range
 */
export const getCompletionsInRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by date range
    return completions.filter(
      (c) => c.date >= args.startDate && c.date <= args.endDate
    );
  },
});

/**
 * Get streak for a habit.
 * NOTE: Uses server UTC time for "today". For accurate timezone-aware streaks,
 * use the client-side calculateStreak in HabitTracker.tsx instead.
 */
export const getStreak = query({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();

    const completedDates = completions
      .filter((c) => c.completed)
      .map((c) => c.date)
      .sort()
      .reverse();

    if (completedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = today;

    for (const date of completedDates) {
      if (date === checkDate) {
        streak++;
        // Move to previous day
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split("T")[0];
      } else if (date < checkDate) {
        break;
      }
    }

    return streak;
  },
});
