import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get the currently active sprint
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const sprint = await ctx.db
      .query("sprints")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
    return sprint;
  },
});

/**
 * Get all sprints
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const sprints = await ctx.db.query("sprints").collect();
    return sprints.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  },
});

/**
 * Create a new sprint
 */
export const create = mutation({
  args: {
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Deactivate any current active sprint
    const activeSprint = await ctx.db
      .query("sprints")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (activeSprint) {
      await ctx.db.patch(activeSprint._id, { isActive: false });
    }

    const sprintId = await ctx.db.insert("sprints", {
      name: args.name,
      startDate: args.startDate,
      endDate: args.endDate,
      isActive: true,
      createdBy: args.createdBy,
    });

    return { success: true, sprintId };
  },
});

/**
 * Update a sprint
 */
export const update = mutation({
  args: {
    sprintId: v.id("sprints"),
    name: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sprintId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(sprintId, filteredUpdates);
    return { success: true };
  },
});

/**
 * Set active sprint
 */
export const setActive = mutation({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    // Deactivate all sprints
    const allSprints = await ctx.db.query("sprints").collect();
    for (const sprint of allSprints) {
      if (sprint.isActive) {
        await ctx.db.patch(sprint._id, { isActive: false });
      }
    }

    // Activate the selected sprint
    await ctx.db.patch(args.sprintId, { isActive: true });
    return { success: true };
  },
});

/**
 * Delete a sprint
 */
export const remove = mutation({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sprintId);
    return { success: true };
  },
});
