import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const linkTypeValidator = v.union(
  v.literal("presentation"),
  v.literal("document"),
  v.literal("video"),
  v.literal("other")
);

export const getByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projectLinks")
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
      .query("projectLinks")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .collect();
  },
});

export const add = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    url: v.string(),
    title: v.string(),
    linkType: linkTypeValidator,
  },
  handler: async (ctx, args) => {
    const linkId = await ctx.db.insert("projectLinks", {
      projectId: args.projectId,
      userId: args.userId,
      url: args.url,
      title: args.title,
      linkType: args.linkType,
      addedAt: Date.now(),
    });
    return { success: true, linkId };
  },
});

export const addMany = mutation({
  args: {
    links: v.array(
      v.object({
        projectId: v.id("projects"),
        userId: v.id("users"),
        url: v.string(),
        title: v.string(),
        linkType: linkTypeValidator,
      })
    ),
  },
  handler: async (ctx, args) => {
    const linkIds = [];
    for (const link of args.links) {
      const linkId = await ctx.db.insert("projectLinks", {
        ...link,
        addedAt: Date.now(),
      });
      linkIds.push(linkId);
    }
    return { success: true, linkIds };
  },
});

export const update = mutation({
  args: {
    linkId: v.id("projectLinks"),
    url: v.optional(v.string()),
    title: v.optional(v.string()),
    linkType: v.optional(linkTypeValidator),
  },
  handler: async (ctx, args) => {
    const { linkId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(linkId, filteredUpdates);
    return { success: true };
  },
});

export const remove = mutation({
  args: {
    linkId: v.id("projectLinks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.linkId);
    return { success: true };
  },
});

export const removeAllForUser = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("projectLinks")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .collect();

    for (const link of links) {
      await ctx.db.delete(link._id);
    }

    return { success: true, deletedCount: links.length };
  },
});
