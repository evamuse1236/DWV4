import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get progress for a student objective
export const getByStudentObjective = query({
  args: { studentObjectiveId: v.id("studentObjectives") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityProgress")
      .filter((q) => q.eq(q.field("studentObjectiveId"), args.studentObjectiveId))
      .collect();
  },
});

// Toggle activity completion
export const toggleActivity = mutation({
  args: {
    userId: v.id("users"),
    activityId: v.id("activities"),
    studentObjectiveId: v.id("studentObjectives"),
  },
  handler: async (ctx, args) => {
    // Check if already exists (include studentObjectiveId to prevent collisions
    // when the same activity is used in multiple objectives)
    const existing = await ctx.db
      .query("activityProgress")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("activityId"), args.activityId),
          q.eq(q.field("studentObjectiveId"), args.studentObjectiveId)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: !existing.completed,
        completedAt: existing.completed ? undefined : Date.now(),
      });

      // Update student objective status if uncompleting
      if (existing.completed) {
        await ctx.db.patch(args.studentObjectiveId, { status: "in_progress" });
      }
    } else {
      await ctx.db.insert("activityProgress", {
        userId: args.userId,
        activityId: args.activityId,
        studentObjectiveId: args.studentObjectiveId,
        completed: true,
        completedAt: Date.now(),
      });

      // Update student objective to in_progress if it was assigned
      const studentObj = await ctx.db.get(args.studentObjectiveId);
      if (studentObj?.status === "assigned") {
        await ctx.db.patch(args.studentObjectiveId, { status: "in_progress" });
      }
    }
  },
});

// Get student's domain progress summary
export const getDomainSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const domains = await ctx.db.query("domains").collect();

    const summary = await Promise.all(
      domains.map(async (domain) => {
        // Get all student objectives for this domain
        const studentObjectives = await ctx.db
          .query("studentObjectives")
          .filter((q) => q.eq(q.field("userId"), args.userId))
          .collect();

        // Filter by domain
        const domainObjectives = await Promise.all(
          studentObjectives.map(async (so) => {
            const obj = await ctx.db.get(so.objectiveId);
            if (obj?.domainId === domain._id) {
              return so;
            }
            return null;
          })
        );

        const filtered = domainObjectives.filter(Boolean);
        const mastered = filtered.filter((o: any) => o?.status === "mastered").length;
        const inProgress = filtered.filter(
          (o: any) => o?.status === "in_progress" || o?.status === "viva_requested"
        ).length;

        return {
          domain,
          total: filtered.length,
          mastered,
          inProgress,
          assigned: filtered.length - mastered - inProgress,
        };
      })
    );

    return summary;
  },
});
