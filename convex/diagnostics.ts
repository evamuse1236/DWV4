import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { CHARACTER_XP, awardXpIfNotExists } from "./characterAwards";

const PASS_THRESHOLD_PERCENT = 90;
const DEFAULT_UNLOCK_EXPIRY_MS = 24 * 60 * 60 * 1000;

function toFiniteNumberOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function getUnlockAttemptsRemaining(unlock: any): number {
  const raw = toFiniteNumberOrNull(unlock?.attemptsRemaining);
  // Legacy unlock rows can be missing this field; default to one remaining attempt.
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

function isCurriculumPyp(curriculum: string | undefined | null): boolean {
  return Boolean(curriculum && curriculum.toLowerCase().includes("pyp"));
}

function getActiveUnlockOrNull(unlock: any, now: number) {
  if (!unlock) return null;
  if (unlock.status !== "approved") return null;
  const attemptsRemaining = getUnlockAttemptsRemaining(unlock);
  if (attemptsRemaining <= 0) return null;
  const expiresAt = getUnlockExpiresAt(unlock, now);
  if (expiresAt <= now) return null;
  return {
    ...unlock,
    attemptsRemaining,
    expiresAt,
  };
}

function toScorePercent(score: number, questionCount: number): number {
  if (questionCount <= 0) return 0;
  return Math.round((score / questionCount) * 1000) / 10;
}

export const getCurriculumModuleIndex = query({
  args: { majorObjectiveId: v.id("majorObjectives") },
  handler: async (ctx, args) => {
    const major = await ctx.db.get(args.majorObjectiveId);
    if (!major || !major.curriculum) return null;

    const majorsInDomain = await ctx.db
      .query("majorObjectives")
      .withIndex("by_domain", (q: any) => q.eq("domainId", major.domainId))
      .collect();

    const cohortMajors = majorsInDomain
      .filter((m: any) => m.curriculum === major.curriculum)
      .sort((a: any, b: any) => a.createdAt - b.createdAt);

    const idx = cohortMajors.findIndex(
      (m: any) => m._id.toString() === major._id.toString()
    );
    if (idx === -1) return null;

    return {
      majorTitle: major.title,
      curriculum: major.curriculum,
      section: isCurriculumPyp(major.curriculum) ? ("pyp" as const) : ("dw" as const),
      moduleIndex: idx + 1,
      domainId: major.domainId,
    };
  },
});

export const getUnlockState = query({
  args: { userId: v.id("users"), majorObjectiveId: v.id("majorObjectives") },
  handler: async (ctx, args) => {
    const now = Date.now();

    const majorAssignment = await ctx.db
      .query("studentMajorObjectives")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .first();

    const latestUnlock = await ctx.db
      .query("diagnosticUnlocks")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .order("desc")
      .first();

    const activeUnlock = getActiveUnlockOrNull(latestUnlock, now);

    const latestRequest = await ctx.db
      .query("diagnosticUnlockRequests")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .order("desc")
      .first();

    const pendingRequest =
      latestRequest && latestRequest.status === "pending"
        ? {
            requestId: latestRequest._id,
            requestedAt: latestRequest.requestedAt,
          }
        : null;

    const latestAttempt = await ctx.db
      .query("diagnosticAttempts")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .order("desc")
      .first();

    const mastered = majorAssignment?.status === "mastered";
    const latestAttemptFailed = latestAttempt?.passed === false;
    const vivaRequested = majorAssignment?.status === "viva_requested";
    const requiresVivaRequest = Boolean(latestAttemptFailed && !vivaRequested);
    const requiresUnlock = Boolean(latestAttemptFailed && vivaRequested && !activeUnlock);
    const canStart =
      !mastered &&
      (!latestAttemptFailed || (vivaRequested && Boolean(activeUnlock)));

    return {
      majorAssignment: majorAssignment
        ? { studentMajorObjectiveId: majorAssignment._id, status: majorAssignment.status }
        : null,
      activeUnlock: activeUnlock
        ? {
            unlockId: activeUnlock._id,
            expiresAt: activeUnlock.expiresAt,
            attemptsRemaining: activeUnlock.attemptsRemaining,
          }
        : null,
      pendingRequest,
      latestAttempt: latestAttempt
        ? {
            attemptId: latestAttempt._id,
            passed: latestAttempt.passed,
            score: latestAttempt.score,
            questionCount: latestAttempt.questionCount,
            scorePercent: latestAttempt.scorePercent ?? toScorePercent(latestAttempt.score, latestAttempt.questionCount),
            durationMs: latestAttempt.durationMs,
            submittedAt: latestAttempt.submittedAt,
            attemptType: latestAttempt.attemptType,
            diagnosticModuleName: latestAttempt.diagnosticModuleName,
          }
        : null,
      policy: {
        passThresholdPercent: PASS_THRESHOLD_PERCENT,
        requiresVivaRequest,
        requiresUnlock,
        canStart,
      },
    };
  },
});

export const requestUnlock = mutation({
  args: { userId: v.id("users"), majorObjectiveId: v.id("majorObjectives") },
  handler: async (ctx, args) => {
    const now = Date.now();

    const latest = await ctx.db
      .query("diagnosticUnlockRequests")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .order("desc")
      .first();

    if (latest && latest.status === "pending") {
      return { requestId: latest._id, status: "pending" as const };
    }

    const latestAttempt = await ctx.db
      .query("diagnosticAttempts")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .order("desc")
      .first();

    if (!latestAttempt || latestAttempt.passed) {
      throw new Error("Unlock requests are only available after a failed attempt.");
    }

    const majorAssignment = await ctx.db
      .query("studentMajorObjectives")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .first();

    if (!majorAssignment || majorAssignment.status !== "viva_requested") {
      throw new Error("Request viva before asking for a diagnostic unlock.");
    }

    const latestUnlock = await ctx.db
      .query("diagnosticUnlocks")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .order("desc")
      .first();

    const activeUnlock = getActiveUnlockOrNull(latestUnlock, now);
    if (activeUnlock) {
      return { requestId: null, status: "approved" as const };
    }

    const requestId = await ctx.db.insert("diagnosticUnlockRequests", {
      userId: args.userId,
      majorObjectiveId: args.majorObjectiveId,
      requestedAt: now,
      status: "pending",
    });

    return { requestId, status: "pending" as const };
  },
});

export const approveUnlock = mutation({
  args: {
    requestId: v.id("diagnosticUnlockRequests"),
    approvedBy: v.id("users"),
    expiresInMinutes: v.optional(v.number()), // default: 1440 (24h)
    attemptsGranted: v.optional(v.number()), // default: 1
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Unlock request not found");
    if (request.status !== "pending") {
      throw new Error("Unlock request is not pending");
    }

    const expiresInMinutes = args.expiresInMinutes ?? 1440;
    const attemptsGranted = args.attemptsGranted ?? 1;
    const now = Date.now();

    const unlockId = await ctx.db.insert("diagnosticUnlocks", {
      userId: request.userId,
      majorObjectiveId: request.majorObjectiveId,
      approvedBy: args.approvedBy,
      approvedAt: now,
      expiresAt: now + expiresInMinutes * 60_000,
      attemptsRemaining: attemptsGranted,
      status: "approved",
    });

    await ctx.db.patch(args.requestId, {
      status: "approved",
      handledBy: args.approvedBy,
      handledAt: now,
    });

    return { unlockId };
  },
});

export const denyUnlock = mutation({
  args: {
    requestId: v.id("diagnosticUnlockRequests"),
    deniedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Unlock request not found");
    if (request.status !== "pending") {
      throw new Error("Unlock request is not pending");
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: "denied",
      handledBy: args.deniedBy,
      handledAt: now,
    });

    return { success: true };
  },
});

export const revokeUnlock = mutation({
  args: { unlockId: v.id("diagnosticUnlocks") },
  handler: async (ctx, args) => {
    const unlock = await ctx.db.get(args.unlockId);
    if (!unlock) throw new Error("Unlock not found");
    if (unlock.status !== "approved") return { success: true };
    await ctx.db.patch(args.unlockId, { status: "revoked" });
    return { success: true };
  },
});

export const getPendingUnlockRequests = query({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("diagnosticUnlockRequests")
      .withIndex("by_status", (q: any) => q.eq("status", "pending"))
      .order("desc")
      .take(100);

    return await Promise.all(
      pending.map(async (req: any) => {
        const user = await ctx.db.get(req.userId);
        const major = await ctx.db.get(req.majorObjectiveId as Id<"majorObjectives">);
        const domain = major ? await ctx.db.get(major.domainId) : null;
        return {
          ...req,
          user,
          majorObjective: major,
          domain,
        };
      })
    );
  },
});

export const getFailuresForQueue = query({
  args: {},
  handler: async (ctx) => {
    const failures = await ctx.db
      .query("diagnosticAttempts")
      .withIndex("by_passed", (q: any) => q.eq("passed", false))
      .order("desc")
      .take(200);

    const seen = new Set<string>();
    const latestByPair = [] as any[];

    for (const attempt of failures) {
      const key = `${attempt.userId}-${attempt.majorObjectiveId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      latestByPair.push(attempt);
    }

    const enriched = await Promise.all(
      latestByPair.map(async (attempt: any) => {
        const [user, major, assignment] = await Promise.all([
          ctx.db.get(attempt.userId),
          ctx.db.get(attempt.majorObjectiveId as Id<"majorObjectives">),
          ctx.db
            .query("studentMajorObjectives")
            .withIndex("by_user_major", (q: any) =>
              q
                .eq("userId", attempt.userId)
                .eq("majorObjectiveId", attempt.majorObjectiveId)
            )
            .first(),
        ]);

        if (assignment?.status === "mastered") return null;

        const domain = major ? await ctx.db.get(major.domainId) : null;
        return {
          attemptId: attempt._id,
          attempt,
          user,
          majorObjective: major,
          domain,
          majorAssignment: assignment || null,
        };
      })
    );

    return enriched.filter(Boolean);
  },
});

export const getAllAttemptsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const attempts = await ctx.db.query("diagnosticAttempts").order("desc").take(500);

    return await Promise.all(
      attempts.map(async (attempt: any) => {
        const [user, major, assignment] = await Promise.all([
          ctx.db.get(attempt.userId),
          ctx.db.get(attempt.majorObjectiveId as Id<"majorObjectives">),
          ctx.db
            .query("studentMajorObjectives")
            .withIndex("by_user_major", (q: any) =>
              q
                .eq("userId", attempt.userId)
                .eq("majorObjectiveId", attempt.majorObjectiveId)
            )
            .first(),
        ]);

        const domain = major ? await ctx.db.get(major.domainId) : null;

        return {
          attemptId: attempt._id,
          attempt,
          user,
          majorObjective: major,
          domain,
          majorAssignment: assignment || null,
        };
      })
    );
  },
});

export const getStudentAttempts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("diagnosticAttempts")
      .order("desc")
      .filter((q: any) => q.eq(q.field("userId"), args.userId))
      .take(200);

    return await Promise.all(
      attempts.map(async (attempt: any) => {
        const major = await ctx.db.get(attempt.majorObjectiveId as Id<"majorObjectives">);
        const domain = major ? await ctx.db.get(major.domainId) : null;
        return {
          attemptId: attempt._id,
          attempt: {
            _id: attempt._id,
            passed: attempt.passed,
            score: attempt.score,
            questionCount: attempt.questionCount,
            scorePercent:
              attempt.scorePercent ??
              toScorePercent(attempt.score, Math.max(1, attempt.questionCount)),
            submittedAt: attempt.submittedAt,
            durationMs: attempt.durationMs,
            diagnosticModuleName: attempt.diagnosticModuleName,
            attemptType: attempt.attemptType,
          },
          majorObjective: major
            ? {
                _id: major._id,
                title: major.title,
              }
            : null,
          domain: domain
            ? {
                _id: domain._id,
                name: domain.name,
              }
            : null,
        };
      })
    );
  },
});

export const getStudentAttemptDetails = query({
  args: { userId: v.id("users"), attemptId: v.id("diagnosticAttempts") },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return null;
    if (attempt.userId.toString() !== args.userId.toString()) return null;

    const major = await ctx.db.get(attempt.majorObjectiveId as Id<"majorObjectives">);
    const domain = major ? await ctx.db.get(major.domainId) : null;

    return {
      attempt,
      majorObjective: major
        ? {
            _id: major._id,
            title: major.title,
          }
        : null,
      domain: domain
        ? {
            _id: domain._id,
            name: domain.name,
          }
        : null,
    };
  },
});

export const getAttemptCount = query({
  args: { userId: v.id("users"), majorObjectiveId: v.id("majorObjectives") },
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("diagnosticAttempts")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .collect();
    return { count: attempts.length };
  },
});

export const getAttemptDetails = query({
  args: { attemptId: v.id("diagnosticAttempts") },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return null;
    const user = await ctx.db.get(attempt.userId);
    const major = await ctx.db.get(attempt.majorObjectiveId);
    const domain = major ? await ctx.db.get(major.domainId) : null;
    return { attempt, user, majorObjective: major, domain };
  },
});

export const submitAttempt = mutation({
  args: {
    userId: v.id("users"),
    majorObjectiveId: v.id("majorObjectives"),
    domainId: v.id("domains"),
    attemptType: v.union(v.literal("practice"), v.literal("mastery")),
    diagnosticModuleName: v.string(),
    diagnosticModuleIds: v.array(v.string()),
    questionCount: v.number(),
    score: v.number(),
    passed: v.boolean(),
    startedAt: v.number(),
    durationMs: v.number(),
    results: v.array(
      v.object({
        questionId: v.string(),
        topic: v.string(),
        chosenLabel: v.string(),
        correctLabel: v.string(),
        correct: v.boolean(),
        misconception: v.string(),
        explanation: v.string(),
        visualHtml: v.optional(v.string()),
        stem: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const safeQuestionCount = Math.max(1, args.questionCount);
    const scorePercent = toScorePercent(args.score, safeQuestionCount);
    const passed = scorePercent >= PASS_THRESHOLD_PERCENT;

    let majorAssignment = await ctx.db
      .query("studentMajorObjectives")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .first();

    if (!majorAssignment) {
      const createdId = await ctx.db.insert("studentMajorObjectives", {
        userId: args.userId,
        majorObjectiveId: args.majorObjectiveId,
        assignedBy: args.userId,
        assignedAt: now,
        status: "in_progress",
      });
      majorAssignment = await ctx.db.get(createdId);
    }

    if (majorAssignment?.status === "mastered") {
      throw new Error("This module is already mastered.");
    }

    const latestAttempt = await ctx.db
      .query("diagnosticAttempts")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .order("desc")
      .first();

    let unlockId: Id<"diagnosticUnlocks"> | undefined = undefined;
    let approvedByForAutofill: Id<"users"> =
      (majorAssignment?.assignedBy as Id<"users"> | undefined) ?? args.userId;

    if (latestAttempt && latestAttempt.passed === false) {
      if (majorAssignment?.status !== "viva_requested") {
        throw new Error("Request viva before taking a retake.");
      }

      const latestUnlock = await ctx.db
        .query("diagnosticUnlocks")
        .withIndex("by_user_major", (q: any) =>
          q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
        )
        .order("desc")
        .first();

      if (!latestUnlock) {
        throw new Error("Diagnostic unlock required for retake.");
      }

      const latestUnlockExpiresAt = getUnlockExpiresAt(latestUnlock, now);
      if (latestUnlock.status === "approved" && latestUnlockExpiresAt <= now) {
        await ctx.db.patch(latestUnlock._id, {
          status: "expired",
          expiresAt: latestUnlockExpiresAt,
          attemptsRemaining: 0,
        });
        throw new Error("Diagnostic approval expired");
      }

      const activeUnlock = getActiveUnlockOrNull(latestUnlock, now);
      if (!activeUnlock) {
        throw new Error("Diagnostic unlock required for retake.");
      }

      const nextRemaining = Math.max(0, activeUnlock.attemptsRemaining - 1);
      await ctx.db.patch(activeUnlock._id, {
        attemptsRemaining: nextRemaining,
        expiresAt: activeUnlock.expiresAt,
        status: nextRemaining === 0 ? "consumed" : "approved",
      });

      unlockId = activeUnlock._id;
      approvedByForAutofill =
        (activeUnlock.approvedBy as Id<"users"> | undefined) ??
        (majorAssignment?.assignedBy as Id<"users"> | undefined) ??
        args.userId;
    }

    const attemptId = await ctx.db.insert("diagnosticAttempts", {
      userId: args.userId,
      domainId: args.domainId,
      majorObjectiveId: args.majorObjectiveId,
      studentMajorObjectiveId: majorAssignment?._id ?? undefined,
      unlockId,
      attemptType: args.attemptType,
      diagnosticModuleName: args.diagnosticModuleName,
      diagnosticModuleIds: args.diagnosticModuleIds,
      questionCount: safeQuestionCount,
      score: args.score,
      scorePercent,
      passThresholdPercent: PASS_THRESHOLD_PERCENT,
      passed,
      startedAt: args.startedAt,
      submittedAt: now,
      durationMs: args.durationMs,
      results: args.results,
    });

    await awardXpIfNotExists(ctx, {
      userId: args.userId,
      sourceType: "diagnostic_attempt",
      sourceKey: `diagnostic_attempt:${attemptId}`,
      xp: passed ? CHARACTER_XP.diagnosticPass : CHARACTER_XP.diagnosticFail,
      domainId: args.domainId,
      meta: {
        majorObjectiveId: args.majorObjectiveId,
        attemptType: args.attemptType,
        score: args.score,
        scorePercent,
        passed,
      },
    });

    if (!passed) {
      return {
        attemptId,
        passed: false,
        scorePercent,
        passThresholdPercent: PASS_THRESHOLD_PERCENT,
      };
    }

    if (majorAssignment) {
      await ctx.db.patch(majorAssignment._id, {
        status: "mastered",
        masteredAt: now,
      });

      await awardXpIfNotExists(ctx, {
        userId: args.userId,
        sourceType: "major_mastered",
        sourceKey: `major_mastered:${args.userId}:${args.majorObjectiveId}`,
        xp: CHARACTER_XP.majorMastered,
        domainId: args.domainId,
        meta: {
          majorObjectiveId: args.majorObjectiveId,
          via: "diagnostic_pass",
        },
      });
    }

    const subObjectives = await ctx.db
      .query("learningObjectives")
      .withIndex("by_major_objective", (q: any) =>
        q.eq("majorObjectiveId", args.majorObjectiveId)
      )
      .collect();

    for (const lo of subObjectives) {
      let studentObjective = await ctx.db
        .query("studentObjectives")
        .withIndex("by_user_objective", (q: any) =>
          q.eq("userId", args.userId).eq("objectiveId", lo._id)
        )
        .first();

      if (!studentObjective) {
        const soId = await ctx.db.insert("studentObjectives", {
          userId: args.userId,
          objectiveId: lo._id,
          majorObjectiveId: args.majorObjectiveId,
          assignedBy: approvedByForAutofill,
          assignedAt: now,
          status: "completed",
        });
        studentObjective = await ctx.db.get(soId);
      } else if (studentObjective.status !== "completed") {
        await ctx.db.patch(studentObjective._id, { status: "completed" });
      }

      if (!studentObjective) continue;

      const activities = await ctx.db
        .query("activities")
        .withIndex("by_objective", (q: any) => q.eq("objectiveId", lo._id))
        .collect();

      if (activities.length === 0) continue;

      const progressRecords = await ctx.db
        .query("activityProgress")
        .withIndex("by_student_objective", (q: any) =>
          q.eq("studentObjectiveId", studentObjective._id)
        )
        .collect();

      const progressByActivityId = new Map<string, any>(
        progressRecords.map((p: any) => [p.activityId.toString(), p])
      );

      for (const activity of activities) {
        const existingProgress = progressByActivityId.get(activity._id.toString());
        if (!existingProgress) {
          await ctx.db.insert("activityProgress", {
            userId: args.userId,
            activityId: activity._id,
            studentObjectiveId: studentObjective._id,
            completed: true,
            completedAt: now,
          });
        } else if (!existingProgress.completed) {
          await ctx.db.patch(existingProgress._id, {
            completed: true,
            completedAt: now,
          });
        }
      }
    }

    return {
      attemptId,
      passed: true,
      scorePercent,
      passThresholdPercent: PASS_THRESHOLD_PERCENT,
    };
  },
});
