import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { requireAdmin, requireSession } from "./authz";

// Store AI chat log entry
export const log = mutation({
  args: {
    token: v.string(),
    type: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    await requireSession(ctx, args.token);
    await ctx.db.insert("chatLogs", {
      type: args.type,
      data: args.data,
      timestamp: Date.now(),
    });
  },
});

// Get recent chat logs
export const getRecent = query({
  args: {
    adminToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const limit = args.limit ?? 100;
    const logs = await ctx.db
      .query("chatLogs")
      .order("desc")
      .take(limit);
    return logs.reverse();
  },
});

// Export logs as JSON string (for download)
export const exportLogs = action({
  args: {
    adminToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<string> => {
    const logs: unknown = await ctx.runQuery(api.chatLogs.getRecent, {
      adminToken: args.adminToken,
      limit: args.limit ?? 500,
    });
    return JSON.stringify(logs, null, 2);
  },
});

// Clear all chat logs
export const clearAll = mutation({
  args: {
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const logs = await ctx.db.query("chatLogs").collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }
    return { deleted: logs.length };
  },
});
