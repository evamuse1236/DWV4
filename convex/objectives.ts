import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { CHARACTER_XP, awardXpIfNotExists } from "./characterAwards";

const difficulty = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced")
);

const majorStatus = v.union(
  v.literal("assigned"),
  v.literal("in_progress"),
  v.literal("viva_requested"),
  v.literal("mastered")
);

async function cleanupStudentMajorIfEmpty(
  ctx: any,
  userId: Id<"users">,
  majorObjectiveId: Id<"majorObjectives">
) {
  const remaining = await ctx.db
    .query("studentObjectives")
    .withIndex("by_user_major", (q: any) =>
      q.eq("userId", userId).eq("majorObjectiveId", majorObjectiveId)
    )
    .first();

  if (!remaining) {
    const majorAssignment = await ctx.db
      .query("studentMajorObjectives")
      .withIndex("by_user_major", (q: any) =>
        q.eq("userId", userId).eq("majorObjectiveId", majorObjectiveId)
      )
      .first();

    if (majorAssignment) {
      await ctx.db.delete(majorAssignment._id);
    }
  }
}

async function removeSubObjectiveData(
  ctx: any,
  objectiveId: Id<"learningObjectives">
) {
  const activities = await ctx.db
    .query("activities")
    .withIndex("by_objective", (q: any) => q.eq("objectiveId", objectiveId))
    .collect();

  for (const activity of activities) {
    const progress = await ctx.db
      .query("activityProgress")
      .withIndex("by_activity", (q: any) => q.eq("activityId", activity._id))
      .collect();

    for (const p of progress) {
      await ctx.db.delete(p._id);
    }

    await ctx.db.delete(activity._id);
  }

  const assignments = await ctx.db
    .query("studentObjectives")
    .withIndex("by_objective", (q: any) => q.eq("objectiveId", objectiveId))
    .collect();

  const cleanupPairs = new Map<string, { userId: Id<"users">; majorObjectiveId: Id<"majorObjectives"> }>();

  for (const assignment of assignments) {
    const progress = await ctx.db
      .query("activityProgress")
      .withIndex("by_student_objective", (q: any) =>
        q.eq("studentObjectiveId", assignment._id)
      )
      .collect();

    for (const p of progress) {
      await ctx.db.delete(p._id);
    }

    if (assignment.majorObjectiveId) {
      const key = `${assignment.userId}-${assignment.majorObjectiveId}`;
      cleanupPairs.set(key, {
        userId: assignment.userId,
        majorObjectiveId: assignment.majorObjectiveId,
      });
    }

    await ctx.db.delete(assignment._id);
  }

  for (const pair of cleanupPairs.values()) {
    await cleanupStudentMajorIfEmpty(ctx, pair.userId, pair.majorObjectiveId);
  }
}

async function buildStudentMajorData(
  ctx: any,
  userId: Id<"users">,
  options?: { domainId?: Id<"domains">; includeActivities?: boolean }
) {
  const [domains, studentMajors, studentSubs] = await Promise.all([
    ctx.db.query("domains").collect(),
    ctx.db
      .query("studentMajorObjectives")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect(),
    ctx.db
      .query("studentObjectives")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect(),
  ]);

  const domainMap = new Map(domains.map((domain: any) => [domain._id.toString(), domain]));
  const majorAssignmentMap = new Map(
    studentMajors.map((assignment: any) => [assignment.majorObjectiveId.toString(), assignment])
  );

  const subEntries = await Promise.all(
    studentSubs.map(async (assignment: any) => {
      const objective = await ctx.db.get(assignment.objectiveId);
      if (!objective) return null;

      const majorObjectiveId = objective.majorObjectiveId || assignment.majorObjectiveId;
      if (!majorObjectiveId) return null;

      let activities = [] as any[];
      if (options?.includeActivities) {
        const objectiveActivities = await ctx.db
          .query("activities")
          .withIndex("by_objective", (q: any) => q.eq("objectiveId", objective._id))
          .collect();

        const progress = await ctx.db
          .query("activityProgress")
          .withIndex("by_student_objective", (q: any) =>
            q.eq("studentObjectiveId", assignment._id)
          )
          .collect();

        const progressMap = new Map(
          progress.map((p: any) => [p.activityId.toString(), p])
        );

        activities = objectiveActivities
          .sort((a: any, b: any) => a.order - b.order)
          .map((activity: any) => ({
            ...activity,
            progress: progressMap.get(activity._id.toString()),
          }));
      }

      return {
        ...assignment,
        majorObjectiveId,
        objective,
        activities,
      };
    })
  );

  const filteredSubEntries = subEntries.filter(Boolean) as any[];
  const majorIds = new Set<string>();

  for (const entry of filteredSubEntries) {
    majorIds.add(entry.majorObjectiveId.toString());
  }
  for (const assignment of studentMajors) {
    majorIds.add(assignment.majorObjectiveId.toString());
  }

  const majorObjectives = await Promise.all(
    Array.from(majorIds).map(async (id) => ctx.db.get(id as Id<"majorObjectives">))
  );

  const majorMap = new Map(
    majorObjectives
      .filter(Boolean)
      .map((major: any) => [major._id.toString(), major])
  );

  const subsByMajor = new Map<string, any[]>();
  for (const entry of filteredSubEntries) {
    const key = entry.majorObjectiveId.toString();
    if (!subsByMajor.has(key)) {
      subsByMajor.set(key, []);
    }
    subsByMajor.get(key)?.push(entry);
  }

  const result = [] as any[];

  for (const [majorId, major] of majorMap.entries()) {
    if (options?.domainId && major.domainId !== options.domainId) continue;

    const domain = domainMap.get(major.domainId.toString()) || null;
    result.push({
      majorObjective: major,
      domain,
      assignment: majorAssignmentMap.get(majorId) || null,
      subObjectives: subsByMajor.get(majorId) || [],
    });
  }

  return result;
}

// Get all major objectives (admin)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const majors = await ctx.db.query("majorObjectives").collect();

    return await Promise.all(
      majors.map(async (major) => {
        const domain = await ctx.db.get(major.domainId);
        const assignments = await ctx.db
          .query("studentMajorObjectives")
          .withIndex("by_major_objective", (q: any) =>
            q.eq("majorObjectiveId", major._id)
          )
          .collect();

        const subObjectives = await ctx.db
          .query("learningObjectives")
          .withIndex("by_major_objective", (q: any) =>
            q.eq("majorObjectiveId", major._id)
          )
          .collect();

        return {
          ...major,
          domain,
          assignedCount: assignments.length,
          masteredCount: assignments.filter((a) => a.status === "mastered").length,
          subObjectiveCount: subObjectives.length,
        };
      })
    );
  },
});

// Get major objectives with sub objectives for a domain
export const getByDomain = query({
  args: { domainId: v.id("domains") },
  handler: async (ctx, args) => {
    const majors = await ctx.db
      .query("majorObjectives")
      .withIndex("by_domain", (q) => q.eq("domainId", args.domainId))
      .collect();

    const subs = await ctx.db
      .query("learningObjectives")
      .withIndex("by_domain", (q) => q.eq("domainId", args.domainId))
      .collect();

    return majors.map((major) => ({
      ...major,
      subObjectives: subs
        .filter((sub) => sub.majorObjectiveId === major._id)
        .sort((a, b) => a.createdAt - b.createdAt),
    }));
  },
});

// Get all sub objectives (admin)
export const getAllSubObjectives = query({
  args: {},
  handler: async (ctx) => {
    const [subs, majors, domains] = await Promise.all([
      ctx.db.query("learningObjectives").collect(),
      ctx.db.query("majorObjectives").collect(),
      ctx.db.query("domains").collect(),
    ]);

    const majorMap = new Map(majors.map((m: any) => [m._id.toString(), m]));
    const domainMap = new Map(domains.map((d: any) => [d._id.toString(), d]));

    return subs.map((sub) => {
      const major = sub.majorObjectiveId
        ? majorMap.get(sub.majorObjectiveId.toString())
        : null;
      const domain = domainMap.get(sub.domainId.toString()) || null;
      return {
        ...sub,
        majorObjective: major,
        domain,
      };
    });
  },
});

// Create a major objective (admin only)
export const create = mutation({
  args: {
    domainId: v.id("domains"),
    title: v.string(),
    description: v.string(),
    curriculum: v.optional(v.string()),
    difficulty: v.optional(difficulty),
    estimatedHours: v.optional(v.number()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("majorObjectives", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Update a major objective (admin only)
export const update = mutation({
  args: {
    objectiveId: v.id("majorObjectives"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    difficulty: v.optional(difficulty),
    estimatedHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { objectiveId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(objectiveId, filteredUpdates);
    return { success: true };
  },
});

// Remove a major objective and its related data (admin only)
export const remove = mutation({
  args: { objectiveId: v.id("majorObjectives") },
  handler: async (ctx, args) => {
    const subObjectives = await ctx.db
      .query("learningObjectives")
      .withIndex("by_major_objective", (q: any) =>
        q.eq("majorObjectiveId", args.objectiveId)
      )
      .collect();

    for (const sub of subObjectives) {
      await removeSubObjectiveData(ctx, sub._id);
      await ctx.db.delete(sub._id);
    }

    const assignments = await ctx.db
      .query("studentMajorObjectives")
      .withIndex("by_major_objective", (q: any) =>
        q.eq("majorObjectiveId", args.objectiveId)
      )
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    await ctx.db.delete(args.objectiveId);

    return { success: true };
  },
});

// Create a sub objective (admin only)
export const createSubObjective = mutation({
  args: {
    majorObjectiveId: v.id("majorObjectives"),
    title: v.string(),
    description: v.string(),
    difficulty,
    estimatedHours: v.optional(v.number()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const major = await ctx.db.get(args.majorObjectiveId);
    if (!major) {
      throw new Error("Major objective not found");
    }

    return await ctx.db.insert("learningObjectives", {
      domainId: major.domainId,
      majorObjectiveId: args.majorObjectiveId,
      title: args.title,
      description: args.description,
      difficulty: args.difficulty,
      estimatedHours: args.estimatedHours,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
  },
});

// Update a sub objective (admin only)
export const updateSubObjective = mutation({
  args: {
    objectiveId: v.id("learningObjectives"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    difficulty: v.optional(difficulty),
    estimatedHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { objectiveId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(objectiveId, filteredUpdates);
    return { success: true };
  },
});

// Remove a sub objective and its related data (admin only)
export const removeSubObjective = mutation({
  args: { objectiveId: v.id("learningObjectives") },
  handler: async (ctx, args) => {
    await removeSubObjectiveData(ctx, args.objectiveId);
    await ctx.db.delete(args.objectiveId);
    return { success: true };
  },
});

// Assign sub objective to student
export const assignToStudent = mutation({
  args: {
    userId: v.id("users"),
    objectiveId: v.id("learningObjectives"),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const objective = await ctx.db.get(args.objectiveId);
    if (!objective?.majorObjectiveId) {
      throw new Error("Sub objective is missing a major objective");
    }

    const majorObjectiveId = objective.majorObjectiveId;

    let studentMajor = await ctx.db
      .query("studentMajorObjectives")
      .withIndex("by_user_major", (q) =>
        q.eq("userId", args.userId).eq("majorObjectiveId", majorObjectiveId)
      )
      .first();

    if (!studentMajor) {
      await ctx.db.insert("studentMajorObjectives", {
        userId: args.userId,
        majorObjectiveId,
        assignedBy: args.assignedBy,
        status: "assigned",
        assignedAt: Date.now(),
      });
    }

    const existing = await ctx.db
      .query("studentObjectives")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("objectiveId"), args.objectiveId)
        )
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("studentObjectives", {
      userId: args.userId,
      objectiveId: args.objectiveId,
      majorObjectiveId,
      assignedBy: args.assignedBy,
      status: "assigned",
      assignedAt: Date.now(),
    });
  },
});

// Assign sub objective to multiple students at once
export const assignToMultipleStudents = mutation({
  args: {
    studentIds: v.array(v.id("users")),
    objectiveId: v.id("learningObjectives"),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const objective = await ctx.db.get(args.objectiveId);
    if (!objective?.majorObjectiveId) {
      throw new Error("Sub objective is missing a major objective");
    }

    const majorObjectiveId = objective.majorObjectiveId;
    const results = [] as any[];

    for (const userId of args.studentIds) {
      const majorAssignment = await ctx.db
        .query("studentMajorObjectives")
        .withIndex("by_user_major", (q) =>
          q.eq("userId", userId).eq("majorObjectiveId", majorObjectiveId)
        )
        .first();

      if (!majorAssignment) {
        await ctx.db.insert("studentMajorObjectives", {
          userId,
          majorObjectiveId,
          assignedBy: args.assignedBy,
          status: "assigned",
          assignedAt: Date.now(),
        });
      }

      const existing = await ctx.db
        .query("studentObjectives")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("objectiveId"), args.objectiveId)
          )
        )
        .first();

      if (!existing) {
        const id = await ctx.db.insert("studentObjectives", {
          userId,
          objectiveId: args.objectiveId,
          majorObjectiveId,
          assignedBy: args.assignedBy,
          status: "assigned",
          assignedAt: Date.now(),
        });
        results.push({ userId, id, created: true });
      } else {
        results.push({ userId, id: existing._id, created: false });
      }
    }

    return results;
  },
});

// Unassign sub objective from student
export const unassignFromStudent = mutation({
  args: {
    userId: v.id("users"),
    objectiveId: v.id("learningObjectives"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("studentObjectives")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("objectiveId"), args.objectiveId)
        )
      )
      .first();

    if (existing) {
      const progressRecords = await ctx.db
        .query("activityProgress")
        .withIndex("by_student_objective", (q) =>
          q.eq("studentObjectiveId", existing._id)
        )
        .collect();

      for (const progress of progressRecords) {
        await ctx.db.delete(progress._id);
      }

      await ctx.db.delete(existing._id);

      if (existing.majorObjectiveId) {
        await cleanupStudentMajorIfEmpty(
          ctx,
          existing.userId,
          existing.majorObjectiveId
        );
      }

      return { success: true };
    }

    return { success: false, message: "Assignment not found" };
  },
});

// Get students assigned to a specific sub objective (admin)
export const getAssignedStudents = query({
  args: { objectiveId: v.id("learningObjectives") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("studentObjectives")
      .filter((q) => q.eq(q.field("objectiveId"), args.objectiveId))
      .collect();

    return await Promise.all(
      assignments.map(async (assignment) => {
        const user = await ctx.db.get(assignment.userId);
        return {
          ...assignment,
          user,
        };
      })
    );
  },
});

// Get students assigned to ALL sub-objectives of a chapter (admin)
export const getAssignedStudentsForChapter = query({
  args: { majorObjectiveId: v.id("majorObjectives") },
  handler: async (ctx, args) => {
    // Get all sub-objectives for this major
    const subObjectives = await ctx.db
      .query("learningObjectives")
      .withIndex("by_major_objective", (q) =>
        q.eq("majorObjectiveId", args.majorObjectiveId)
      )
      .collect();

    if (subObjectives.length === 0) {
      return [];
    }

    // Get all studentMajorObjective assignments for this chapter
    const majorAssignments = await ctx.db
      .query("studentMajorObjectives")
      .withIndex("by_major_objective", (q) =>
        q.eq("majorObjectiveId", args.majorObjectiveId)
      )
      .collect();

    // For each student with a major assignment, check if they have ALL sub-objectives
    const fullyAssigned = [];
    for (const ma of majorAssignments) {
      const studentSubAssignments = await ctx.db
        .query("studentObjectives")
        .withIndex("by_user_major", (q) =>
          q.eq("userId", ma.userId).eq("majorObjectiveId", args.majorObjectiveId)
        )
        .collect();

      if (studentSubAssignments.length >= subObjectives.length) {
        const user = await ctx.db.get(ma.userId);
        fullyAssigned.push({ ...ma, user });
      }
    }

    return fullyAssigned;
  },
});

// Assign all sub-objectives of a chapter to multiple students
export const assignChapterToMultipleStudents = mutation({
  args: {
    majorObjectiveId: v.id("majorObjectives"),
    studentIds: v.array(v.id("users")),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const major = await ctx.db.get(args.majorObjectiveId);
    if (!major) {
      throw new Error("Major objective not found");
    }

    // Get all sub-objectives for this major
    const subObjectives = await ctx.db
      .query("learningObjectives")
      .withIndex("by_major_objective", (q) =>
        q.eq("majorObjectiveId", args.majorObjectiveId)
      )
      .collect();

    let assignedCount = 0;

    for (const userId of args.studentIds) {
      // Ensure major assignment exists
      const existingMajor = await ctx.db
        .query("studentMajorObjectives")
        .withIndex("by_user_major", (q) =>
          q.eq("userId", userId).eq("majorObjectiveId", args.majorObjectiveId)
        )
        .first();

      if (!existingMajor) {
        await ctx.db.insert("studentMajorObjectives", {
          userId,
          majorObjectiveId: args.majorObjectiveId,
          assignedBy: args.assignedBy,
          status: "assigned",
          assignedAt: Date.now(),
        });
      }

      // Assign each sub-objective
      for (const sub of subObjectives) {
        const existing = await ctx.db
          .query("studentObjectives")
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), userId),
              q.eq(q.field("objectiveId"), sub._id)
            )
          )
          .first();

        if (!existing) {
          await ctx.db.insert("studentObjectives", {
            userId,
            objectiveId: sub._id,
            majorObjectiveId: args.majorObjectiveId,
            assignedBy: args.assignedBy,
            status: "assigned",
            assignedAt: Date.now(),
          });
          assignedCount++;
        }
      }
    }

    return {
      studentsCount: args.studentIds.length,
      subObjectivesCount: subObjectives.length,
      newAssignments: assignedCount,
    };
  },
});

// Update major objective status (viva workflow)
export const updateStatus = mutation({
  args: {
    studentMajorObjectiveId: v.id("studentMajorObjectives"),
    status: majorStatus,
    vivaRequestNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.studentMajorObjectiveId);
    if (!assignment) {
      throw new Error("Student major objective not found");
    }

    const updates: any = { status: args.status };

    if (args.status === "viva_requested") {
      updates.vivaRequestedAt = Date.now();
      // Save notes if provided when requesting viva
      if (args.vivaRequestNotes !== undefined) {
        updates.vivaRequestNotes = args.vivaRequestNotes;
      }
    } else if (args.status === "mastered") {
      updates.masteredAt = Date.now();
    }

    await ctx.db.patch(args.studentMajorObjectiveId, updates);

    if (args.status === "mastered" && assignment.status !== "mastered") {
      const major = await ctx.db.get(assignment.majorObjectiveId);
      await awardXpIfNotExists(ctx, {
        userId: assignment.userId,
        sourceType: "major_mastered",
        sourceKey: `major_mastered:${assignment.userId}:${assignment.majorObjectiveId}`,
        xp: CHARACTER_XP.majorMastered,
        domainId: major?.domainId,
        meta: {
          majorObjectiveId: assignment.majorObjectiveId,
          via: "manual_status_update",
        },
      });
    }
  },
});

// Get all objectives with viva requests (admin)
export const getVivaRequests = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query("studentMajorObjectives")
      .filter((q) => q.eq(q.field("status"), "viva_requested"))
      .collect();

    return await Promise.all(
      requests.map(async (req) => {
        const user = await ctx.db.get(req.userId);
        const majorObjective = await ctx.db.get(req.majorObjectiveId);
        const domain = majorObjective
          ? await ctx.db.get(majorObjective.domainId)
          : null;
        return {
          ...req,
          user,
          objective: majorObjective,
          domain,
        };
      })
    );
  },
});

// Get objectives assigned to a student (admin)
export const getAssignedToStudent = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await buildStudentMajorData(ctx, args.userId, {
      includeActivities: false,
    });
  },
});

// Get objectives assigned to student by domain
export const getAssignedByDomain = query({
  args: { userId: v.id("users"), domainId: v.id("domains") },
  handler: async (ctx, args) => {
    return await buildStudentMajorData(ctx, args.userId, {
      domainId: args.domainId,
      includeActivities: true,
    });
  },
});

// Get all tree data for skill tree visualization
export const getTreeData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const [domains, assignments] = await Promise.all([
      ctx.db.query("domains").collect(),
      buildStudentMajorData(ctx, args.userId, { includeActivities: true }),
    ]);

    const majorsByDomain: Record<string, any[]> = {};

    for (const entry of assignments) {
      const domainId = entry.majorObjective.domainId.toString();
      if (!majorsByDomain[domainId]) {
        majorsByDomain[domainId] = [];
      }
      majorsByDomain[domainId].push(entry);
    }

    return {
      domains,
      majorsByDomain,
    };
  },
});

// Migrate existing objectives to major/sub structure
export const migrateObjectivesToMajorSub = mutation({
  args: {},
  handler: async (ctx) => {
    const objectives = await ctx.db.query("learningObjectives").collect();
    const studentObjectives = await ctx.db.query("studentObjectives").collect();
    const studentMajors = await ctx.db.query("studentMajorObjectives").collect();

    const majorByLegacyId = new Map<string, Id<"majorObjectives">>();
    const majorAssignmentMap = new Map<string, any>(
      studentMajors.map((assignment: any) => [
        `${assignment.userId}-${assignment.majorObjectiveId}`,
        assignment,
      ])
    );

    const statusRank: Record<string, number> = {
      assigned: 0,
      in_progress: 1,
      viva_requested: 2,
      mastered: 3,
    };

    for (const objective of objectives) {
      if (objective.majorObjectiveId) {
        majorByLegacyId.set(objective._id.toString(), objective.majorObjectiveId);
        continue;
      }

      const majorId = await ctx.db.insert("majorObjectives", {
        domainId: objective.domainId,
        title: objective.title,
        description: objective.description,
        difficulty: objective.difficulty,
        estimatedHours: objective.estimatedHours,
        createdBy: objective.createdBy,
        createdAt: objective.createdAt,
      });

      majorByLegacyId.set(objective._id.toString(), majorId);

      await ctx.db.patch(objective._id, {
        majorObjectiveId: majorId,
      });
    }

    for (const assignment of studentObjectives) {
      const key = assignment.objectiveId.toString();
      const majorObjectiveId = majorByLegacyId.get(key);
      if (!majorObjectiveId) continue;

      if (assignment.majorObjectiveId !== majorObjectiveId) {
        await ctx.db.patch(assignment._id, { majorObjectiveId });
      }

      const pairKey = `${assignment.userId}-${majorObjectiveId}`;
      const existingMajor = majorAssignmentMap.get(pairKey);

      // Map legacy status to valid major objective status
      const legacyStatus = assignment.status as string;
      const statusMapping: Record<string, "assigned" | "in_progress" | "viva_requested" | "mastered"> = {
        mastered: "mastered",
        viva_requested: "viva_requested",
        in_progress: "in_progress",
      };
      const legacyMajorStatus = statusMapping[legacyStatus] ?? "assigned";

      if (!existingMajor) {
        const created = await ctx.db.insert("studentMajorObjectives", {
          userId: assignment.userId,
          majorObjectiveId,
          assignedBy: assignment.assignedBy,
          assignedAt: assignment.assignedAt,
          status: legacyMajorStatus,
          vivaRequestedAt: assignment.vivaRequestedAt,
          masteredAt: assignment.masteredAt,
        });
        majorAssignmentMap.set(pairKey, {
          _id: created,
          userId: assignment.userId,
          majorObjectiveId,
          status: legacyMajorStatus,
        });
      } else if (
        statusRank[legacyMajorStatus] > statusRank[existingMajor.status]
      ) {
        await ctx.db.patch(existingMajor._id, {
          status: legacyMajorStatus,
          vivaRequestedAt: assignment.vivaRequestedAt ?? existingMajor.vivaRequestedAt,
          masteredAt: assignment.masteredAt ?? existingMajor.masteredAt,
        });
      }

      // Map legacy status to sub-objective status (mastered/viva_requested become completed)
      type SubStatus = "assigned" | "in_progress" | "completed";
      const subStatusMapping: Record<string, SubStatus> = {
        mastered: "completed",
        viva_requested: "completed",
        in_progress: "in_progress",
      };
      const mappedSubStatus: SubStatus = subStatusMapping[legacyStatus] ?? "assigned";

      if (assignment.status !== mappedSubStatus) {
        await ctx.db.patch(assignment._id, { status: mappedSubStatus });
      }
    }

    return { success: true };
  },
});
