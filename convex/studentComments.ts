import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireSession, requireUserMatch, toSafeUser } from "./authz";
import type { Id } from "./_generated/dataModel";

export const submit = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    message: v.string(),
    route: v.optional(v.string()),
    pageTitle: v.optional(v.string()),
    pageUrl: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          fileName: v.string(),
          contentType: v.optional(v.string()),
          sizeBytes: v.optional(v.number()),
        })
      )
    ),
    majorObjectiveId: v.optional(v.id("majorObjectives")),
    diagnosticAttemptId: v.optional(v.id("diagnosticAttempts")),
  },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    const message = args.message.trim();
    const attachments = args.attachments ?? [];
    if (!message && attachments.length === 0) {
      throw new Error("Add a comment or at least one image.");
    }
    if (attachments.length > 4) {
      throw new Error("You can upload up to 4 images per comment.");
    }

    const commenter = await ctx.db.get(args.userId);
    const now = Date.now();
    const commentId = await ctx.db.insert("studentComments", {
      userId: args.userId,
      message,
      route: args.route,
      pageTitle: args.pageTitle?.trim() || undefined,
      pageUrl: args.pageUrl?.trim() || undefined,
      commenterDisplayName: commenter?.displayName,
      commenterUsername: commenter?.username,
      attachments,
      majorObjectiveId: args.majorObjectiveId,
      diagnosticAttemptId: args.diagnosticAttemptId,
      status: "open",
      createdAt: now,
    });

    return { commentId };
  },
});

export const generateUploadUrl = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSession(ctx, args.token);
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

export const getMine = query({
  args: {
    token: v.string(),
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    const limit = Math.min(args.limit ?? 100, 300);
    const rows = await ctx.db
      .query("studentComments")
      .withIndex("by_user_created", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return await Promise.all(
      rows.map(async (row: any) => {
        const attachmentsWithUrls = await Promise.all(
          (row.attachments ?? []).map(async (attachment: any) => ({
            ...attachment,
            url: await ctx.storage.getUrl(attachment.storageId),
          }))
        );

        return {
          ...row,
          attachments: attachmentsWithUrls,
        };
      })
    );
  },
});

export const getForAdmin = query({
  args: {
    adminToken: v.string(),
    status: v.optional(v.union(v.literal("all"), v.literal("open"), v.literal("resolved"))),
    userId: v.optional(v.id("users")),
    majorObjectiveId: v.optional(v.id("majorObjectives")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const limit = Math.min(args.limit ?? 200, 500);
    const requestedStatus = args.status ?? "all";

    const baseRows =
      requestedStatus === "all"
        ? await ctx.db.query("studentComments").withIndex("by_created").order("desc").take(limit * 3)
        : await ctx.db
            .query("studentComments")
            .withIndex("by_status_created", (q: any) => q.eq("status", requestedStatus))
            .order("desc")
            .take(limit * 3);

    const filtered = baseRows.filter((row: any) => {
      if (args.userId && row.userId !== args.userId) return false;
      if (args.majorObjectiveId && row.majorObjectiveId !== args.majorObjectiveId) return false;
      return true;
    });

    const sliced = filtered.slice(0, limit);

    return await Promise.all(
      sliced.map(async (row: any) => {
        const user = await ctx.db.get(row.userId as Id<"users">);
        const majorObjective = row.majorObjectiveId
          ? await ctx.db.get(row.majorObjectiveId)
          : null;
        const attachmentsWithUrls = await Promise.all(
          (row.attachments ?? []).map(async (attachment: any) => ({
            ...attachment,
            url: await ctx.storage.getUrl(attachment.storageId),
          }))
        );

        return {
          ...row,
          user: user ? toSafeUser(user) : null,
          majorObjective,
          attachments: attachmentsWithUrls,
        };
      })
    );
  },
});

export const resolve = mutation({
  args: {
    adminToken: v.string(),
    commentId: v.id("studentComments"),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx, args.adminToken);
    const row = await ctx.db.get(args.commentId);
    if (!row) throw new Error("Comment not found.");
    await ctx.db.patch(args.commentId, {
      status: "resolved",
      resolvedBy: admin._id,
      resolvedAt: Date.now(),
    });

    return { success: true };
  },
});
