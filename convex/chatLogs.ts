import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Store AI chat log entry
export const log = mutation({
  args: {
    type: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
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
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<string> => {
    const logs: unknown = await ctx.runQuery(api.chatLogs.getRecent, { limit: args.limit ?? 500 });
    return JSON.stringify(logs, null, 2);
  },
});

// Clear all chat logs
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("chatLogs").collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }
    return { deleted: logs.length };
  },
});
