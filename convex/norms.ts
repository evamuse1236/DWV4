import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const MAX_STRIKES = 3;

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

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();
    const norms = await ctx.db.query("studentNorms").collect();
    const normsByUser = new Map(norms.map((norm) => [norm.userId, norm]));

    return students
      .map((student) => {
        const norm = normsByUser.get(student._id);
        return {
          userId: student._id,
          displayName: student.displayName,
          username: student.username,
          avatarUrl: student.avatarUrl,
          batch: student.batch ?? null,
          strikes: norm?.strikes ?? 0,
          penalties: norm?.penalties ?? 0,
          penaltyPending: norm?.penaltyPending ?? false,
          updatedAt: norm?.updatedAt ?? null,
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

export const addStrike = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await verifyAdmin(ctx, args.adminToken);
    if (!admin) {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await ctx.db
      .query("studentNorms")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing?.penaltyPending) {
      return { success: false, error: "Penalty pending. Complete it to reset strikes." };
    }

    const currentStrikes = existing?.strikes ?? 0;
    const newStrikes = Math.min(MAX_STRIKES, currentStrikes + 1);
    const penaltyTriggered = newStrikes >= MAX_STRIKES;
    const nextPenalties = penaltyTriggered ? (existing?.penalties ?? 0) + 1 : existing?.penalties ?? 0;

    if (existing) {
      await ctx.db.patch(existing._id, {
        strikes: newStrikes,
        penalties: nextPenalties,
        penaltyPending: penaltyTriggered,
        updatedAt: Date.now(),
        updatedBy: admin._id,
      });
    } else {
      await ctx.db.insert("studentNorms", {
        userId: args.userId,
        strikes: newStrikes,
        penalties: penaltyTriggered ? 1 : 0,
        penaltyPending: penaltyTriggered,
        updatedAt: Date.now(),
        updatedBy: admin._id,
      });
    }

    return { success: true, penaltyTriggered };
  },
});

export const completePenalty = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await verifyAdmin(ctx, args.adminToken);
    if (!admin) {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await ctx.db
      .query("studentNorms")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!existing || !existing.penaltyPending) {
      return { success: false, error: "No pending penalty to complete." };
    }

    await ctx.db.patch(existing._id, {
      strikes: 0,
      penaltyPending: false,
      updatedAt: Date.now(),
      updatedBy: admin._id,
    });

    return { success: true };
  },
});
