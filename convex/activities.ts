import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get activities for an objective
export const getByObjective = query({
  args: { objectiveId: v.id("learningObjectives") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("objectiveId"), args.objectiveId))
      .collect();
  },
});

// Create an activity (admin only)
export const create = mutation({
  args: {
    objectiveId: v.id("learningObjectives"),
    title: v.string(),
    type: v.union(
      v.literal("video"),
      v.literal("exercise"),
      v.literal("reading"),
      v.literal("project"),
      v.literal("game")
    ),
    url: v.string(),
    platform: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", args);
  },
});

// Update activity
export const update = mutation({
  args: {
    activityId: v.id("activities"),
    title: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("video"),
        v.literal("exercise"),
        v.literal("reading"),
        v.literal("project"),
        v.literal("game")
      )
    ),
    url: v.optional(v.string()),
    platform: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { activityId, ...updates } = args;
    await ctx.db.patch(activityId, updates);
  },
});

// Delete activity
export const remove = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.activityId);
  },
});
