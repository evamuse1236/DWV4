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
 * Add an action item to a goal (or standalone task if goalId is null)
 */
export const addActionItem = mutation({
  args: {
    goalId: v.optional(v.id("goals")), // Optional - null for standalone tasks
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    weekNumber: v.number(),
    dayOfWeek: v.number(),
  },
  handler: async (ctx, args) => {
    let maxOrder = -1;

    if (args.goalId) {
      // Get current max order for this goal
      const existingItems = await ctx.db
        .query("actionItems")
        .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
        .collect();
      maxOrder = existingItems.reduce((max, item) => Math.max(max, item.order), -1);
    } else {
      // For standalone tasks, get max order across user's tasks for this week/day
      const existingItems = await ctx.db
        .query("actionItems")
        .withIndex("by_user_day", (q) =>
          q
            .eq("userId", args.userId)
            .eq("weekNumber", args.weekNumber)
            .eq("dayOfWeek", args.dayOfWeek)
        )
        .filter((q) => q.eq(q.field("goalId"), undefined))
        .collect();
      maxOrder = existingItems.reduce((max, item) => Math.max(max, item.order), -1);
    }

    const itemId = await ctx.db.insert("actionItems", {
      goalId: args.goalId, // Will be undefined for standalone tasks
      userId: args.userId,
      title: args.title,
      description: args.description,
      weekNumber: args.weekNumber,
      dayOfWeek: args.dayOfWeek,
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
    scheduledTime: v.optional(v.string()),
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

    // Get goal info for each item (null for standalone tasks)
    const itemsWithGoals = await Promise.all(
      items.map(async (item) => {
        const goal = item.goalId ? await ctx.db.get(item.goalId) : null;
        return { ...item, goal };
      })
    );

    return itemsWithGoals;
  },
});

/**
 * Get standalone action items (tasks without a goal) for a user in a given week
 */
export const getStandaloneActionItems = query({
  args: {
    userId: v.id("users"),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all action items for the user in this week
    const allItems = await ctx.db
      .query("actionItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("weekNumber"), args.weekNumber),
          q.eq(q.field("goalId"), undefined)
        )
      )
      .collect();

    return allItems.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get goals from the previous sprint (for import feature)
 */
export const getPreviousSprintGoals = query({
  args: {
    userId: v.id("users"),
    currentSprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    // Get all sprints to find the previous one
    const sprints = await ctx.db
      .query("sprints")
      .order("desc")
      .collect();

    // Find the current sprint's index
    const currentIndex = sprints.findIndex((s) => s._id === args.currentSprintId);

    // Get the previous sprint (if exists)
    const previousSprint = currentIndex >= 0 && currentIndex < sprints.length - 1
      ? sprints[currentIndex + 1]
      : null;

    if (!previousSprint) {
      return [];
    }

    // Get goals from the previous sprint
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user_sprint", (q) =>
        q.eq("userId", args.userId).eq("sprintId", previousSprint._id)
      )
      .collect();

    return goals.map((goal) => ({
      _id: goal._id,
      title: goal.title,
      specific: goal.specific,
      measurable: goal.measurable,
      achievable: goal.achievable,
      relevant: goal.relevant,
      timeBound: goal.timeBound,
      sprintName: previousSprint.name,
    }));
  },
});

/**
 * Copy action items from one goal to another (resets completion status)
 */
async function copyActionItems(
  ctx: { db: any },
  sourceGoalId: any,
  targetGoalId: any
): Promise<void> {
  const actionItems = await ctx.db
    .query("actionItems")
    .withIndex("by_goal", (q: any) => q.eq("goalId", sourceGoalId))
    .collect();

  for (const item of actionItems) {
    await ctx.db.insert("actionItems", {
      goalId: targetGoalId,
      userId: item.userId,
      title: item.title,
      description: item.description,
      weekNumber: item.weekNumber,
      dayOfWeek: item.dayOfWeek,
      isCompleted: false,
      order: item.order,
    });
  }
}

/**
 * Duplicate an existing goal (optionally with action items)
 */
export const duplicate = mutation({
  args: {
    goalId: v.id("goals"),
    targetSprintId: v.optional(v.id("sprints")),
    includeActionItems: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const sourceGoal = await ctx.db.get(args.goalId);
    if (!sourceGoal) {
      return { success: false, error: "Goal not found" };
    }

    const now = Date.now();
    const newGoalId = await ctx.db.insert("goals", {
      userId: sourceGoal.userId,
      sprintId: args.targetSprintId || sourceGoal.sprintId,
      title: `${sourceGoal.title} (copy)`,
      specific: sourceGoal.specific,
      measurable: sourceGoal.measurable,
      achievable: sourceGoal.achievable,
      relevant: sourceGoal.relevant,
      timeBound: sourceGoal.timeBound,
      status: "not_started",
      createdAt: now,
      updatedAt: now,
    });

    if (args.includeActionItems !== false) {
      await copyActionItems(ctx, args.goalId, newGoalId);
    }

    return { success: true, goalId: newGoalId };
  },
});

/**
 * Import a goal from a previous sprint to the current sprint
 */
export const importGoal = mutation({
  args: {
    goalId: v.id("goals"),
    targetSprintId: v.id("sprints"),
    includeActionItems: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const sourceGoal = await ctx.db.get(args.goalId);
    if (!sourceGoal) {
      return { success: false, error: "Goal not found" };
    }

    const now = Date.now();
    const newGoalId = await ctx.db.insert("goals", {
      userId: sourceGoal.userId,
      sprintId: args.targetSprintId,
      title: sourceGoal.title,
      specific: sourceGoal.specific,
      measurable: sourceGoal.measurable,
      achievable: sourceGoal.achievable,
      relevant: sourceGoal.relevant,
      timeBound: sourceGoal.timeBound,
      status: "not_started",
      createdAt: now,
      updatedAt: now,
    });

    if (args.includeActionItems !== false) {
      await copyActionItems(ctx, args.goalId, newGoalId);
    }

    return { success: true, goalId: newGoalId };
  },
});
