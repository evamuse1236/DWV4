import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

interface ReflectionFields {
  didWell?: string;
  projectDescription?: string;
  couldImprove?: string;
}

function isReflectionComplete(fields: ReflectionFields): boolean {
  return !!fields.didWell && !!fields.projectDescription && !!fields.couldImprove;
}

export const getByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projectReflections")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getByProjectAndUser = query({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projectReflections")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();
  },
});

export const getOrCreate = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projectReflections")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();

    if (existing) return existing;

    const reflectionId = await ctx.db.insert("projectReflections", {
      projectId: args.projectId,
      userId: args.userId,
      didWell: undefined,
      projectDescription: undefined,
      couldImprove: undefined,
      isComplete: false,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(reflectionId);
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    didWell: v.optional(v.string()),
    projectDescription: v.optional(v.string()),
    couldImprove: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reflection = await ctx.db
      .query("projectReflections")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();

    const updates: ReflectionFields & { isComplete: boolean; updatedAt: number } = {
      isComplete: false,
      updatedAt: Date.now(),
    };

    if (args.didWell !== undefined) updates.didWell = args.didWell;
    if (args.projectDescription !== undefined)
      updates.projectDescription = args.projectDescription;
    if (args.couldImprove !== undefined)
      updates.couldImprove = args.couldImprove;

    if (reflection) {
      const merged = {
        didWell: args.didWell ?? reflection.didWell,
        projectDescription: args.projectDescription ?? reflection.projectDescription,
        couldImprove: args.couldImprove ?? reflection.couldImprove,
      };
      updates.isComplete = isReflectionComplete(merged);

      await ctx.db.patch(reflection._id, updates);
      return { success: true, reflectionId: reflection._id };
    }

    updates.isComplete = isReflectionComplete(args);
    const reflectionId = await ctx.db.insert("projectReflections", {
      projectId: args.projectId,
      userId: args.userId,
      didWell: args.didWell,
      projectDescription: args.projectDescription,
      couldImprove: args.couldImprove,
      isComplete: updates.isComplete,
      updatedAt: Date.now(),
    });

    return { success: true, reflectionId };
  },
});

export const batchUpdate = mutation({
  args: {
    updates: v.array(
      v.object({
        projectId: v.id("projects"),
        userId: v.id("users"),
        didWell: v.optional(v.string()),
        projectDescription: v.optional(v.string()),
        couldImprove: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const item of args.updates) {
      const reflection = await ctx.db
        .query("projectReflections")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", item.projectId).eq("userId", item.userId)
        )
        .first();

      const data: ReflectionFields & { isComplete: boolean; updatedAt: number } = {
        isComplete: false,
        updatedAt: Date.now(),
      };

      if (item.didWell !== undefined) data.didWell = item.didWell;
      if (item.projectDescription !== undefined)
        data.projectDescription = item.projectDescription;
      if (item.couldImprove !== undefined)
        data.couldImprove = item.couldImprove;

      if (reflection) {
        const merged = {
          didWell: item.didWell ?? reflection.didWell,
          projectDescription: item.projectDescription ?? reflection.projectDescription,
          couldImprove: item.couldImprove ?? reflection.couldImprove,
        };
        data.isComplete = isReflectionComplete(merged);

        await ctx.db.patch(reflection._id, data);
        results.push({ userId: item.userId, reflectionId: reflection._id });
      } else {
        data.isComplete = isReflectionComplete(item);
        const reflectionId = await ctx.db.insert("projectReflections", {
          projectId: item.projectId,
          userId: item.userId,
          ...data,
        });
        results.push({ userId: item.userId, reflectionId });
      }
    }

    return { success: true, results };
  },
});

export const remove = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const reflection = await ctx.db
      .query("projectReflections")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();

    if (reflection) {
      await ctx.db.delete(reflection._id);
    }

    return { success: true };
  },
});

export const getProjectStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const reflections = await ctx.db
      .query("projectReflections")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const students = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    return {
      totalStudents: students.length,
      studentsWithData: reflections.length,
      completeCount: reflections.filter((r) => r.isComplete).length,
      partialCount: reflections.filter((r) => !r.isComplete).length,
    };
  },
});
