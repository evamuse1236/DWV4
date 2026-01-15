import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const MAX_COUNT = 50;

/**
 * Verify admin token and return the admin user
 * Returns null if unauthorized
 */
async function verifyAdmin(
  ctx: MutationCtx,
  adminToken: string
): Promise<Doc<"users"> | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", adminToken))
    .unique();

  if (!session) return null;

  const user = await ctx.db.get(session.userId);
  if (!user || user.role !== "admin") return null;

  return user;
}

/**
 * Get current trust jar count
 * Public - no auth required since everyone can see the jar
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const jar = await ctx.db.query("trustJar").first();
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
  },
  handler: async (ctx, args) => {
    const user = await verifyAdmin(ctx, args.adminToken);
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const jar = await ctx.db.query("trustJar").first();

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
  },
  handler: async (ctx, args) => {
    const user = await verifyAdmin(ctx, args.adminToken);
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const jar = await ctx.db.query("trustJar").first();

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
  },
  handler: async (ctx, args) => {
    const user = await verifyAdmin(ctx, args.adminToken);
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const jar = await ctx.db.query("trustJar").first();
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
