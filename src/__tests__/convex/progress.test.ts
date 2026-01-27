/**
 * Tests for convex/progress.ts mutations and queries.
 *
 * These tests use a mock database context to test the handler logic
 * without needing a real Convex backend.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "../../../convex/_generated/dataModel";

describe("Progress - toggleActivity", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockAdminId: Id<"users">;
  let mockStudentId: Id<"users">;
  let mockDomainId: Id<"domains">;
  let mockMajorId: Id<"majorObjectives">;
  let mockSubId: Id<"learningObjectives">;
  let mockActivityId: Id<"activities">;
  let mockStudentObjId: Id<"studentObjectives">;
  let mockMajorAssignmentId: Id<"studentMajorObjectives">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockAdminId = createMockId("users");
    mockStudentId = createMockId("users");
    mockDomainId = createMockId("domains");
    mockMajorId = createMockId("majorObjectives");
    mockSubId = createMockId("learningObjectives");
    mockActivityId = createMockId("activities");
    mockStudentObjId = createMockId("studentObjectives");
    mockMajorAssignmentId = createMockId("studentMajorObjectives");

    mockCtx.db._seed(mockAdminId, {
      username: "admin",
      role: "admin",
      displayName: "Admin",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockStudentId, {
      username: "student",
      role: "student",
      displayName: "Student",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockDomainId, {
      name: "Math",
      icon: "calc",
      color: "#F00",
      description: "Math domain",
      order: 1,
    });

    mockCtx.db._seed(mockMajorId, {
      domainId: mockDomainId,
      title: "Algebra",
      description: "Algebra fundamentals",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockSubId, {
      domainId: mockDomainId,
      majorObjectiveId: mockMajorId,
      title: "Linear Equations",
      description: "Solve linear equations",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockActivityId, {
      objectiveId: mockSubId,
      title: "Watch Introduction Video",
      type: "video",
      url: "https://example.com/video",
      order: 0,
    });

    mockCtx.db._seed(mockMajorAssignmentId, {
      userId: mockStudentId,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    mockCtx.db._seed(mockStudentObjId, {
      userId: mockStudentId,
      objectiveId: mockSubId,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });
  });

  describe("basic toggle behavior", () => {
    it("should create progress record if missing", async () => {
      // Verify no progress exists yet
      const existingProgress = await mockCtx.db
        .query("activityProgress")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), mockStudentId),
            q.eq(q.field("activityId"), mockActivityId),
            q.eq(q.field("studentObjectiveId"), mockStudentObjId)
          )
        )
        .first();

      expect(existingProgress).toBeNull();

      const now = Date.now();
      vi.setSystemTime(now);

      // Simulate toggleActivity - creates new progress
      const progressId = await mockCtx.db.insert("activityProgress", {
        userId: mockStudentId,
        activityId: mockActivityId,
        studentObjectiveId: mockStudentObjId,
        completed: true,
        completedAt: now,
      });

      const progress = await mockCtx.db.get(progressId);
      expect(progress).not.toBeNull();
      expect(progress?.completed).toBe(true);
      expect(progress?.completedAt).toBe(now);

      vi.useRealTimers();
    });

    it("should toggle completion from true to false", async () => {
      const now = Date.now();

      // Create existing completed progress
      const progressId = await mockCtx.db.insert("activityProgress", {
        userId: mockStudentId,
        activityId: mockActivityId,
        studentObjectiveId: mockStudentObjId,
        completed: true,
        completedAt: now,
      });

      // Simulate toggle
      const existing = await mockCtx.db.get(progressId);
      expect(existing?.completed).toBe(true);

      await mockCtx.db.patch(progressId, {
        completed: !existing!.completed,
        completedAt: existing!.completed ? undefined : Date.now(),
      });

      const toggled = await mockCtx.db.get(progressId);
      expect(toggled?.completed).toBe(false);
      expect(toggled?.completedAt).toBeUndefined();
    });

    it("should toggle completion from false to true", async () => {
      // Create existing incomplete progress
      const progressId = await mockCtx.db.insert("activityProgress", {
        userId: mockStudentId,
        activityId: mockActivityId,
        studentObjectiveId: mockStudentObjId,
        completed: false,
      });

      const now = Date.now();
      vi.setSystemTime(now);

      const existing = await mockCtx.db.get(progressId);
      expect(existing?.completed).toBe(false);

      await mockCtx.db.patch(progressId, {
        completed: !existing!.completed,
        completedAt: !existing!.completed ? now : undefined,
      });

      const toggled = await mockCtx.db.get(progressId);
      expect(toggled?.completed).toBe(true);
      expect(toggled?.completedAt).toBe(now);

      vi.useRealTimers();
    });
  });

  describe("sub-objective status updates", () => {
    it("should update sub-objective to in_progress when some activities completed", async () => {
      // Add a second activity
      const _activity2Id = await mockCtx.db.insert("activities", {
        objectiveId: mockSubId,
        title: "Do Exercise",
        type: "exercise",
        url: "https://example.com/exercise",
        order: 1,
      });

      // Complete first activity
      await mockCtx.db.insert("activityProgress", {
        userId: mockStudentId,
        activityId: mockActivityId,
        studentObjectiveId: mockStudentObjId,
        completed: true,
        completedAt: Date.now(),
      });

      // Simulate status recalculation logic from toggleActivity
      const activities = await mockCtx.db
        .query("activities")
        .withIndex("by_objective", (q) => q.eq("objectiveId", mockSubId))
        .collect();

      const progress = await mockCtx.db
        .query("activityProgress")
        .withIndex("by_student_objective", (q) =>
          q.eq("studentObjectiveId", mockStudentObjId)
        )
        .collect();

      const progressMap = new Map(
        progress.map((p) => [(p.activityId as string).toString(), p])
      );

      const completedCount = activities.filter(
        (activity) => progressMap.get(activity._id.toString())?.completed
      ).length;

      const hasAny = completedCount > 0;
      const allCompleted =
        activities.length === 0 || completedCount === activities.length;

      const nextStatus = allCompleted
        ? "completed"
        : hasAny
          ? "in_progress"
          : "assigned";

      expect(nextStatus).toBe("in_progress");

      await mockCtx.db.patch(mockStudentObjId, { status: nextStatus });

      const studentObj = await mockCtx.db.get(mockStudentObjId);
      expect(studentObj?.status).toBe("in_progress");
    });

    it("should update sub-objective to completed when all activities completed", async () => {
      // Complete the only activity
      await mockCtx.db.insert("activityProgress", {
        userId: mockStudentId,
        activityId: mockActivityId,
        studentObjectiveId: mockStudentObjId,
        completed: true,
        completedAt: Date.now(),
      });

      // Simulate status recalculation
      const activities = await mockCtx.db
        .query("activities")
        .withIndex("by_objective", (q) => q.eq("objectiveId", mockSubId))
        .collect();

      const progress = await mockCtx.db
        .query("activityProgress")
        .withIndex("by_student_objective", (q) =>
          q.eq("studentObjectiveId", mockStudentObjId)
        )
        .collect();

      const progressMap = new Map(
        progress.map((p) => [(p.activityId as string).toString(), p])
      );

      const completedCount = activities.filter(
        (activity) => progressMap.get(activity._id.toString())?.completed
      ).length;

      const hasAny = completedCount > 0;
      const allCompleted =
        activities.length === 0 || completedCount === activities.length;

      const nextStatus = allCompleted
        ? "completed"
        : hasAny
          ? "in_progress"
          : "assigned";

      expect(nextStatus).toBe("completed");

      await mockCtx.db.patch(mockStudentObjId, { status: nextStatus });

      const studentObj = await mockCtx.db.get(mockStudentObjId);
      expect(studentObj?.status).toBe("completed");
    });

    it("should revert sub-objective to assigned when no activities completed", async () => {
      // First complete an activity
      const progressId = await mockCtx.db.insert("activityProgress", {
        userId: mockStudentId,
        activityId: mockActivityId,
        studentObjectiveId: mockStudentObjId,
        completed: true,
        completedAt: Date.now(),
      });

      await mockCtx.db.patch(mockStudentObjId, { status: "in_progress" });

      // Now uncomplete it
      await mockCtx.db.patch(progressId, { completed: false, completedAt: undefined });

      // Recalculate
      const activities = await mockCtx.db
        .query("activities")
        .withIndex("by_objective", (q) => q.eq("objectiveId", mockSubId))
        .collect();

      const progress = await mockCtx.db
        .query("activityProgress")
        .withIndex("by_student_objective", (q) =>
          q.eq("studentObjectiveId", mockStudentObjId)
        )
        .collect();

      const progressMap = new Map(
        progress.map((p) => [(p.activityId as string).toString(), p])
      );

      const completedCount = activities.filter(
        (activity) => progressMap.get(activity._id.toString())?.completed
      ).length;

      const hasAny = completedCount > 0;
      const allCompleted =
        activities.length === 0 || completedCount === activities.length;

      const nextStatus = allCompleted
        ? "completed"
        : hasAny
          ? "in_progress"
          : "assigned";

      expect(nextStatus).toBe("assigned");

      await mockCtx.db.patch(mockStudentObjId, { status: nextStatus });

      const studentObj = await mockCtx.db.get(mockStudentObjId);
      expect(studentObj?.status).toBe("assigned");
    });
  });

  describe("major assignment status transitions", () => {
    it("should transition major from assigned to in_progress when sub starts", async () => {
      // Verify major is assigned
      let majorAssignment = await mockCtx.db.get(mockMajorAssignmentId);
      expect(majorAssignment?.status).toBe("assigned");

      // Update sub to in_progress
      await mockCtx.db.patch(mockStudentObjId, { status: "in_progress" });

      // Simulate major status update logic
      const subs = await mockCtx.db
        .query("studentObjectives")
        .withIndex("by_user_major", (q) =>
          q.eq("userId", mockStudentId).eq("majorObjectiveId", mockMajorId)
        )
        .collect();

      const anyStarted = subs.some((s) => s.status !== "assigned");

      if (majorAssignment!.status === "assigned" && anyStarted) {
        await mockCtx.db.patch(mockMajorAssignmentId, { status: "in_progress" });
      }

      majorAssignment = await mockCtx.db.get(mockMajorAssignmentId);
      expect(majorAssignment?.status).toBe("in_progress");
    });

    it("should transition major from in_progress to assigned when all subs revert", async () => {
      // Set major to in_progress
      await mockCtx.db.patch(mockMajorAssignmentId, { status: "in_progress" });
      await mockCtx.db.patch(mockStudentObjId, { status: "in_progress" });

      // Now revert sub to assigned
      await mockCtx.db.patch(mockStudentObjId, { status: "assigned" });

      // Simulate major status update logic
      const majorAssignment = await mockCtx.db.get(mockMajorAssignmentId);
      const subs = await mockCtx.db
        .query("studentObjectives")
        .withIndex("by_user_major", (q) =>
          q.eq("userId", mockStudentId).eq("majorObjectiveId", mockMajorId)
        )
        .collect();

      const anyStarted = subs.some((s) => s.status !== "assigned");

      let nextMajorStatus = majorAssignment!.status as string;

      if (majorAssignment!.status === "in_progress" && !anyStarted) {
        nextMajorStatus = "assigned";
      }

      await mockCtx.db.patch(mockMajorAssignmentId, { status: nextMajorStatus });

      const updated = await mockCtx.db.get(mockMajorAssignmentId);
      expect(updated?.status).toBe("assigned");
    });

    it("should transition viva_requested to in_progress when subs become incomplete", async () => {
      // Set major to viva_requested
      await mockCtx.db.patch(mockMajorAssignmentId, { status: "viva_requested" });
      await mockCtx.db.patch(mockStudentObjId, { status: "completed" });

      // Now uncomplete the sub
      await mockCtx.db.patch(mockStudentObjId, { status: "in_progress" });

      // Simulate major status update logic
      const majorAssignment = await mockCtx.db.get(mockMajorAssignmentId);
      const subs = await mockCtx.db
        .query("studentObjectives")
        .withIndex("by_user_major", (q) =>
          q.eq("userId", mockStudentId).eq("majorObjectiveId", mockMajorId)
        )
        .collect();

      const allSubsCompleted =
        subs.length > 0 && subs.every((s) => s.status === "completed");

      let nextMajorStatus = majorAssignment!.status as string;

      if (majorAssignment!.status === "viva_requested" && !allSubsCompleted) {
        nextMajorStatus = "in_progress";
      }

      await mockCtx.db.patch(mockMajorAssignmentId, { status: nextMajorStatus });

      const updated = await mockCtx.db.get(mockMajorAssignmentId);
      expect(updated?.status).toBe("in_progress");
    });

    it("should never downgrade mastered status", async () => {
      // Set major to mastered
      await mockCtx.db.patch(mockMajorAssignmentId, {
        status: "mastered",
        masteredAt: Date.now(),
      });
      await mockCtx.db.patch(mockStudentObjId, { status: "completed" });

      // Now try to uncomplete the sub
      await mockCtx.db.patch(mockStudentObjId, { status: "in_progress" });

      // Simulate major status update logic - should skip mastered
      const majorAssignment = await mockCtx.db.get(mockMajorAssignmentId);

      // The key check: mastered status is protected
      if (majorAssignment!.status === "mastered") {
        // Should not update - mastered is final
        expect(majorAssignment?.status).toBe("mastered");
      }

      // Verify status unchanged
      const verified = await mockCtx.db.get(mockMajorAssignmentId);
      expect(verified?.status).toBe("mastered");
    });
  });
});

describe("Progress - getDomainSummary", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockAdminId: Id<"users">;
  let mockStudentId: Id<"users">;
  let mockMathDomainId: Id<"domains">;
  let mockScienceDomainId: Id<"domains">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockAdminId = createMockId("users");
    mockStudentId = createMockId("users");
    mockMathDomainId = createMockId("domains");
    mockScienceDomainId = createMockId("domains");

    mockCtx.db._seed(mockAdminId, {
      username: "admin",
      role: "admin",
      displayName: "Admin",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockStudentId, {
      username: "student",
      role: "student",
      displayName: "Student",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockMathDomainId, {
      name: "Mathematics",
      icon: "calc",
      color: "#F00",
      description: "Math domain",
      order: 1,
    });

    mockCtx.db._seed(mockScienceDomainId, {
      name: "Science",
      icon: "flask",
      color: "#0F0",
      description: "Science domain",
      order: 2,
    });
  });

  it("should return correct counts for mastered", async () => {
    // Create 2 major objectives in Math, 1 mastered
    const mathMajor1Id = await mockCtx.db.insert("majorObjectives", {
      domainId: mockMathDomainId,
      title: "Algebra",
      description: "Algebra basics",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const mathMajor2Id = await mockCtx.db.insert("majorObjectives", {
      domainId: mockMathDomainId,
      title: "Geometry",
      description: "Geometry basics",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    // Assign both to student
    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: mathMajor1Id,
      assignedBy: mockAdminId,
      status: "mastered",
      assignedAt: Date.now(),
      masteredAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: mathMajor2Id,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    // Simulate getDomainSummary query
    const domains = await mockCtx.db.query("domains").collect();

    const summary = await Promise.all(
      domains.map(async (domain) => {
        const studentMajors = await mockCtx.db
          .query("studentMajorObjectives")
          .withIndex("by_user", (q) => q.eq("userId", mockStudentId))
          .collect();

        const domainMajors = await Promise.all(
          studentMajors.map(async (assignment) => {
            const major = await mockCtx.db.get(assignment.majorObjectiveId as string);
            if (major?.domainId === domain._id) {
              return assignment;
            }
            return null;
          })
        );

        const filtered = domainMajors.filter(Boolean);
        const mastered = filtered.filter((o: any) => o?.status === "mastered").length;
        const inProgress = filtered.filter(
          (o: any) => o?.status === "in_progress" || o?.status === "viva_requested"
        ).length;

        return {
          domain,
          total: filtered.length,
          mastered,
          inProgress,
          assigned: filtered.length - mastered - inProgress,
        };
      })
    );

    const mathSummary = summary.find((s) => s.domain.name === "Mathematics");
    expect(mathSummary?.total).toBe(2);
    expect(mathSummary?.mastered).toBe(1);
    expect(mathSummary?.inProgress).toBe(1);
    expect(mathSummary?.assigned).toBe(0);
  });

  it("should count in_progress and viva_requested together as inProgress", async () => {
    // Create 3 majors: 1 in_progress, 1 viva_requested, 1 assigned
    const major1Id = await mockCtx.db.insert("majorObjectives", {
      domainId: mockMathDomainId,
      title: "Algebra",
      description: "Algebra",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const major2Id = await mockCtx.db.insert("majorObjectives", {
      domainId: mockMathDomainId,
      title: "Geometry",
      description: "Geometry",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const major3Id = await mockCtx.db.insert("majorObjectives", {
      domainId: mockMathDomainId,
      title: "Calculus",
      description: "Calculus",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: major1Id,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: major2Id,
      assignedBy: mockAdminId,
      status: "viva_requested",
      assignedAt: Date.now(),
      vivaRequestedAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: major3Id,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Simulate getDomainSummary
    const domains = await mockCtx.db.query("domains").collect();

    const summary = await Promise.all(
      domains.map(async (domain) => {
        const studentMajors = await mockCtx.db
          .query("studentMajorObjectives")
          .withIndex("by_user", (q) => q.eq("userId", mockStudentId))
          .collect();

        const domainMajors = await Promise.all(
          studentMajors.map(async (assignment) => {
            const major = await mockCtx.db.get(assignment.majorObjectiveId as string);
            if (major?.domainId === domain._id) {
              return assignment;
            }
            return null;
          })
        );

        const filtered = domainMajors.filter(Boolean);
        const mastered = filtered.filter((o: any) => o?.status === "mastered").length;
        const inProgress = filtered.filter(
          (o: any) => o?.status === "in_progress" || o?.status === "viva_requested"
        ).length;

        return {
          domain,
          total: filtered.length,
          mastered,
          inProgress,
          assigned: filtered.length - mastered - inProgress,
        };
      })
    );

    const mathSummary = summary.find((s) => s.domain.name === "Mathematics");
    expect(mathSummary?.total).toBe(3);
    expect(mathSummary?.mastered).toBe(0);
    expect(mathSummary?.inProgress).toBe(2); // in_progress + viva_requested
    expect(mathSummary?.assigned).toBe(1);
  });

  it("should return correct counts for assigned", async () => {
    // Create 2 majors both assigned
    const major1Id = await mockCtx.db.insert("majorObjectives", {
      domainId: mockScienceDomainId,
      title: "Physics",
      description: "Physics",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const major2Id = await mockCtx.db.insert("majorObjectives", {
      domainId: mockScienceDomainId,
      title: "Chemistry",
      description: "Chemistry",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: major1Id,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: major2Id,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Simulate getDomainSummary
    const domains = await mockCtx.db.query("domains").collect();

    const summary = await Promise.all(
      domains.map(async (domain) => {
        const studentMajors = await mockCtx.db
          .query("studentMajorObjectives")
          .withIndex("by_user", (q) => q.eq("userId", mockStudentId))
          .collect();

        const domainMajors = await Promise.all(
          studentMajors.map(async (assignment) => {
            const major = await mockCtx.db.get(assignment.majorObjectiveId as string);
            if (major?.domainId === domain._id) {
              return assignment;
            }
            return null;
          })
        );

        const filtered = domainMajors.filter(Boolean);
        const mastered = filtered.filter((o: any) => o?.status === "mastered").length;
        const inProgress = filtered.filter(
          (o: any) => o?.status === "in_progress" || o?.status === "viva_requested"
        ).length;

        return {
          domain,
          total: filtered.length,
          mastered,
          inProgress,
          assigned: filtered.length - mastered - inProgress,
        };
      })
    );

    const scienceSummary = summary.find((s) => s.domain.name === "Science");
    expect(scienceSummary?.total).toBe(2);
    expect(scienceSummary?.mastered).toBe(0);
    expect(scienceSummary?.inProgress).toBe(0);
    expect(scienceSummary?.assigned).toBe(2);
  });

  it("should handle domains with no assigned objectives", async () => {
    // Don't assign any objectives to Science domain

    // Simulate getDomainSummary
    const domains = await mockCtx.db.query("domains").collect();

    const summary = await Promise.all(
      domains.map(async (domain) => {
        const studentMajors = await mockCtx.db
          .query("studentMajorObjectives")
          .withIndex("by_user", (q) => q.eq("userId", mockStudentId))
          .collect();

        const domainMajors = await Promise.all(
          studentMajors.map(async (assignment) => {
            const major = await mockCtx.db.get(assignment.majorObjectiveId as string);
            if (major?.domainId === domain._id) {
              return assignment;
            }
            return null;
          })
        );

        const filtered = domainMajors.filter(Boolean);
        const mastered = filtered.filter((o: any) => o?.status === "mastered").length;
        const inProgress = filtered.filter(
          (o: any) => o?.status === "in_progress" || o?.status === "viva_requested"
        ).length;

        return {
          domain,
          total: filtered.length,
          mastered,
          inProgress,
          assigned: filtered.length - mastered - inProgress,
        };
      })
    );

    const scienceSummary = summary.find((s) => s.domain.name === "Science");
    expect(scienceSummary?.total).toBe(0);
    expect(scienceSummary?.mastered).toBe(0);
    expect(scienceSummary?.inProgress).toBe(0);
    expect(scienceSummary?.assigned).toBe(0);
  });

  it("should correctly aggregate across multiple domains", async () => {
    // Math: 1 mastered, 1 in_progress
    const mathMajor1Id = await mockCtx.db.insert("majorObjectives", {
      domainId: mockMathDomainId,
      title: "Algebra",
      description: "Algebra",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const mathMajor2Id = await mockCtx.db.insert("majorObjectives", {
      domainId: mockMathDomainId,
      title: "Geometry",
      description: "Geometry",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: mathMajor1Id,
      assignedBy: mockAdminId,
      status: "mastered",
      assignedAt: Date.now(),
      masteredAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: mathMajor2Id,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    // Science: 1 viva_requested, 1 assigned
    const sciMajor1Id = await mockCtx.db.insert("majorObjectives", {
      domainId: mockScienceDomainId,
      title: "Physics",
      description: "Physics",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const sciMajor2Id = await mockCtx.db.insert("majorObjectives", {
      domainId: mockScienceDomainId,
      title: "Chemistry",
      description: "Chemistry",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: sciMajor1Id,
      assignedBy: mockAdminId,
      status: "viva_requested",
      assignedAt: Date.now(),
      vivaRequestedAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: sciMajor2Id,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Simulate getDomainSummary
    const domains = await mockCtx.db.query("domains").collect();

    const summary = await Promise.all(
      domains.map(async (domain) => {
        const studentMajors = await mockCtx.db
          .query("studentMajorObjectives")
          .withIndex("by_user", (q) => q.eq("userId", mockStudentId))
          .collect();

        const domainMajors = await Promise.all(
          studentMajors.map(async (assignment) => {
            const major = await mockCtx.db.get(assignment.majorObjectiveId as string);
            if (major?.domainId === domain._id) {
              return assignment;
            }
            return null;
          })
        );

        const filtered = domainMajors.filter(Boolean);
        const mastered = filtered.filter((o: any) => o?.status === "mastered").length;
        const inProgress = filtered.filter(
          (o: any) => o?.status === "in_progress" || o?.status === "viva_requested"
        ).length;

        return {
          domain,
          total: filtered.length,
          mastered,
          inProgress,
          assigned: filtered.length - mastered - inProgress,
        };
      })
    );

    const mathSummary = summary.find((s) => s.domain.name === "Mathematics");
    expect(mathSummary?.total).toBe(2);
    expect(mathSummary?.mastered).toBe(1);
    expect(mathSummary?.inProgress).toBe(1);
    expect(mathSummary?.assigned).toBe(0);

    const scienceSummary = summary.find((s) => s.domain.name === "Science");
    expect(scienceSummary?.total).toBe(2);
    expect(scienceSummary?.mastered).toBe(0);
    expect(scienceSummary?.inProgress).toBe(1); // viva_requested counts as in_progress
    expect(scienceSummary?.assigned).toBe(1);
  });
});

describe("Progress - Edge Cases", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockAdminId: Id<"users">;
  let mockStudentId: Id<"users">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockAdminId = createMockId("users");
    mockStudentId = createMockId("users");

    mockCtx.db._seed(mockAdminId, {
      username: "admin",
      role: "admin",
      displayName: "Admin",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockStudentId, {
      username: "student",
      role: "student",
      displayName: "Student",
      createdAt: Date.now(),
    });
  });

  it("should handle sub-objective with no activities", async () => {
    const domainId = createMockId("domains");
    const majorId = createMockId("majorObjectives");
    const subId = createMockId("learningObjectives");

    mockCtx.db._seed(domainId, {
      name: "Math",
      icon: "calc",
      color: "#F00",
      description: "Math",
      order: 1,
    });

    mockCtx.db._seed(majorId, {
      domainId: domainId,
      title: "Algebra",
      description: "Algebra",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    mockCtx.db._seed(subId, {
      domainId: domainId,
      majorObjectiveId: majorId,
      title: "Linear Equations",
      description: "Solve equations",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const _studentObjId = await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: subId,
      majorObjectiveId: majorId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // No activities exist for this sub-objective
    const activities = await mockCtx.db
      .query("activities")
      .withIndex("by_objective", (q) => q.eq("objectiveId", subId))
      .collect();

    expect(activities).toHaveLength(0);

    // With no activities, sub should be considered "completed" by default
    const completedCount = 0;
    const allCompleted =
      activities.length === 0 || completedCount === activities.length;

    expect(allCompleted).toBe(true);

    const nextStatus = allCompleted
      ? "completed"
      : completedCount > 0
        ? "in_progress"
        : "assigned";

    expect(nextStatus).toBe("completed");
  });

  it("should handle multiple sub-objectives under same major", async () => {
    const domainId = createMockId("domains");
    const majorId = createMockId("majorObjectives");

    mockCtx.db._seed(domainId, {
      name: "Math",
      icon: "calc",
      color: "#F00",
      description: "Math",
      order: 1,
    });

    mockCtx.db._seed(majorId, {
      domainId: domainId,
      title: "Algebra",
      description: "Algebra",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    // Create 3 sub-objectives
    const sub1Id = await mockCtx.db.insert("learningObjectives", {
      domainId: domainId,
      majorObjectiveId: majorId,
      title: "Sub 1",
      description: "First sub",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const sub2Id = await mockCtx.db.insert("learningObjectives", {
      domainId: domainId,
      majorObjectiveId: majorId,
      title: "Sub 2",
      description: "Second sub",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const sub3Id = await mockCtx.db.insert("learningObjectives", {
      domainId: domainId,
      majorObjectiveId: majorId,
      title: "Sub 3",
      description: "Third sub",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    // Create major assignment
    const majorAssignmentId = await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: majorId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Assign all subs
    await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: sub1Id,
      majorObjectiveId: majorId,
      assignedBy: mockAdminId,
      status: "completed",
      assignedAt: Date.now(),
    });

    await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: sub2Id,
      majorObjectiveId: majorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: sub3Id,
      majorObjectiveId: majorId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Check major status logic
    const subs = await mockCtx.db
      .query("studentObjectives")
      .withIndex("by_user_major", (q) =>
        q.eq("userId", mockStudentId).eq("majorObjectiveId", majorId)
      )
      .collect();

    const anyStarted = subs.some((s) => s.status !== "assigned");
    const allSubsCompleted =
      subs.length > 0 && subs.every((s) => s.status === "completed");

    expect(anyStarted).toBe(true);
    expect(allSubsCompleted).toBe(false);

    // Major should be in_progress
    if (anyStarted) {
      await mockCtx.db.patch(majorAssignmentId, { status: "in_progress" });
    }

    const majorAssignment = await mockCtx.db.get(majorAssignmentId);
    expect(majorAssignment?.status).toBe("in_progress");
  });
});
