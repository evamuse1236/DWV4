import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./authz";

const MAX_COUNT = 50;

/**
 * Get current trust jar count for a specific batch
 * Public - no auth required since everyone can see the jar
 */
export const get = query({
  args: {
    batch: v.string(),
  },
  handler: async (ctx, args) => {
    const jar = await ctx.db
      .query("trustJar")
      .withIndex("by_batch", (q) => q.eq("batch", args.batch))
      .unique();
    return {
      count: jar?.count ?? 0,
      maxCount: MAX_COUNT,
      timesCompleted: jar?.timesCompleted ?? 0,
      updatedAt: jar?.updatedAt ?? null,
    };
  },
});

/**
 * Add a marble to the jar (admin only)
 */
export const add = mutation({
  args: {
    adminToken: v.string(),
    batch: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx, args.adminToken);

    const jar = await ctx.db
      .query("trustJar")
      .withIndex("by_batch", (q) => q.eq("batch", args.batch))
      .unique();

    if (jar) {
      if (jar.count >= MAX_COUNT) {
        return { success: false, error: "Jar is full" };
      }
      await ctx.db.patch(jar._id, {
        count: jar.count + 1,
        updatedAt: Date.now(),
        updatedBy: user._id,
      });
    } else {
      await ctx.db.insert("trustJar", {
        batch: args.batch,
        count: 1,
        timesCompleted: 0,
        updatedAt: Date.now(),
        updatedBy: user._id,
      });
    }

    return { success: true };
  },
});

/**
 * Remove a marble from the jar (admin only)
 */
export const remove = mutation({
  args: {
    adminToken: v.string(),
    batch: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx, args.adminToken);

    const jar = await ctx.db
      .query("trustJar")
      .withIndex("by_batch", (q) => q.eq("batch", args.batch))
      .unique();

    if (!jar || jar.count <= 0) {
      return { success: false, error: "Jar is empty" };
    }

    await ctx.db.patch(jar._id, {
      count: jar.count - 1,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return { success: true };
  },
});

/**
 * Reset jar to zero (admin only)
 * If jar was full, increments timesCompleted counter
 */
export const reset = mutation({
  args: {
    adminToken: v.string(),
    batch: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx, args.adminToken);

    const jar = await ctx.db
      .query("trustJar")
      .withIndex("by_batch", (q) => q.eq("batch", args.batch))
      .unique();
    if (!jar) {
      return { success: true };
    }

    const wasComplete = jar.count >= MAX_COUNT;
    const currentCompleted = jar.timesCompleted ?? 0;

    await ctx.db.patch(jar._id, {
      count: 0,
      timesCompleted: wasComplete ? currentCompleted + 1 : currentCompleted,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return { success: true };
  },
});
