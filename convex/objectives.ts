import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all learning objectives (admin)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const objectives = await ctx.db.query("learningObjectives").collect();

    return await Promise.all(
      objectives.map(async (obj) => {
        const domain = await ctx.db.get(obj.domainId);
        // Count how many students have this objective assigned
        const assignments = await ctx.db
          .query("studentObjectives")
          .filter((q) => q.eq(q.field("objectiveId"), obj._id))
          .collect();

        return {
          ...obj,
          domain,
          assignedCount: assignments.length,
          masteredCount: assignments.filter((a) => a.status === "mastered").length,
        };
      })
    );
  },
});

// Get all learning objectives for a domain
export const getByDomain = query({
  args: { domainId: v.id("domains") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learningObjectives")
      .filter((q) => q.eq(q.field("domainId"), args.domainId))
      .collect();
  },
});

// Get objectives assigned to a student
export const getAssignedToStudent = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const studentObjectives = await ctx.db
      .query("studentObjectives")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    // Fetch full objective details
    const objectives = await Promise.all(
      studentObjectives.map(async (so) => {
        const objective = await ctx.db.get(so.objectiveId);
        const domain = objective ? await ctx.db.get(objective.domainId) : null;
        return {
          ...so,
          objective,
          domain,
        };
      })
    );

    return objectives;
  },
});

// Get objectives assigned to student by domain
export const getAssignedByDomain = query({
  args: { userId: v.id("users"), domainId: v.id("domains") },
  handler: async (ctx, args) => {
    const studentObjectives = await ctx.db
      .query("studentObjectives")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    // Fetch objectives and filter by domain
    const objectives = await Promise.all(
      studentObjectives.map(async (so) => {
        const objective = await ctx.db.get(so.objectiveId);
        if (objective && objective.domainId === args.domainId) {
          // Get activities for this objective
          const activities = await ctx.db
            .query("activities")
            .filter((q) => q.eq(q.field("objectiveId"), so.objectiveId))
            .collect();

          // Get activity progress
          const progress = await ctx.db
            .query("activityProgress")
            .filter((q) =>
              q.and(
                q.eq(q.field("userId"), args.userId),
                q.eq(q.field("studentObjectiveId"), so._id)
              )
            )
            .collect();

          const progressMap = new Map(progress.map((p) => [p.activityId, p]));

          return {
            ...so,
            objective,
            activities: activities.map((a) => ({
              ...a,
              progress: progressMap.get(a._id),
            })),
          };
        }
        return null;
      })
    );

    return objectives.filter(Boolean);
  },
});

// Create a learning objective (admin only)
export const create = mutation({
  args: {
    domainId: v.id("domains"),
    title: v.string(),
    description: v.string(),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedHours: v.number(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("learningObjectives", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Update a learning objective (admin only)
export const update = mutation({
  args: {
    objectiveId: v.id("learningObjectives"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    estimatedHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { objectiveId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(objectiveId, filteredUpdates);
    return { success: true };
  },
});

// Remove a learning objective and its related data (admin only)
export const remove = mutation({
  args: { objectiveId: v.id("learningObjectives") },
  handler: async (ctx, args) => {
    // Delete associated activities
    const activities = await ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("objectiveId"), args.objectiveId))
      .collect();
    for (const activity of activities) {
      // Delete activity progress for this activity
      const progress = await ctx.db
        .query("activityProgress")
        .filter((q) => q.eq(q.field("activityId"), activity._id))
        .collect();
      for (const p of progress) {
        await ctx.db.delete(p._id);
      }
      await ctx.db.delete(activity._id);
    }

    // Delete student objective assignments
    const assignments = await ctx.db
      .query("studentObjectives")
      .filter((q) => q.eq(q.field("objectiveId"), args.objectiveId))
      .collect();
    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    // Delete the objective itself
    await ctx.db.delete(args.objectiveId);

    return { success: true };
  },
});

// Assign objective to student
export const assignToStudent = mutation({
  args: {
    userId: v.id("users"),
    objectiveId: v.id("learningObjectives"),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if already assigned
    const existing = await ctx.db
      .query("studentObjectives")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("objectiveId"), args.objectiveId)
        )
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("studentObjectives", {
      userId: args.userId,
      objectiveId: args.objectiveId,
      assignedBy: args.assignedBy,
      status: "assigned",
      assignedAt: Date.now(),
    });
  },
});

// Assign objective to multiple students at once
export const assignToMultipleStudents = mutation({
  args: {
    studentIds: v.array(v.id("users")),
    objectiveId: v.id("learningObjectives"),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const userId of args.studentIds) {
      // Check if already assigned
      const existing = await ctx.db
        .query("studentObjectives")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("objectiveId"), args.objectiveId)
          )
        )
        .first();

      if (!existing) {
        const id = await ctx.db.insert("studentObjectives", {
          userId,
          objectiveId: args.objectiveId,
          assignedBy: args.assignedBy,
          status: "assigned",
          assignedAt: Date.now(),
        });
        results.push({ userId, id, created: true });
      } else {
        results.push({ userId, id: existing._id, created: false });
      }
    }
    return results;
  },
});

// Unassign objective from student
export const unassignFromStudent = mutation({
  args: {
    userId: v.id("users"),
    objectiveId: v.id("learningObjectives"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("studentObjectives")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("objectiveId"), args.objectiveId)
        )
      )
      .first();

    if (existing) {
      // Also delete any activity progress for this assignment
      const progressRecords = await ctx.db
        .query("activityProgress")
        .filter((q) => q.eq(q.field("studentObjectiveId"), existing._id))
        .collect();

      for (const progress of progressRecords) {
        await ctx.db.delete(progress._id);
      }

      await ctx.db.delete(existing._id);
      return { success: true };
    }

    return { success: false, message: "Assignment not found" };
  },
});

// Get students assigned to a specific objective (admin)
export const getAssignedStudents = query({
  args: { objectiveId: v.id("learningObjectives") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("studentObjectives")
      .filter((q) => q.eq(q.field("objectiveId"), args.objectiveId))
      .collect();

    return await Promise.all(
      assignments.map(async (assignment) => {
        const user = await ctx.db.get(assignment.userId);
        return {
          ...assignment,
          user,
        };
      })
    );
  },
});

// Update objective status
export const updateStatus = mutation({
  args: {
    studentObjectiveId: v.id("studentObjectives"),
    status: v.union(
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("viva_requested"),
      v.literal("mastered")
    ),
  },
  handler: async (ctx, args) => {
    const updates: any = { status: args.status };

    if (args.status === "viva_requested") {
      updates.vivaRequestedAt = Date.now();
    } else if (args.status === "mastered") {
      updates.masteredAt = Date.now();
    }

    await ctx.db.patch(args.studentObjectiveId, updates);
  },
});

// Get all objectives with viva requests (admin)
export const getVivaRequests = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query("studentObjectives")
      .filter((q) => q.eq(q.field("status"), "viva_requested"))
      .collect();

    // Fetch full details
    return await Promise.all(
      requests.map(async (req) => {
        const user = await ctx.db.get(req.userId);
        const objective = await ctx.db.get(req.objectiveId);
        const domain = objective ? await ctx.db.get(objective.domainId) : null;
        return {
          ...req,
          user,
          objective,
          domain,
        };
      })
    );
  },
});
