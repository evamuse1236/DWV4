import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { CHARACTER_XP, awardXpIfNotExists } from "./characterAwards";
import { requireAdmin, requireUserMatch, toSafeUser } from "./authz";

/**
 * Assignments flow (2026 pivot).
 *
 * A "unit assignment" is a studentMajorObjectives row. The student works the
 * unit's assignments (learningObjectives + activities), marks the unit done,
 * and the coach confirms it offline:
 *
 *   assigned → in_progress → submitted → approved
 *                                └────→ rejected → (redo) → submitted …
 *
 * Legacy `mastered` rows render as approved. The diagnostic/viva pipeline is
 * archived (convex/diagnostics.ts, viva fields on the table) and no longer
 * drives any UI.
 */

async function getWorkSummary(
  ctx: any,
  userId: Id<"users">,
  majorObjectiveId: Id<"majorObjectives">
) {
  const subs = await ctx.db
    .query("studentObjectives")
    .withIndex("by_user_major", (q: any) =>
      q.eq("userId", userId).eq("majorObjectiveId", majorObjectiveId)
    )
    .collect();

  const totalSubObjectives = subs.length;
  const completedSubObjectives = subs.filter(
    (sub: any) => sub.status === "completed"
  ).length;

  return {
    totalSubObjectives,
    completedSubObjectives,
    allWorkComplete:
      totalSubObjectives === 0 || completedSubObjectives === totalSubObjectives,
  };
}

/** Legacy statuses fold into the assignment flow for display. */
export function toAssignmentStatus(status: string): string {
  if (status === "mastered") return "approved";
  if (status === "viva_requested") return "submitted";
  return status;
}

/**
 * The full state a student (or coach) needs to render one unit assignment.
 */
export const getAssignmentState = query({
  args: {
    token: v.optional(v.string()),
    adminToken: v.optional(v.string()),
    userId: v.id("users"),
    majorObjectiveId: v.id("majorObjectives"),
  },
  handler: async (ctx, args) => {
    if (args.adminToken) {
      await requireAdmin(ctx, args.adminToken);
    } else if (args.token) {
      await requireUserMatch(ctx, args.token, args.userId);
    } else {
      throw new Error("Unauthorized");
    }

    const [assignment, majorObjective, work] = await Promise.all([
      ctx.db
        .query("studentMajorObjectives")
        .withIndex("by_user_major", (q: any) =>
          q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
        )
        .first(),
      ctx.db.get(args.majorObjectiveId),
      getWorkSummary(ctx, args.userId, args.majorObjectiveId),
    ]);

    if (!assignment || !majorObjective) return null;

    const domain = await ctx.db.get((majorObjective as any).domainId);

    return {
      studentMajorObjectiveId: assignment._id,
      majorObjective,
      domain,
      status: toAssignmentStatus(assignment.status),
      rawStatus: assignment.status,
      work,
      submittedAt: assignment.submittedAt,
      submittedNotes: assignment.submittedNotes,
      confirmedAt: assignment.confirmedAt,
      confirmationNotes: assignment.confirmationNotes,
    };
  },
});

/**
 * Student marks the unit done (optionally with a note for the coach).
 */
export const submitWork = mutation({
  args: {
    token: v.string(),
    studentMajorObjectiveId: v.id("studentMajorObjectives"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.studentMajorObjectiveId);
    if (!assignment) throw new Error("Assignment not found");
    await requireUserMatch(ctx, args.token, assignment.userId);

    const displayStatus = toAssignmentStatus(assignment.status);
    if (displayStatus === "approved") {
      throw new Error("This assignment is already confirmed.");
    }
    if (displayStatus === "submitted") {
      throw new Error("Already marked done — waiting for your coach.");
    }

    const work = await getWorkSummary(
      ctx,
      assignment.userId,
      assignment.majorObjectiveId
    );
    if (!work.allWorkComplete) {
      throw new Error("Finish every part of the assignment before marking it done.");
    }

    await ctx.db.patch(args.studentMajorObjectiveId, {
      status: "submitted",
      submittedAt: Date.now(),
      submittedNotes: args.notes?.trim() || undefined,
      // A resubmission clears the previous decision trail.
      confirmedAt: undefined,
      confirmedBy: undefined,
      confirmationNotes: undefined,
    });

    return { success: true };
  },
});

/**
 * Coach confirms the work is done (checked offline).
 */
export const approveWork = mutation({
  args: {
    adminToken: v.string(),
    studentMajorObjectiveId: v.id("studentMajorObjectives"),
    decidedBy: v.id("users"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const assignment = await ctx.db.get(args.studentMajorObjectiveId);
    if (!assignment) throw new Error("Assignment not found");

    const now = Date.now();
    await ctx.db.patch(args.studentMajorObjectiveId, {
      status: "approved",
      confirmedAt: now,
      confirmedBy: args.decidedBy,
      confirmationNotes: args.note?.trim() || undefined,
    });

    // Same award key the mastery era used, so a unit can never award twice.
    const major = await ctx.db.get(assignment.majorObjectiveId);
    await awardXpIfNotExists(ctx, {
      userId: assignment.userId,
      sourceType: "major_mastered",
      sourceKey: `major_mastered:${assignment.userId}:${assignment.majorObjectiveId}`,
      xp: CHARACTER_XP.majorMastered,
      domainId: (major as any)?.domainId,
      meta: {
        majorObjectiveId: assignment.majorObjectiveId,
        via: "work_approved",
      },
    });

    return { success: true };
  },
});

/**
 * Coach sends the work back. The note is required — the student sees it and
 * the assignment returns to "doing" so they can redo and resubmit.
 */
export const rejectWork = mutation({
  args: {
    adminToken: v.string(),
    studentMajorObjectiveId: v.id("studentMajorObjectives"),
    decidedBy: v.id("users"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const assignment = await ctx.db.get(args.studentMajorObjectiveId);
    if (!assignment) throw new Error("Assignment not found");

    const trimmed = args.note.trim();
    if (!trimmed) throw new Error("Add a note so the student knows what to fix.");

    await ctx.db.patch(args.studentMajorObjectiveId, {
      status: "rejected",
      confirmedAt: Date.now(),
      confirmedBy: args.decidedBy,
      confirmationNotes: trimmed,
    });

    return { success: true };
  },
});

/**
 * Coach queue: every unit waiting on a confirmation, newest first.
 */
export const getConfirmationQueue = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);

    const submitted = await ctx.db
      .query("studentMajorObjectives")
      .withIndex("by_status", (q: any) => q.eq("status", "submitted"))
      .collect();

    // Legacy viva requests surface in the same queue so nothing gets lost.
    const legacyRequested = (
      await ctx.db
        .query("studentMajorObjectives")
        .withIndex("by_status", (q: any) => q.eq("status", "viva_requested"))
        .collect()
    ).concat(
      (
        await ctx.db.query("studentMajorObjectives").collect()
      ).filter(
        (row: any) =>
          row.vivaStatus === "requested" &&
          row.status !== "submitted" &&
          row.status !== "mastered" &&
          row.status !== "approved"
      )
    );

    const rows = [...submitted, ...legacyRequested];
    const seen = new Set<string>();

    const enriched = await Promise.all(
      rows
        .filter((row: any) => {
          if (seen.has(String(row._id))) return false;
          seen.add(String(row._id));
          return true;
        })
        .map(async (row: any) => {
          const [user, majorObjectiveDoc] = await Promise.all([
            ctx.db.get(row.userId as Id<"users">),
            ctx.db.get(row.majorObjectiveId),
          ]);
          const majorObjective: any = majorObjectiveDoc;
          const domain = majorObjective
            ? await ctx.db.get(majorObjective.domainId)
            : null;
          const work = await getWorkSummary(ctx, row.userId, row.majorObjectiveId);

          return {
            _id: row._id,
            userId: row.userId,
            user: user ? toSafeUser(user) : null,
            objective: majorObjective,
            domain,
            work,
            submittedAt: row.submittedAt ?? row.vivaRequestedAt,
            submittedNotes: row.submittedNotes ?? row.vivaRequestNotes,
          };
        })
    );

    return enriched.sort(
      (a: any, b: any) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0)
    );
  },
});
