import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

function isCurriculumPyp(curriculum: string | undefined | null): boolean {
  return Boolean(curriculum && curriculum.toLowerCase().includes("pyp"));
}

function getActiveUnlockOrNull(unlock: any, now: number) {
  if (!unlock) return null;
  if (unlock.status !== "approved") return null;
  if (unlock.attemptsRemaining <= 0) return null;
  if (unlock.expiresAt <= now) return null;
  return unlock;
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
            durationMs: latestAttempt.durationMs,
            submittedAt: latestAttempt.submittedAt,
            attemptType: latestAttempt.attemptType,
            diagnosticModuleName: latestAttempt.diagnosticModuleName,
          }
        : null,
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
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const passed = args.score === args.questionCount;

    const latestUnlock = await ctx.db
      .query("diagnosticUnlocks")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .order("desc")
      .first();

    if (!latestUnlock) {
      throw new Error("Diagnostic not approved yet");
    }

    if (latestUnlock.status === "approved" && latestUnlock.expiresAt <= now) {
      await ctx.db.patch(latestUnlock._id, { status: "expired" });
      throw new Error("Diagnostic approval expired");
    }

    const activeUnlock = getActiveUnlockOrNull(latestUnlock, now);
    if (!activeUnlock) {
      throw new Error("Diagnostic not approved yet");
    }

    const nextRemaining = Math.max(0, activeUnlock.attemptsRemaining - 1);
    await ctx.db.patch(activeUnlock._id, {
      attemptsRemaining: nextRemaining,
      status: nextRemaining === 0 ? "consumed" : "approved",
    });

    const existingMajorAssignment = await ctx.db
      .query("studentMajorObjectives")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", args.majorObjectiveId)
      )
      .first();

    const attemptId = await ctx.db.insert("diagnosticAttempts", {
      userId: args.userId,
      domainId: args.domainId,
      majorObjectiveId: args.majorObjectiveId,
      studentMajorObjectiveId: existingMajorAssignment?._id ?? undefined,
      unlockId: activeUnlock._id,
      attemptType: args.attemptType,
      diagnosticModuleName: args.diagnosticModuleName,
      diagnosticModuleIds: args.diagnosticModuleIds,
      questionCount: args.questionCount,
      score: args.score,
      passed,
      startedAt: args.startedAt,
      submittedAt: now,
      durationMs: args.durationMs,
      results: args.results,
    });

    if (!passed) {
      return { attemptId, passed: false };
    }

    // ===== PASS: auto-complete all remaining work + auto-master =====
    const majorAssignmentId =
      existingMajorAssignment?._id ??
      (await ctx.db.insert("studentMajorObjectives", {
        userId: args.userId,
        majorObjectiveId: args.majorObjectiveId,
        assignedBy: activeUnlock.approvedBy,
        assignedAt: now,
        status: "mastered",
        masteredAt: now,
      }));

    if (existingMajorAssignment) {
      await ctx.db.patch(existingMajorAssignment._id, {
        status: "mastered",
        masteredAt: now,
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
          assignedBy: activeUnlock.approvedBy,
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

    // Patch the attempt with studentMajorObjectiveId if it was created above.
    if (!existingMajorAssignment) {
      await ctx.db.patch(attemptId, {
        studentMajorObjectiveId: majorAssignmentId,
      });
    }

    return { attemptId, passed: true };
  },
});
