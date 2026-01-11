import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all students
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();
  },
});

// Get user by ID
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get student count
export const getStudentCount = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();
    return students.length;
  },
});

// Get ALL users (including admins) - for debugging
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Get today's check-in count
export const getTodayCheckInCount = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const checkIns = await ctx.db
      .query("emotionCheckIns")
      .collect();

    // Filter for today's check-ins
    const todayCheckIns = checkIns.filter((c) => {
      const checkInDate = new Date(c.timestamp).toISOString().split("T")[0];
      return checkInDate === today;
    });

    return todayCheckIns.length;
  },
});

// Get students by batch
export const getByBatch = query({
  args: { batch: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.batch) {
      return await ctx.db
        .query("users")
        .filter((q) =>
          q.and(
            q.eq(q.field("role"), "student"),
            q.eq(q.field("batch"), args.batch)
          )
        )
        .collect();
    }
    // Return all students if no batch specified
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();
  },
});

// Update user's batch
export const updateBatch = mutation({
  args: {
    userId: v.id("users"),
    batch: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { batch: args.batch });
    return { success: true };
  },
});

// Get all unique batches
export const getBatches = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();

    const batches = new Set<string>();
    for (const student of students) {
      if (student.batch) {
        batches.add(student.batch);
      }
    }

    return Array.from(batches).sort();
  },
});

// Remove a student (and their related data)
export const remove = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Delete associated emotion check-ins
    const checkIns = await ctx.db
      .query("emotionCheckIns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const checkIn of checkIns) {
      await ctx.db.delete(checkIn._id);
    }

    // Delete associated student objectives
    const objectives = await ctx.db
      .query("studentObjectives")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const obj of objectives) {
      await ctx.db.delete(obj._id);
    }

    // Delete associated activity progress
    const progress = await ctx.db
      .query("activityProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const p of progress) {
      await ctx.db.delete(p._id);
    }

    // Delete associated student books
    const books = await ctx.db
      .query("studentBooks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const book of books) {
      await ctx.db.delete(book._id);
    }

    // Delete associated goals
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const goal of goals) {
      // Delete action items for each goal
      const actions = await ctx.db
        .query("actionItems")
        .withIndex("by_goal", (q) => q.eq("goalId", goal._id))
        .collect();
      for (const action of actions) {
        await ctx.db.delete(action._id);
      }
      await ctx.db.delete(goal._id);
    }

    // Delete associated habits
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const habit of habits) {
      // Delete habit completions
      const completions = await ctx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
        .collect();
      for (const completion of completions) {
        await ctx.db.delete(completion._id);
      }
      await ctx.db.delete(habit._id);
    }

    // Finally delete the user
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});
