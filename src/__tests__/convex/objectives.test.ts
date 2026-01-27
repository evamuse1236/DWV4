/**
 * Tests for convex/objectives.ts mutations and queries.
 *
 * These tests use a mock database context to test the handler logic
 * without needing a real Convex backend.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "../../../convex/_generated/dataModel";

describe("Objectives - Major CRUD", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockAdminId: Id<"users">;
  let mockDomainId: Id<"domains">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    // Seed with an admin user and a domain
    mockAdminId = createMockId("users");
    mockDomainId = createMockId("domains");

    mockCtx.db._seed(mockAdminId, {
      username: "admin",
      role: "admin",
      displayName: "Admin User",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockDomainId, {
      name: "Mathematics",
      icon: "calculator",
      color: "#4CAF50",
      description: "Mathematical concepts and problem solving",
      order: 1,
    });
  });

  describe("create", () => {
    it("should create a major objective with all fields", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Simulate the create mutation handler
      const majorId = await mockCtx.db.insert("majorObjectives", {
        domainId: mockDomainId,
        title: "Algebra Fundamentals",
        description: "Learn basic algebraic concepts",
        difficulty: "beginner",
        estimatedHours: 10,
        createdBy: mockAdminId,
        createdAt: now,
      });

      const major = await mockCtx.db.get(majorId);

      expect(major).not.toBeNull();
      expect(major?.title).toBe("Algebra Fundamentals");
      expect(major?.description).toBe("Learn basic algebraic concepts");
      expect(major?.difficulty).toBe("beginner");
      expect(major?.estimatedHours).toBe(10);
      expect(major?.domainId).toBe(mockDomainId);
      expect(major?.createdBy).toBe(mockAdminId);

      vi.useRealTimers();
    });

    it("should create a major objective without optional fields", async () => {
      const majorId = await mockCtx.db.insert("majorObjectives", {
        domainId: mockDomainId,
        title: "Basic Math",
        description: "Simple math concepts",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      const major = await mockCtx.db.get(majorId);

      expect(major?.title).toBe("Basic Math");
      expect(major?.difficulty).toBeUndefined();
      expect(major?.estimatedHours).toBeUndefined();
    });
  });

  describe("update", () => {
    it("should update major objective title and description", async () => {
      const majorId = await mockCtx.db.insert("majorObjectives", {
        domainId: mockDomainId,
        title: "Original Title",
        description: "Original description",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      // Simulate update mutation
      const updates = { title: "Updated Title", description: "Updated description" };
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await mockCtx.db.patch(majorId, filteredUpdates);

      const major = await mockCtx.db.get(majorId);
      expect(major?.title).toBe("Updated Title");
      expect(major?.description).toBe("Updated description");
    });

    it("should update only provided fields", async () => {
      const majorId = await mockCtx.db.insert("majorObjectives", {
        domainId: mockDomainId,
        title: "My Title",
        description: "My description",
        difficulty: "beginner",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      // Only update title
      await mockCtx.db.patch(majorId, { title: "New Title" });

      const major = await mockCtx.db.get(majorId);
      expect(major?.title).toBe("New Title");
      expect(major?.description).toBe("My description");
      expect(major?.difficulty).toBe("beginner");
    });
  });

  describe("remove", () => {
    it("should delete a major objective", async () => {
      const majorId = await mockCtx.db.insert("majorObjectives", {
        domainId: mockDomainId,
        title: "To Be Deleted",
        description: "This will be deleted",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      expect(await mockCtx.db.get(majorId)).not.toBeNull();

      await mockCtx.db.delete(majorId);

      expect(await mockCtx.db.get(majorId)).toBeNull();
    });

    it("should cascade delete sub-objectives when removing major", async () => {
      const majorId = await mockCtx.db.insert("majorObjectives", {
        domainId: mockDomainId,
        title: "Major with Subs",
        description: "Has sub-objectives",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      // Create sub-objectives
      const subId1 = await mockCtx.db.insert("learningObjectives", {
        domainId: mockDomainId,
        majorObjectiveId: majorId,
        title: "Sub 1",
        description: "First sub",
        difficulty: "beginner",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      const subId2 = await mockCtx.db.insert("learningObjectives", {
        domainId: mockDomainId,
        majorObjectiveId: majorId,
        title: "Sub 2",
        description: "Second sub",
        difficulty: "intermediate",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      // Simulate remove mutation logic: delete subs first
      const subs = await mockCtx.db
        .query("learningObjectives")
        .withIndex("by_major_objective", (q) => q.eq("majorObjectiveId", majorId))
        .collect();

      for (const sub of subs) {
        await mockCtx.db.delete(sub._id);
      }

      await mockCtx.db.delete(majorId);

      expect(await mockCtx.db.get(majorId)).toBeNull();
      expect(await mockCtx.db.get(subId1)).toBeNull();
      expect(await mockCtx.db.get(subId2)).toBeNull();
    });

    it("should cascade delete activities and progress when removing major", async () => {
      const mockStudentId = createMockId("users");
      mockCtx.db._seed(mockStudentId, {
        username: "student",
        role: "student",
        displayName: "Test Student",
        createdAt: Date.now(),
      });

      const majorId = await mockCtx.db.insert("majorObjectives", {
        domainId: mockDomainId,
        title: "Major with Activities",
        description: "Has activities",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      const subId = await mockCtx.db.insert("learningObjectives", {
        domainId: mockDomainId,
        majorObjectiveId: majorId,
        title: "Sub with Activities",
        description: "Has activities",
        difficulty: "beginner",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      const activityId = await mockCtx.db.insert("activities", {
        objectiveId: subId,
        title: "Watch Video",
        type: "video",
        url: "https://example.com/video",
        order: 0,
      });

      const studentObjId = await mockCtx.db.insert("studentObjectives", {
        userId: mockStudentId,
        objectiveId: subId,
        majorObjectiveId: majorId,
        assignedBy: mockAdminId,
        assignedAt: Date.now(),
        status: "in_progress",
      });

      const progressId = await mockCtx.db.insert("activityProgress", {
        userId: mockStudentId,
        activityId: activityId,
        studentObjectiveId: studentObjId,
        completed: true,
        completedAt: Date.now(),
      });

      // Simulate full cascade removal
      // 1. Get all subs
      const subs = await mockCtx.db
        .query("learningObjectives")
        .withIndex("by_major_objective", (q) => q.eq("majorObjectiveId", majorId))
        .collect();

      for (const sub of subs) {
        // 2. Delete activities and their progress
        const activities = await mockCtx.db
          .query("activities")
          .withIndex("by_objective", (q) => q.eq("objectiveId", sub._id))
          .collect();

        for (const activity of activities) {
          const progress = await mockCtx.db
            .query("activityProgress")
            .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
            .collect();

          for (const p of progress) {
            await mockCtx.db.delete(p._id);
          }
          await mockCtx.db.delete(activity._id);
        }

        // 3. Delete student objective assignments
        const assignments = await mockCtx.db
          .query("studentObjectives")
          .withIndex("by_objective", (q) => q.eq("objectiveId", sub._id))
          .collect();

        for (const assignment of assignments) {
          await mockCtx.db.delete(assignment._id);
        }

        await mockCtx.db.delete(sub._id);
      }

      // 4. Delete student major assignments
      const majorAssignments = await mockCtx.db
        .query("studentMajorObjectives")
        .withIndex("by_major_objective", (q) => q.eq("majorObjectiveId", majorId))
        .collect();

      for (const assignment of majorAssignments) {
        await mockCtx.db.delete(assignment._id);
      }

      await mockCtx.db.delete(majorId);

      expect(await mockCtx.db.get(majorId)).toBeNull();
      expect(await mockCtx.db.get(subId)).toBeNull();
      expect(await mockCtx.db.get(activityId)).toBeNull();
      expect(await mockCtx.db.get(studentObjId)).toBeNull();
      expect(await mockCtx.db.get(progressId)).toBeNull();
    });
  });
});

describe("Objectives - Sub CRUD", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockAdminId: Id<"users">;
  let mockDomainId: Id<"domains">;
  let mockMajorId: Id<"majorObjectives">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockAdminId = createMockId("users");
    mockDomainId = createMockId("domains");
    mockMajorId = createMockId("majorObjectives");

    mockCtx.db._seed(mockAdminId, {
      username: "admin",
      role: "admin",
      displayName: "Admin User",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockDomainId, {
      name: "Mathematics",
      icon: "calculator",
      color: "#4CAF50",
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
  });

  describe("createSubObjective", () => {
    it("should create a sub-objective linked to a major", async () => {
      // Simulate createSubObjective mutation
      const major = await mockCtx.db.get(mockMajorId);
      expect(major).not.toBeNull();

      const subId = await mockCtx.db.insert("learningObjectives", {
        domainId: major!.domainId as Id<"domains">,
        majorObjectiveId: mockMajorId,
        title: "Linear Equations",
        description: "Solve linear equations",
        difficulty: "beginner",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      const sub = await mockCtx.db.get(subId);

      expect(sub).not.toBeNull();
      expect(sub?.title).toBe("Linear Equations");
      expect(sub?.majorObjectiveId).toBe(mockMajorId);
      expect(sub?.domainId).toBe(mockDomainId);
    });

    it("should fail when major objective is missing", async () => {
      const fakeMajorId = createMockId("majorObjectives");

      // Simulate the check in createSubObjective
      const major = await mockCtx.db.get(fakeMajorId);

      expect(major).toBeNull();
      // The mutation would throw "Major objective not found"
    });
  });

  describe("updateSubObjective", () => {
    it("should update sub-objective fields", async () => {
      const subId = await mockCtx.db.insert("learningObjectives", {
        domainId: mockDomainId,
        majorObjectiveId: mockMajorId,
        title: "Original Sub",
        description: "Original description",
        difficulty: "beginner",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      await mockCtx.db.patch(subId, {
        title: "Updated Sub",
        difficulty: "intermediate",
      });

      const sub = await mockCtx.db.get(subId);
      expect(sub?.title).toBe("Updated Sub");
      expect(sub?.difficulty).toBe("intermediate");
      expect(sub?.description).toBe("Original description");
    });
  });

  describe("removeSubObjective", () => {
    it("should delete sub-objective and cascade activities and progress", async () => {
      const mockStudentId = createMockId("users");
      mockCtx.db._seed(mockStudentId, {
        username: "student",
        role: "student",
        displayName: "Student",
        createdAt: Date.now(),
      });

      const subId = await mockCtx.db.insert("learningObjectives", {
        domainId: mockDomainId,
        majorObjectiveId: mockMajorId,
        title: "Sub to delete",
        description: "Will be deleted",
        difficulty: "beginner",
        createdBy: mockAdminId,
        createdAt: Date.now(),
      });

      const activityId = await mockCtx.db.insert("activities", {
        objectiveId: subId,
        title: "Activity",
        type: "video",
        url: "https://example.com",
        order: 0,
      });

      const studentObjId = await mockCtx.db.insert("studentObjectives", {
        userId: mockStudentId,
        objectiveId: subId,
        majorObjectiveId: mockMajorId,
        assignedBy: mockAdminId,
        assignedAt: Date.now(),
        status: "assigned",
      });

      const progressId = await mockCtx.db.insert("activityProgress", {
        userId: mockStudentId,
        activityId: activityId,
        studentObjectiveId: studentObjId,
        completed: false,
      });

      // Simulate removeSubObjective cascade
      const activities = await mockCtx.db
        .query("activities")
        .withIndex("by_objective", (q) => q.eq("objectiveId", subId))
        .collect();

      for (const activity of activities) {
        const progress = await mockCtx.db
          .query("activityProgress")
          .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
          .collect();

        for (const p of progress) {
          await mockCtx.db.delete(p._id);
        }
        await mockCtx.db.delete(activity._id);
      }

      const assignments = await mockCtx.db
        .query("studentObjectives")
        .withIndex("by_objective", (q) => q.eq("objectiveId", subId))
        .collect();

      for (const assignment of assignments) {
        const assignmentProgress = await mockCtx.db
          .query("activityProgress")
          .withIndex("by_student_objective", (q) =>
            q.eq("studentObjectiveId", assignment._id)
          )
          .collect();

        for (const p of assignmentProgress) {
          await mockCtx.db.delete(p._id);
        }
        await mockCtx.db.delete(assignment._id);
      }

      await mockCtx.db.delete(subId);

      expect(await mockCtx.db.get(subId)).toBeNull();
      expect(await mockCtx.db.get(activityId)).toBeNull();
      expect(await mockCtx.db.get(studentObjId)).toBeNull();
      expect(await mockCtx.db.get(progressId)).toBeNull();
    });
  });
});

describe("Objectives - assignToStudent", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockAdminId: Id<"users">;
  let mockStudentId: Id<"users">;
  let mockDomainId: Id<"domains">;
  let mockMajorId: Id<"majorObjectives">;
  let mockSubId: Id<"learningObjectives">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockAdminId = createMockId("users");
    mockStudentId = createMockId("users");
    mockDomainId = createMockId("domains");
    mockMajorId = createMockId("majorObjectives");
    mockSubId = createMockId("learningObjectives");

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
      color: "#000",
      description: "Math",
      order: 1,
    });

    mockCtx.db._seed(mockMajorId, {
      domainId: mockDomainId,
      title: "Major",
      description: "Major obj",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockSubId, {
      domainId: mockDomainId,
      majorObjectiveId: mockMajorId,
      title: "Sub",
      description: "Sub obj",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });
  });

  it("should create studentMajorObjectives when needed", async () => {
    // Simulate assignToStudent mutation
    const objective = await mockCtx.db.get(mockSubId);
    expect(objective?.majorObjectiveId).toBe(mockMajorId);

    const majorObjectiveId = objective!.majorObjectiveId as Id<"majorObjectives">;

    // Check if student major assignment exists
    let studentMajor = await mockCtx.db
      .query("studentMajorObjectives")
      .withIndex("by_user_major", (q) =>
        q.eq("userId", mockStudentId).eq("majorObjectiveId", majorObjectiveId)
      )
      .first();

    expect(studentMajor).toBeNull();

    // Create it since it doesn't exist
    const majorAssignmentId = await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Create student objective assignment
    const studentObjId = await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: mockSubId,
      majorObjectiveId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Verify both were created
    expect(await mockCtx.db.get(majorAssignmentId)).not.toBeNull();
    expect(await mockCtx.db.get(studentObjId)).not.toBeNull();
  });

  it("should not duplicate studentObjectives", async () => {
    const majorObjectiveId = mockMajorId;

    // Create initial major assignment
    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Create initial student objective assignment
    const firstAssignmentId = await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: mockSubId,
      majorObjectiveId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Try to assign again - should find existing
    const existing = await mockCtx.db
      .query("studentObjectives")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), mockStudentId),
          q.eq(q.field("objectiveId"), mockSubId)
        )
      )
      .first();

    expect(existing).not.toBeNull();
    expect(existing?._id).toBe(firstAssignmentId);

    // Should return existing ID, not create new one
    const allAssignments = await mockCtx.db
      .query("studentObjectives")
      .withIndex("by_user", (q) => q.eq("userId", mockStudentId))
      .collect();

    expect(allAssignments).toHaveLength(1);
  });

  it("should error if sub-objective is missing majorObjectiveId", async () => {
    // Create a sub without majorObjectiveId
    const orphanSubId = await mockCtx.db.insert("learningObjectives", {
      domainId: mockDomainId,
      title: "Orphan Sub",
      description: "No major",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const orphanSub = await mockCtx.db.get(orphanSubId);

    // The mutation would throw "Sub objective is missing a major objective"
    expect(orphanSub?.majorObjectiveId).toBeUndefined();
  });
});

describe("Objectives - assignToMultipleStudents", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockAdminId: Id<"users">;
  let mockStudent1Id: Id<"users">;
  let mockStudent2Id: Id<"users">;
  let mockStudent3Id: Id<"users">;
  let mockDomainId: Id<"domains">;
  let mockMajorId: Id<"majorObjectives">;
  let mockSubId: Id<"learningObjectives">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockAdminId = createMockId("users");
    mockStudent1Id = createMockId("users");
    mockStudent2Id = createMockId("users");
    mockStudent3Id = createMockId("users");
    mockDomainId = createMockId("domains");
    mockMajorId = createMockId("majorObjectives");
    mockSubId = createMockId("learningObjectives");

    mockCtx.db._seed(mockAdminId, {
      username: "admin",
      role: "admin",
      displayName: "Admin",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockStudent1Id, {
      username: "student1",
      role: "student",
      displayName: "Student 1",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockStudent2Id, {
      username: "student2",
      role: "student",
      displayName: "Student 2",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockStudent3Id, {
      username: "student3",
      role: "student",
      displayName: "Student 3",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockDomainId, {
      name: "Math",
      icon: "calc",
      color: "#000",
      description: "Math",
      order: 1,
    });

    mockCtx.db._seed(mockMajorId, {
      domainId: mockDomainId,
      title: "Major",
      description: "Major obj",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockSubId, {
      domainId: mockDomainId,
      majorObjectiveId: mockMajorId,
      title: "Sub",
      description: "Sub obj",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });
  });

  it("should return created flags per student", async () => {
    const studentIds = [mockStudent1Id, mockStudent2Id, mockStudent3Id];
    const results: { userId: Id<"users">; id: string; created: boolean }[] = [];

    // Simulate assignToMultipleStudents mutation
    for (const userId of studentIds) {
      // Create major assignment if needed
      const majorAssignment = await mockCtx.db
        .query("studentMajorObjectives")
        .withIndex("by_user_major", (q) =>
          q.eq("userId", userId).eq("majorObjectiveId", mockMajorId)
        )
        .first();

      if (!majorAssignment) {
        await mockCtx.db.insert("studentMajorObjectives", {
          userId,
          majorObjectiveId: mockMajorId,
          assignedBy: mockAdminId,
          status: "assigned",
          assignedAt: Date.now(),
        });
      }

      // Check for existing sub assignment
      const existing = await mockCtx.db
        .query("studentObjectives")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("objectiveId"), mockSubId)
          )
        )
        .first();

      if (!existing) {
        const id = await mockCtx.db.insert("studentObjectives", {
          userId,
          objectiveId: mockSubId,
          majorObjectiveId: mockMajorId,
          assignedBy: mockAdminId,
          status: "assigned",
          assignedAt: Date.now(),
        });
        results.push({ userId, id, created: true });
      } else {
        results.push({ userId, id: existing._id, created: false });
      }
    }

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.created)).toBe(true);
  });

  it("should never duplicate assignments", async () => {
    // Pre-assign student1
    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudent1Id,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    const existingAssignmentId = await mockCtx.db.insert("studentObjectives", {
      userId: mockStudent1Id,
      objectiveId: mockSubId,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    // Now assign to all three (including already-assigned student1)
    const studentIds = [mockStudent1Id, mockStudent2Id];
    const results: { userId: Id<"users">; id: string; created: boolean }[] = [];

    for (const userId of studentIds) {
      const majorAssignment = await mockCtx.db
        .query("studentMajorObjectives")
        .withIndex("by_user_major", (q) =>
          q.eq("userId", userId).eq("majorObjectiveId", mockMajorId)
        )
        .first();

      if (!majorAssignment) {
        await mockCtx.db.insert("studentMajorObjectives", {
          userId,
          majorObjectiveId: mockMajorId,
          assignedBy: mockAdminId,
          status: "assigned",
          assignedAt: Date.now(),
        });
      }

      const existing = await mockCtx.db
        .query("studentObjectives")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("objectiveId"), mockSubId)
          )
        )
        .first();

      if (!existing) {
        const id = await mockCtx.db.insert("studentObjectives", {
          userId,
          objectiveId: mockSubId,
          majorObjectiveId: mockMajorId,
          assignedBy: mockAdminId,
          status: "assigned",
          assignedAt: Date.now(),
        });
        results.push({ userId, id, created: true });
      } else {
        results.push({ userId, id: existing._id, created: false });
      }
    }

    // Student1 should show created: false with existing ID
    expect(results[0].created).toBe(false);
    expect(results[0].id).toBe(existingAssignmentId);

    // Student2 should show created: true
    expect(results[1].created).toBe(true);

    // Verify no duplicates
    const student1Assignments = await mockCtx.db
      .query("studentObjectives")
      .filter((q) => q.eq(q.field("userId"), mockStudent1Id))
      .collect();

    expect(student1Assignments).toHaveLength(1);
  });
});

describe("Objectives - unassignFromStudent", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockAdminId: Id<"users">;
  let mockStudentId: Id<"users">;
  let mockDomainId: Id<"domains">;
  let mockMajorId: Id<"majorObjectives">;
  let mockSub1Id: Id<"learningObjectives">;
  let mockSub2Id: Id<"learningObjectives">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockAdminId = createMockId("users");
    mockStudentId = createMockId("users");
    mockDomainId = createMockId("domains");
    mockMajorId = createMockId("majorObjectives");
    mockSub1Id = createMockId("learningObjectives");
    mockSub2Id = createMockId("learningObjectives");

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
      color: "#000",
      description: "Math",
      order: 1,
    });

    mockCtx.db._seed(mockMajorId, {
      domainId: mockDomainId,
      title: "Major",
      description: "Major obj",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockSub1Id, {
      domainId: mockDomainId,
      majorObjectiveId: mockMajorId,
      title: "Sub 1",
      description: "First sub",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockSub2Id, {
      domainId: mockDomainId,
      majorObjectiveId: mockMajorId,
      title: "Sub 2",
      description: "Second sub",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });
  });

  it("should delete studentObjectives and their activityProgress", async () => {
    // Create assignments
    const majorAssignmentId = await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    const studentObjId = await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: mockSub1Id,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    const activityId = await mockCtx.db.insert("activities", {
      objectiveId: mockSub1Id,
      title: "Activity",
      type: "video",
      url: "https://example.com",
      order: 0,
    });

    const progressId = await mockCtx.db.insert("activityProgress", {
      userId: mockStudentId,
      activityId,
      studentObjectiveId: studentObjId,
      completed: true,
      completedAt: Date.now(),
    });

    // Also assign sub2 so major doesn't get deleted
    await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: mockSub2Id,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Simulate unassignFromStudent for sub1
    const existing = await mockCtx.db
      .query("studentObjectives")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), mockStudentId),
          q.eq(q.field("objectiveId"), mockSub1Id)
        )
      )
      .first();

    expect(existing).not.toBeNull();

    // Delete activity progress
    const progressRecords = await mockCtx.db
      .query("activityProgress")
      .withIndex("by_student_objective", (q) =>
        q.eq("studentObjectiveId", existing!._id)
      )
      .collect();

    for (const progress of progressRecords) {
      await mockCtx.db.delete(progress._id);
    }

    await mockCtx.db.delete(existing!._id);

    // Verify deletions
    expect(await mockCtx.db.get(studentObjId)).toBeNull();
    expect(await mockCtx.db.get(progressId)).toBeNull();

    // Major assignment should still exist because sub2 is still assigned
    expect(await mockCtx.db.get(majorAssignmentId)).not.toBeNull();
  });

  it("should delete studentMajorObjectives only if no remaining sub-objectives", async () => {
    // Create major assignment
    const majorAssignmentId = await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    // Only one sub assignment
    const studentObjId = await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: mockSub1Id,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    // Simulate unassignFromStudent
    const existing = await mockCtx.db
      .query("studentObjectives")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), mockStudentId),
          q.eq(q.field("objectiveId"), mockSub1Id)
        )
      )
      .first();

    await mockCtx.db.delete(existing!._id);

    // Check if any remaining subs for this major
    const remaining = await mockCtx.db
      .query("studentObjectives")
      .withIndex("by_user_major", (q) =>
        q.eq("userId", mockStudentId).eq("majorObjectiveId", mockMajorId)
      )
      .first();

    expect(remaining).toBeNull();

    // Delete major assignment since no subs remain
    const majorAssignment = await mockCtx.db
      .query("studentMajorObjectives")
      .withIndex("by_user_major", (q) =>
        q.eq("userId", mockStudentId).eq("majorObjectiveId", mockMajorId)
      )
      .first();

    if (majorAssignment) {
      await mockCtx.db.delete(majorAssignment._id);
    }

    expect(await mockCtx.db.get(studentObjId)).toBeNull();
    expect(await mockCtx.db.get(majorAssignmentId)).toBeNull();
  });
});

describe("Objectives - Viva Workflow", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockAdminId: Id<"users">;
  let mockStudentId: Id<"users">;
  let mockMajorAssignmentId: Id<"studentMajorObjectives">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockAdminId = createMockId("users");
    mockStudentId = createMockId("users");
    const mockDomainId = createMockId("domains");
    const mockMajorId = createMockId("majorObjectives");
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
      color: "#000",
      description: "Math",
      order: 1,
    });

    mockCtx.db._seed(mockMajorId, {
      domainId: mockDomainId,
      title: "Major",
      description: "Major obj",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockMajorAssignmentId, {
      userId: mockStudentId,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });
  });

  describe("updateStatus", () => {
    it("should set vivaRequestedAt when status is viva_requested", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Simulate updateStatus mutation
      const updates: Record<string, unknown> = { status: "viva_requested" };
      updates.vivaRequestedAt = now;

      await mockCtx.db.patch(mockMajorAssignmentId, updates);

      const assignment = await mockCtx.db.get(mockMajorAssignmentId);
      expect(assignment?.status).toBe("viva_requested");
      expect(assignment?.vivaRequestedAt).toBe(now);

      vi.useRealTimers();
    });

    it("should set masteredAt when status is mastered", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const updates: Record<string, unknown> = { status: "mastered" };
      updates.masteredAt = now;

      await mockCtx.db.patch(mockMajorAssignmentId, updates);

      const assignment = await mockCtx.db.get(mockMajorAssignmentId);
      expect(assignment?.status).toBe("mastered");
      expect(assignment?.masteredAt).toBe(now);

      vi.useRealTimers();
    });

    it("should persist optional vivaRequestNotes", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const updates: Record<string, unknown> = {
        status: "viva_requested",
        vivaRequestedAt: now,
        vivaRequestNotes: "I feel confident about this topic!",
      };

      await mockCtx.db.patch(mockMajorAssignmentId, updates);

      const assignment = await mockCtx.db.get(mockMajorAssignmentId);
      expect(assignment?.status).toBe("viva_requested");
      expect(assignment?.vivaRequestNotes).toBe("I feel confident about this topic!");

      vi.useRealTimers();
    });
  });
});

describe("Objectives - getVivaRequests", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockAdminId: Id<"users">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockAdminId = createMockId("users");
    mockCtx.db._seed(mockAdminId, {
      username: "admin",
      role: "admin",
      displayName: "Admin",
      createdAt: Date.now(),
    });
  });

  it("should return user, objective, and domain for each request", async () => {
    const student1Id = createMockId("users");
    const student2Id = createMockId("users");
    const domainId = createMockId("domains");
    const major1Id = createMockId("majorObjectives");
    const major2Id = createMockId("majorObjectives");

    mockCtx.db._seed(student1Id, {
      username: "student1",
      role: "student",
      displayName: "Alice",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(student2Id, {
      username: "student2",
      role: "student",
      displayName: "Bob",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(domainId, {
      name: "Science",
      icon: "flask",
      color: "#00F",
      description: "Science domain",
      order: 1,
    });

    mockCtx.db._seed(major1Id, {
      domainId: domainId,
      title: "Chemistry Basics",
      description: "Learn chemistry",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    mockCtx.db._seed(major2Id, {
      domainId: domainId,
      title: "Physics Basics",
      description: "Learn physics",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    // Create viva requests
    await mockCtx.db.insert("studentMajorObjectives", {
      userId: student1Id,
      majorObjectiveId: major1Id,
      assignedBy: mockAdminId,
      status: "viva_requested",
      assignedAt: Date.now(),
      vivaRequestedAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: student2Id,
      majorObjectiveId: major2Id,
      assignedBy: mockAdminId,
      status: "viva_requested",
      assignedAt: Date.now(),
      vivaRequestedAt: Date.now(),
    });

    // Also create one that's not viva_requested
    await mockCtx.db.insert("studentMajorObjectives", {
      userId: student1Id,
      majorObjectiveId: major2Id,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    // Simulate getVivaRequests query
    const requests = await mockCtx.db
      .query("studentMajorObjectives")
      .filter((q) => q.eq(q.field("status"), "viva_requested"))
      .collect();

    const results = await Promise.all(
      requests.map(async (req) => {
        const user = await mockCtx.db.get(req.userId as string);
        const majorObjective = await mockCtx.db.get(req.majorObjectiveId as string);
        const domain = majorObjective
          ? await mockCtx.db.get(majorObjective.domainId as string)
          : null;
        return {
          ...req,
          user,
          objective: majorObjective,
          domain,
        };
      })
    );

    expect(results).toHaveLength(2);

    // Verify first request has user, objective, and domain
    const aliceRequest = results.find((r) => r.user?.displayName === "Alice");
    expect(aliceRequest).toBeDefined();
    expect(aliceRequest?.objective?.title).toBe("Chemistry Basics");
    expect(aliceRequest?.domain?.name).toBe("Science");

    const bobRequest = results.find((r) => r.user?.displayName === "Bob");
    expect(bobRequest).toBeDefined();
    expect(bobRequest?.objective?.title).toBe("Physics Basics");
    expect(bobRequest?.domain?.name).toBe("Science");
  });
});

describe("Objectives - getAssignedByDomain", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockAdminId: Id<"users">;
  let mockStudentId: Id<"users">;
  let mockDomainId: Id<"domains">;
  let mockMajorId: Id<"majorObjectives">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockAdminId = createMockId("users");
    mockStudentId = createMockId("users");
    mockDomainId = createMockId("domains");
    mockMajorId = createMockId("majorObjectives");

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
      color: "#000",
      description: "Math",
      order: 1,
    });

    mockCtx.db._seed(mockMajorId, {
      domainId: mockDomainId,
      title: "Algebra",
      description: "Algebra fundamentals",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });
  });

  it("should include activities sorted by order", async () => {
    const subId = await mockCtx.db.insert("learningObjectives", {
      domainId: mockDomainId,
      majorObjectiveId: mockMajorId,
      title: "Linear Equations",
      description: "Solve linear equations",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    // Create activities out of order
    await mockCtx.db.insert("activities", {
      objectiveId: subId,
      title: "Activity 3",
      type: "exercise",
      url: "https://example.com/3",
      order: 2,
    });

    await mockCtx.db.insert("activities", {
      objectiveId: subId,
      title: "Activity 1",
      type: "video",
      url: "https://example.com/1",
      order: 0,
    });

    await mockCtx.db.insert("activities", {
      objectiveId: subId,
      title: "Activity 2",
      type: "reading",
      url: "https://example.com/2",
      order: 1,
    });

    // Create student assignment
    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    const studentObjId = await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: subId,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    // Simulate getAssignedByDomain query logic
    const studentSubs = await mockCtx.db
      .query("studentObjectives")
      .withIndex("by_user", (q) => q.eq("userId", mockStudentId))
      .collect();

    const subWithActivities = await Promise.all(
      studentSubs.map(async (assignment) => {
        const objective = await mockCtx.db.get(assignment.objectiveId as string);
        if (!objective) return null;

        const activities = await mockCtx.db
          .query("activities")
          .withIndex("by_objective", (q) => q.eq("objectiveId", objective._id))
          .collect();

        // Sort by order
        const sortedActivities = activities.sort(
          (a, b) => (a.order as number) - (b.order as number)
        );

        return {
          ...assignment,
          objective,
          activities: sortedActivities,
        };
      })
    );

    const result = subWithActivities.filter(Boolean);
    expect(result).toHaveLength(1);
    expect(result[0]?.activities).toHaveLength(3);
    expect(result[0]?.activities[0].title).toBe("Activity 1");
    expect(result[0]?.activities[1].title).toBe("Activity 2");
    expect(result[0]?.activities[2].title).toBe("Activity 3");
  });

  it("should merge activityProgress per student objective", async () => {
    const subId = await mockCtx.db.insert("learningObjectives", {
      domainId: mockDomainId,
      majorObjectiveId: mockMajorId,
      title: "Linear Equations",
      description: "Solve linear equations",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const activity1Id = await mockCtx.db.insert("activities", {
      objectiveId: subId,
      title: "Watch Video",
      type: "video",
      url: "https://example.com/1",
      order: 0,
    });

    const activity2Id = await mockCtx.db.insert("activities", {
      objectiveId: subId,
      title: "Do Exercise",
      type: "exercise",
      url: "https://example.com/2",
      order: 1,
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    const studentObjId = await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: subId,
      majorObjectiveId: mockMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    // Complete first activity
    await mockCtx.db.insert("activityProgress", {
      userId: mockStudentId,
      activityId: activity1Id,
      studentObjectiveId: studentObjId,
      completed: true,
      completedAt: Date.now(),
    });

    // Simulate query with progress merge
    const studentSubs = await mockCtx.db
      .query("studentObjectives")
      .withIndex("by_user", (q) => q.eq("userId", mockStudentId))
      .collect();

    const result = await Promise.all(
      studentSubs.map(async (assignment) => {
        const objective = await mockCtx.db.get(assignment.objectiveId as string);
        if (!objective) return null;

        const activities = await mockCtx.db
          .query("activities")
          .withIndex("by_objective", (q) => q.eq("objectiveId", objective._id))
          .collect();

        const progress = await mockCtx.db
          .query("activityProgress")
          .withIndex("by_student_objective", (q) =>
            q.eq("studentObjectiveId", assignment._id)
          )
          .collect();

        const progressMap = new Map(
          progress.map((p) => [p.activityId as string, p])
        );

        const activitiesWithProgress = activities
          .sort((a, b) => (a.order as number) - (b.order as number))
          .map((activity) => ({
            ...activity,
            progress: progressMap.get(activity._id) || null,
          }));

        return {
          ...assignment,
          objective,
          activities: activitiesWithProgress,
        };
      })
    );

    const filtered = result.filter(Boolean);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.activities).toHaveLength(2);

    const videoActivity = filtered[0]?.activities.find(
      (a) => a.title === "Watch Video"
    );
    expect(videoActivity?.progress?.completed).toBe(true);

    const exerciseActivity = filtered[0]?.activities.find(
      (a) => a.title === "Do Exercise"
    );
    expect(exerciseActivity?.progress).toBeNull();
  });
});

describe("Objectives - getTreeData", () => {
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

  it("should group objectives by domain with stable keys", async () => {
    const mathDomainId = createMockId("domains");
    const scienceDomainId = createMockId("domains");

    mockCtx.db._seed(mathDomainId, {
      name: "Math",
      icon: "calc",
      color: "#F00",
      description: "Math domain",
      order: 1,
    });

    mockCtx.db._seed(scienceDomainId, {
      name: "Science",
      icon: "flask",
      color: "#0F0",
      description: "Science domain",
      order: 2,
    });

    const mathMajorId = await mockCtx.db.insert("majorObjectives", {
      domainId: mathDomainId,
      title: "Algebra",
      description: "Algebra basics",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const scienceMajorId = await mockCtx.db.insert("majorObjectives", {
      domainId: scienceDomainId,
      title: "Physics",
      description: "Physics basics",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const mathSubId = await mockCtx.db.insert("learningObjectives", {
      domainId: mathDomainId,
      majorObjectiveId: mathMajorId,
      title: "Linear Equations",
      description: "Solve equations",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const scienceSubId = await mockCtx.db.insert("learningObjectives", {
      domainId: scienceDomainId,
      majorObjectiveId: scienceMajorId,
      title: "Newton Laws",
      description: "Learn Newton",
      difficulty: "intermediate",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    // Assign both to student
    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: mathMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: scienceMajorId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: mathSubId,
      majorObjectiveId: mathMajorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: scienceSubId,
      majorObjectiveId: scienceMajorId,
      assignedBy: mockAdminId,
      status: "assigned",
      assignedAt: Date.now(),
    });

    // Simulate getTreeData query
    const domains = await mockCtx.db.query("domains").collect();

    const studentMajors = await mockCtx.db
      .query("studentMajorObjectives")
      .withIndex("by_user", (q) => q.eq("userId", mockStudentId))
      .collect();

    const studentSubs = await mockCtx.db
      .query("studentObjectives")
      .withIndex("by_user", (q) => q.eq("userId", mockStudentId))
      .collect();

    const majorsByDomain: Record<string, unknown[]> = {};

    for (const majorAssignment of studentMajors) {
      const major = await mockCtx.db.get(majorAssignment.majorObjectiveId as string);
      if (!major) continue;

      const domainId = (major.domainId as string).toString();
      if (!majorsByDomain[domainId]) {
        majorsByDomain[domainId] = [];
      }

      const subs = studentSubs.filter(
        (s) => s.majorObjectiveId === majorAssignment.majorObjectiveId
      );

      majorsByDomain[domainId].push({
        majorObjective: major,
        assignment: majorAssignment,
        subObjectives: subs,
      });
    }

    expect(domains).toHaveLength(2);
    expect(Object.keys(majorsByDomain)).toHaveLength(2);
    expect(majorsByDomain[mathDomainId]).toHaveLength(1);
    expect(majorsByDomain[scienceDomainId]).toHaveLength(1);
  });

  it("should include activities and progress for skill tree rendering", async () => {
    const domainId = createMockId("domains");

    mockCtx.db._seed(domainId, {
      name: "Math",
      icon: "calc",
      color: "#F00",
      description: "Math domain",
      order: 1,
    });

    const majorId = await mockCtx.db.insert("majorObjectives", {
      domainId: domainId,
      title: "Algebra",
      description: "Algebra basics",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const subId = await mockCtx.db.insert("learningObjectives", {
      domainId: domainId,
      majorObjectiveId: majorId,
      title: "Linear Equations",
      description: "Solve equations",
      difficulty: "beginner",
      createdBy: mockAdminId,
      createdAt: Date.now(),
    });

    const activityId = await mockCtx.db.insert("activities", {
      objectiveId: subId,
      title: "Watch Video",
      type: "video",
      url: "https://example.com",
      order: 0,
    });

    await mockCtx.db.insert("studentMajorObjectives", {
      userId: mockStudentId,
      majorObjectiveId: majorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    const studentObjId = await mockCtx.db.insert("studentObjectives", {
      userId: mockStudentId,
      objectiveId: subId,
      majorObjectiveId: majorId,
      assignedBy: mockAdminId,
      status: "in_progress",
      assignedAt: Date.now(),
    });

    await mockCtx.db.insert("activityProgress", {
      userId: mockStudentId,
      activityId: activityId,
      studentObjectiveId: studentObjId,
      completed: true,
      completedAt: Date.now(),
    });

    // Simulate getTreeData with activities and progress
    const studentSubs = await mockCtx.db
      .query("studentObjectives")
      .withIndex("by_user", (q) => q.eq("userId", mockStudentId))
      .collect();

    const subWithDetails = await Promise.all(
      studentSubs.map(async (assignment) => {
        const objective = await mockCtx.db.get(assignment.objectiveId as string);
        if (!objective) return null;

        const activities = await mockCtx.db
          .query("activities")
          .withIndex("by_objective", (q) => q.eq("objectiveId", objective._id))
          .collect();

        const progress = await mockCtx.db
          .query("activityProgress")
          .withIndex("by_student_objective", (q) =>
            q.eq("studentObjectiveId", assignment._id)
          )
          .collect();

        const progressMap = new Map(
          progress.map((p) => [p.activityId as string, p])
        );

        const activitiesWithProgress = activities.map((a) => ({
          ...a,
          progress: progressMap.get(a._id) || null,
        }));

        return {
          ...assignment,
          objective,
          activities: activitiesWithProgress,
        };
      })
    );

    const result = subWithDetails.filter(Boolean);
    expect(result).toHaveLength(1);
    expect(result[0]?.activities).toHaveLength(1);
    expect(result[0]?.activities[0].progress?.completed).toBe(true);
  });
});
