import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    return projects.sort((a, b) => b.cycleNumber - a.cycleNumber);
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
    return project;
  },
});

export const getById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

export const getWithStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    // Get all students
    const students = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    // Get all reflections for this project
    const reflections = await ctx.db
      .query("projectReflections")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Count complete reflections
    const completeCount = reflections.filter((r) => r.isComplete).length;

    return {
      ...project,
      totalStudents: students.length,
      completedStudents: completeCount,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    cycleNumber: v.number(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Deactivate any current active project
    const activeProject = await ctx.db
      .query("projects")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (activeProject) {
      await ctx.db.patch(activeProject._id, { isActive: false });
    }

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      cycleNumber: args.cycleNumber,
      isActive: true,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    return { success: true, projectId };
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    cycleNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(projectId, filteredUpdates);
    return { success: true };
  },
});

export const setActive = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Deactivate all projects
    const allProjects = await ctx.db.query("projects").collect();
    for (const project of allProjects) {
      if (project.isActive) {
        await ctx.db.patch(project._id, { isActive: false });
      }
    }

    // Activate the selected project
    await ctx.db.patch(args.projectId, { isActive: true });
    return { success: true };
  },
});

export const remove = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Delete all links for this project
    const links = await ctx.db
      .query("projectLinks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }

    // Delete all reflections for this project
    const reflections = await ctx.db
      .query("projectReflections")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const reflection of reflections) {
      await ctx.db.delete(reflection._id);
    }

    // Delete the project itself
    await ctx.db.delete(args.projectId);
    return { success: true };
  },
});

export const getNextCycleNumber = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    if (projects.length === 0) return 1;
    const maxCycle = Math.max(...projects.map((p) => p.cycleNumber));
    return maxCycle + 1;
  },
});
