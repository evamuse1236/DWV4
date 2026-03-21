import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { CHARACTER_XP, awardXpIfNotExists } from "./characterAwards";

const DEFAULT_UNLOCK_EXPIRY_MS = 24 * 60 * 60 * 1000;

function toFiniteNumberOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function getUnlockAttemptsRemaining(unlock: any): number {
  const raw = toFiniteNumberOrNull(unlock?.attemptsRemaining);
  if (raw === null) return 1;
  return Math.max(0, Math.floor(raw));
}

function getUnlockExpiresAt(unlock: any, now: number): number {
  const explicit = toFiniteNumberOrNull(unlock?.expiresAt);
  if (explicit !== null && explicit > 0) return explicit;

  const approvedAt = toFiniteNumberOrNull(unlock?.approvedAt);
  if (approvedAt !== null && approvedAt > 0) {
    return approvedAt + DEFAULT_UNLOCK_EXPIRY_MS;
  }

  return now + DEFAULT_UNLOCK_EXPIRY_MS;
}

function getActiveUnlockOrNull(unlock: any, now: number) {
  if (!unlock || unlock.status !== "approved") return null;
  const attemptsRemaining = getUnlockAttemptsRemaining(unlock);
  if (attemptsRemaining <= 0) return null;
  const expiresAt = getUnlockExpiresAt(unlock, now);
  if (expiresAt <= now) return null;
  return { ...unlock, attemptsRemaining, expiresAt };
}

function getEffectiveVivaStatus(assignment: any): "not_requested" | "requested" | "approved" | "not_ready" {
  if (assignment?.vivaStatus) return assignment.vivaStatus;
  if (assignment?.status === "viva_requested") return "requested";
  return "not_requested";
}

async function getReadinessSummary(ctx: any, userId: Id<"users">, majorObjectiveId: Id<"majorObjectives">) {
  const subs = await ctx.db
    .query("studentObjectives")
    .withIndex("by_user_major", (q: any) =>
      q.eq("userId", userId).eq("majorObjectiveId", majorObjectiveId)
    )
    .collect();

  const totalSubObjectives = subs.length;
  const completedSubObjectives = subs.filter((sub: any) => sub.status === "completed").length;
  const allSubObjectivesComplete = totalSubObjectives > 0 && completedSubObjectives === totalSubObjectives;

  return {
    totalSubObjectives,
    completedSubObjectives,
    allSubObjectivesComplete,
  };
}

export const getMajorMasteryState = query({
  args: {
    userId: v.id("users"),
    majorObjectiveId: v.id("majorObjectives"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const [assignment, majorObjective, latestAttempt, latestUnlock, latestUnlockRequest, readiness] =
      await Promise.all([
        ctx.db
          .query("studentMajorObjectives")
          .withIndex("by_user_major", (q: any) =>
            q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
          )
          .first(),
        ctx.db.get(args.majorObjectiveId),
        ctx.db
          .query("diagnosticAttempts")
          .withIndex("by_user_major", (q: any) =>
            q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
          )
          .order("desc")
          .first(),
        ctx.db
          .query("diagnosticUnlocks")
          .withIndex("by_user_major", (q: any) =>
            q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
          )
          .order("desc")
          .first(),
        ctx.db
          .query("diagnosticUnlockRequests")
          .withIndex("by_user_major", (q: any) =>
            q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
          )
          .order("desc")
          .first(),
        getReadinessSummary(ctx, args.userId, args.majorObjectiveId),
      ]);

    const activeUnlock = getActiveUnlockOrNull(latestUnlock, now);
    const pendingRetakeRequest =
      latestUnlockRequest?.status === "pending"
        ? {
            requestId: latestUnlockRequest._id,
            requestedAt: latestUnlockRequest.requestedAt,
          }
        : null;

    const latestRetakeDecision =
      latestUnlockRequest && latestUnlockRequest.status !== "pending"
        ? {
            status: latestUnlockRequest.status,
            handledAt: latestUnlockRequest.handledAt,
            decisionNotes: latestUnlockRequest.decisionNotes,
          }
        : null;

    const status = assignment?.status === "viva_requested" ? "in_progress" : assignment?.status ?? "assigned";
    const vivaStatus = getEffectiveVivaStatus(assignment);
    const latestAttemptFailed = latestAttempt?.passed === false;

    let nextStep:
      | "continue_work"
      | "start_first_diagnostic"
      | "request_viva"
      | "await_viva_decision"
      | "request_retake"
      | "await_retake_decision"
      | "start_retake"
      | "mastered" = "continue_work";

    if (status === "mastered") {
      nextStep = "mastered";
    } else if (!readiness.allSubObjectivesComplete) {
      nextStep = "continue_work";
    } else if (vivaStatus === "requested") {
      nextStep = "await_viva_decision";
    } else if (latestAttemptFailed) {
      if (activeUnlock) {
        nextStep = "start_retake";
      } else if (pendingRetakeRequest) {
        nextStep = "await_retake_decision";
      } else {
        nextStep = "request_retake";
      }
    } else {
      nextStep = "start_first_diagnostic";
    }

    const domain = majorObjective ? await ctx.db.get(majorObjective.domainId) : null;

    return {
      majorObjective: majorObjective
        ? {
            _id: majorObjective._id,
            title: majorObjective.title,
            description: majorObjective.description,
            difficulty: majorObjective.difficulty,
          }
        : null,
      domain: domain ? { _id: domain._id, name: domain.name } : null,
      majorAssignment: assignment
        ? {
            studentMajorObjectiveId: assignment._id,
            status,
            vivaStatus,
            vivaRequestedAt: assignment.vivaRequestedAt,
            vivaDecisionAt: assignment.vivaDecisionAt,
            vivaDecisionBy: assignment.vivaDecisionBy,
            vivaRequestNotes: assignment.vivaRequestNotes,
            vivaDecisionNotes: assignment.vivaDecisionNotes,
            masteredAt: assignment.masteredAt,
          }
        : null,
      readiness,
      latestAttempt: latestAttempt
        ? {
            attemptId: latestAttempt._id,
            passed: latestAttempt.passed,
            score: latestAttempt.score,
            questionCount: latestAttempt.questionCount,
            scorePercent: latestAttempt.scorePercent,
            submittedAt: latestAttempt.submittedAt,
            durationMs: latestAttempt.durationMs,
            diagnosticModuleName: latestAttempt.diagnosticModuleName,
          }
        : null,
      retake: {
        pendingRequest: pendingRetakeRequest,
        latestDecision: latestRetakeDecision,
        activeUnlock: activeUnlock
          ? {
              unlockId: activeUnlock._id,
              expiresAt: activeUnlock.expiresAt,
              attemptsRemaining: activeUnlock.attemptsRemaining,
            }
          : null,
      },
      actions: {
        canStartDiagnostic: readiness.allSubObjectivesComplete && !latestAttemptFailed && status !== "mastered",
        canRequestViva:
          readiness.allSubObjectivesComplete &&
          status !== "mastered" &&
          vivaStatus !== "requested",
        canRequestRetake:
          readiness.allSubObjectivesComplete &&
          latestAttemptFailed &&
          !pendingRetakeRequest &&
          !activeUnlock &&
          status !== "mastered",
      },
      nextStep,
    };
  },
});

export const requestViva = mutation({
  args: {
    studentMajorObjectiveId: v.id("studentMajorObjectives"),
    vivaRequestNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.studentMajorObjectiveId);
    if (!assignment) throw new Error("Student major objective not found");
    if (assignment.status === "mastered") throw new Error("This objective is already mastered.");

    const readiness = await getReadinessSummary(ctx, assignment.userId, assignment.majorObjectiveId);
    if (!readiness.allSubObjectivesComplete) {
      throw new Error("Complete all assigned work before requesting viva.");
    }

    const now = Date.now();
    await ctx.db.patch(args.studentMajorObjectiveId, {
      status: assignment.status === "assigned" ? "in_progress" : assignment.status,
      vivaStatus: "requested",
      vivaRequestedAt: now,
      vivaRequestNotes: args.vivaRequestNotes,
      vivaDecisionAt: undefined,
      vivaDecisionBy: undefined,
      vivaDecisionNotes: undefined,
    });

    return { success: true };
  },
});

export const decideViva = mutation({
  args: {
    studentMajorObjectiveId: v.id("studentMajorObjectives"),
    decision: v.union(v.literal("mastered"), v.literal("not_ready")),
    decidedBy: v.id("users"),
    decisionNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.studentMajorObjectiveId);
    if (!assignment) throw new Error("Student major objective not found");

    const trimmedNotes = args.decisionNotes.trim();
    if (!trimmedNotes) throw new Error("Decision notes are required.");

    const now = Date.now();

    if (args.decision === "mastered") {
      await ctx.db.patch(args.studentMajorObjectiveId, {
        status: "mastered",
        masteredAt: now,
        vivaStatus: "approved",
        vivaDecisionAt: now,
        vivaDecisionBy: args.decidedBy,
        vivaDecisionNotes: trimmedNotes,
      });

      const major = await ctx.db.get(assignment.majorObjectiveId);
      await awardXpIfNotExists(ctx, {
        userId: assignment.userId,
        sourceType: "major_mastered",
        sourceKey: `major_mastered:${assignment.userId}:${assignment.majorObjectiveId}`,
        xp: CHARACTER_XP.majorMastered,
        domainId: major?.domainId,
        meta: {
          majorObjectiveId: assignment.majorObjectiveId,
          via: "viva_approved",
        },
      });
    } else {
      await ctx.db.patch(args.studentMajorObjectiveId, {
        status: "in_progress",
        vivaStatus: "not_ready",
        vivaDecisionAt: now,
        vivaDecisionBy: args.decidedBy,
        vivaDecisionNotes: trimmedNotes,
      });
    }

    return { success: true };
  },
});

export const getAdminVivaQueue = query({
  args: {},
  handler: async (ctx) => {
    const assignments = await ctx.db
      .query("studentMajorObjectives")
      .collect();

    const vivaRows = assignments.filter((assignment: any) => {
      const vivaStatus = getEffectiveVivaStatus(assignment);
      return assignment.status !== "mastered" && vivaStatus === "requested";
    });

    const enriched = await Promise.all(
      vivaRows.map(async (assignment: any) => {
        const [user, majorObjectiveDoc, latestAttempt] = await Promise.all([
          ctx.db.get(assignment.userId),
          ctx.db.get(assignment.majorObjectiveId),
          ctx.db
            .query("diagnosticAttempts")
            .withIndex("by_user_major", (q: any) =>
              q.eq("userId", assignment.userId).eq("majorObjectiveId", assignment.majorObjectiveId)
            )
            .order("desc")
            .first(),
        ]);
        const majorObjective: any = majorObjectiveDoc;
        const domain = majorObjective ? await ctx.db.get(majorObjective.domainId) : null;
        const readiness = await getReadinessSummary(ctx, assignment.userId, assignment.majorObjectiveId);

        return {
          _id: assignment._id,
          userId: assignment.userId,
          user,
          objective: majorObjective,
          domain,
          latestAttempt,
          readiness,
          vivaRequestedAt: assignment.vivaRequestedAt,
          vivaRequestNotes: assignment.vivaRequestNotes,
        };
      })
    );

    return enriched.sort((a: any, b: any) => (b.vivaRequestedAt ?? 0) - (a.vivaRequestedAt ?? 0));
  },
});

export const migrateLegacyVivaStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const assignments = await ctx.db
      .query("studentMajorObjectives")
      .collect();

    let migrated = 0;
    for (const assignment of assignments) {
      if (assignment.status !== "viva_requested" || assignment.vivaStatus) continue;
      await ctx.db.patch(assignment._id, {
        status: "in_progress",
        vivaStatus: "requested",
      });
      migrated += 1;
    }

    return { migrated };
  },
});
