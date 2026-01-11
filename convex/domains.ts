import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all domains
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("domains").order("asc").collect();
  },
});

// Get domain by ID
export const getById = query({
  args: { domainId: v.id("domains") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.domainId);
  },
});
