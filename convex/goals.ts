import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get goals for a user in a sprint (with action items)
 */
export const getByUserAndSprint = query({
  args: {
    userId: v.id("users"),
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user_sprint", (q) =>
        q.eq("userId", args.userId).eq("sprintId", args.sprintId)
      )
      .collect();

    // Fetch action items for each goal
    const goalsWithActions = await Promise.all(
      goals.map(async (goal) => {
        const actionItems = await ctx.db
          .query("actionItems")
          .withIndex("by_goal", (q) => q.eq("goalId", goal._id))
          .collect();
        return {
          ...goal,
          actionItems: actionItems.sort((a, b) => a.order - b.order),
        };
      })
    );

    return goalsWithActions;
  },
});

/**
 * Get a single goal with its action items
 */
export const getWithActions = query({
  args: {
    goalId: v.id("goals"),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) return null;

    const actionItems = await ctx.db
      .query("actionItems")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();

    return { ...goal, actionItems: actionItems.sort((a, b) => a.order - b.order) };
  },
});

/**
 * Create a new goal
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    sprintId: v.id("sprints"),
    title: v.string(),
    specific: v.string(),
    measurable: v.string(),
    achievable: v.string(),
    relevant: v.string(),
    timeBound: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const goalId = await ctx.db.insert("goals", {
      ...args,
      status: "not_started",
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, goalId };
  },
});

/**
 * Update a goal
 */
export const update = mutation({
  args: {
    goalId: v.id("goals"),
    title: v.optional(v.string()),
    specific: v.optional(v.string()),
    measurable: v.optional(v.string()),
    achievable: v.optional(v.string()),
    relevant: v.optional(v.string()),
    timeBound: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed")
    )),
  },
  handler: async (ctx, args) => {
    const { goalId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(goalId, { ...filteredUpdates, updatedAt: Date.now() });
    return { success: true };
  },
});

/**
 * Delete a goal and its action items
 */
export const remove = mutation({
  args: {
    goalId: v.id("goals"),
  },
  handler: async (ctx, args) => {
    // Delete action items first
    const actionItems = await ctx.db
      .query("actionItems")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();

    for (const item of actionItems) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.goalId);
    return { success: true };
  },
});

/**
 * Add an action item to a goal
 */
export const addActionItem = mutation({
  args: {
    goalId: v.id("goals"),
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    weekNumber: v.number(),
    dayOfWeek: v.number(),
  },
  handler: async (ctx, args) => {
    // Get current max order for this goal
    const existingItems = await ctx.db
      .query("actionItems")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();

    const maxOrder = existingItems.reduce((max, item) => Math.max(max, item.order), -1);

    const itemId = await ctx.db.insert("actionItems", {
      ...args,
      isCompleted: false,
      order: maxOrder + 1,
    });

    return { success: true, itemId };
  },
});

/**
 * Toggle action item completion
 */
export const toggleActionItem = mutation({
  args: {
    itemId: v.id("actionItems"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) return { success: false };

    await ctx.db.patch(args.itemId, {
      isCompleted: !item.isCompleted,
      completedAt: !item.isCompleted ? Date.now() : undefined,
    });

    return { success: true };
  },
});


/**
 * Update an action item's content or schedule
 */
export const updateActionItem = mutation({
  args: {
    itemId: v.id("actionItems"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    weekNumber: v.optional(v.number()),
    dayOfWeek: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { itemId, ...updates } = args;
    const item = await ctx.db.get(itemId);
    if (!item) return { success: false };

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    await ctx.db.patch(itemId, filteredUpdates);
    return { success: true };
  },
});

/**
 * Delete an action item
 */
export const removeActionItem = mutation({
  args: {
    itemId: v.id("actionItems"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.itemId);
    return { success: true };
  },
});

/**
 * Get action items for a user on a specific day
 */
export const getActionItemsByDay = query({
  args: {
    userId: v.id("users"),
    weekNumber: v.number(),
    dayOfWeek: v.number(),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("actionItems")
      .withIndex("by_user_day", (q) =>
        q
          .eq("userId", args.userId)
          .eq("weekNumber", args.weekNumber)
          .eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();

    // Get goal info for each item
    const itemsWithGoals = await Promise.all(
      items.map(async (item) => {
        const goal = await ctx.db.get(item.goalId);
        return { ...item, goal };
      })
    );

    return itemsWithGoals;
  },
});
