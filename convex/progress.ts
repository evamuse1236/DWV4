import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get progress for a student objective
export const getByStudentObjective = query({
  args: { studentObjectiveId: v.id("studentObjectives") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityProgress")
      .withIndex("by_student_objective", (q) =>
        q.eq("studentObjectiveId", args.studentObjectiveId)
      )
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
    const studentObjective = await ctx.db.get(args.studentObjectiveId);
    if (!studentObjective) return;

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
    } else {
      await ctx.db.insert("activityProgress", {
        userId: args.userId,
        activityId: args.activityId,
        studentObjectiveId: args.studentObjectiveId,
        completed: true,
        completedAt: Date.now(),
      });
    }

    // Recalculate sub objective status based on activity completion
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_objective", (q) =>
        q.eq("objectiveId", studentObjective.objectiveId)
      )
      .collect();

    const progress = await ctx.db
      .query("activityProgress")
      .withIndex("by_student_objective", (q) =>
        q.eq("studentObjectiveId", args.studentObjectiveId)
      )
      .collect();

    const progressMap = new Map(
      progress.map((p) => [p.activityId.toString(), p])
    );
    const completedCount = activities.filter(
      (activity) => progressMap.get(activity._id.toString())?.completed
    ).length;
    const hasAny = completedCount > 0;
    const allCompleted =
      activities.length === 0 || completedCount === activities.length;

    const nextStatus = allCompleted
      ? "completed"
      : hasAny
        ? "in_progress"
        : "assigned";

    if (studentObjective.status !== nextStatus) {
      await ctx.db.patch(args.studentObjectiveId, { status: nextStatus });
    }

    // Update major objective status if needed
    const majorObjId = studentObjective.majorObjectiveId;
    if (majorObjId) {
      const majorAssignment = await ctx.db
        .query("studentMajorObjectives")
        .withIndex("by_user_major", (q) =>
          q
            .eq("userId", studentObjective.userId)
            .eq("majorObjectiveId", majorObjId)
        )
        .first();

      if (majorAssignment && majorAssignment.status !== "mastered") {
        const subs = await ctx.db
          .query("studentObjectives")
          .withIndex("by_user_major", (q) =>
            q
              .eq("userId", studentObjective.userId)
              .eq("majorObjectiveId", majorObjId)
          )
          .collect();

        const anyStarted = subs.some((s) => s.status !== "assigned");
        const allSubsCompleted =
          subs.length > 0 && subs.every((s) => s.status === "completed");

        let nextMajorStatus = majorAssignment.status;
        if (majorAssignment.status === "assigned" && anyStarted) {
          nextMajorStatus = "in_progress";
        } else if (majorAssignment.status === "in_progress" && !anyStarted) {
          nextMajorStatus = "assigned";
        } else if (
          majorAssignment.status === "viva_requested" &&
          !allSubsCompleted
        ) {
          nextMajorStatus = "in_progress";
        }

        if (nextMajorStatus !== majorAssignment.status) {
          await ctx.db.patch(majorAssignment._id, { status: nextMajorStatus });
        }
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
        const studentMajors = await ctx.db
          .query("studentMajorObjectives")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();

        const domainMajors = await Promise.all(
          studentMajors.map(async (assignment) => {
            const major = await ctx.db.get(assignment.majorObjectiveId);
            if (major?.domainId === domain._id) {
              return assignment;
            }
            return null;
          })
        );

        const filtered = domainMajors.filter(Boolean);
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
