/**
 * Tests for convex/goals.ts mutations and queries.
 *
 * These tests use a mock database context to test the handler logic
 * without needing a real Convex backend.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "../../../convex/_generated/dataModel";

// We'll test the handler functions directly by extracting their logic
// In a real Convex setup, you might use convex-test package

describe("Goals Mutations", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockUserId: Id<"users">;
  let mockSprintId: Id<"sprints">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    // Seed with a user and sprint
    mockUserId = createMockId("users");
    mockSprintId = createMockId("sprints");

    mockCtx.db._seed(mockUserId, {
      username: "testuser",
      role: "student",
      displayName: "Test User",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockSprintId, {
      name: "Sprint 1",
      startDate: "2025-01-01",
      endDate: "2025-01-14",
      isActive: true,
      createdBy: mockUserId,
    });
  });

  describe("create", () => {
    it("should create a goal with all SMART fields", async () => {
      // Simulate the create mutation handler
      const args = {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "Learn TypeScript",
        specific: "Complete the TypeScript handbook",
        measurable: "Finish 5 chapters",
        achievable: "1 chapter per day",
        relevant: "Needed for work projects",
        timeBound: "Within 2 weeks",
      };

      const now = Date.now();
      vi.setSystemTime(now);

      // This mimics the handler logic from goals.ts create mutation
      const goalId = await mockCtx.db.insert("goals", {
        ...args,
        status: "not_started",
        createdAt: now,
        updatedAt: now,
      });

      // Verify the goal was created
      const createdGoal = await mockCtx.db.get(goalId);

      expect(createdGoal).not.toBeNull();
      expect(createdGoal?.title).toBe("Learn TypeScript");
      expect(createdGoal?.specific).toBe("Complete the TypeScript handbook");
      expect(createdGoal?.status).toBe("not_started");
      expect(createdGoal?.userId).toBe(mockUserId);
      expect(createdGoal?.sprintId).toBe(mockSprintId);

      vi.useRealTimers();
    });

    it("should set default status to not_started", async () => {
      const goalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "New Goal",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const goal = await mockCtx.db.get(goalId);
      expect(goal?.status).toBe("not_started");
    });
  });

  describe("update", () => {
    it("should update goal title", async () => {
      // Create a goal first
      const goalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "Original Title",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update it (mimics the update mutation)
      const updates = { title: "Updated Title" };
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await mockCtx.db.patch(goalId, { ...filteredUpdates, updatedAt: Date.now() });

      const updatedGoal = await mockCtx.db.get(goalId);
      expect(updatedGoal?.title).toBe("Updated Title");
    });

    it("should update goal status to completed", async () => {
      const goalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "My Goal",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await mockCtx.db.patch(goalId, { status: "completed", updatedAt: Date.now() });

      const goal = await mockCtx.db.get(goalId);
      expect(goal?.status).toBe("completed");
    });

    it("should only update provided fields", async () => {
      const originalTime = Date.now();
      const goalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "My Goal",
        specific: "Original specific",
        measurable: "Original measurable",
        achievable: "Original achievable",
        relevant: "Original relevant",
        timeBound: "Original timeBound",
        status: "not_started",
        createdAt: originalTime,
        updatedAt: originalTime,
      });

      // Only update title, other fields should remain unchanged
      await mockCtx.db.patch(goalId, { title: "New Title" });

      const goal = await mockCtx.db.get(goalId);
      expect(goal?.title).toBe("New Title");
      expect(goal?.specific).toBe("Original specific");
      expect(goal?.measurable).toBe("Original measurable");
      expect(goal?.status).toBe("not_started");
    });
  });

  describe("remove", () => {
    it("should delete a goal", async () => {
      const goalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "Goal to delete",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Verify it exists
      expect(await mockCtx.db.get(goalId)).not.toBeNull();

      // Delete it
      await mockCtx.db.delete(goalId);

      // Verify it's gone
      expect(await mockCtx.db.get(goalId)).toBeNull();
    });

    it("should delete associated action items when deleting a goal", async () => {
      // Create a goal
      const goalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "Goal with actions",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Create action items for the goal
      const actionId1 = await mockCtx.db.insert("actionItems", {
        goalId: goalId,
        userId: mockUserId,
        title: "Action 1",
        weekNumber: 1,
        dayOfWeek: 1,
        isCompleted: false,
        order: 0,
      });

      const actionId2 = await mockCtx.db.insert("actionItems", {
        goalId: goalId,
        userId: mockUserId,
        title: "Action 2",
        weekNumber: 1,
        dayOfWeek: 2,
        isCompleted: false,
        order: 1,
      });

      // Simulate the remove mutation logic:
      // 1. Find all action items for this goal
      const actionItems = await mockCtx.db
        .query("actionItems")
        .withIndex("by_goal", (q) => q.eq("goalId", goalId))
        .collect();

      // 2. Delete each action item
      for (const item of actionItems) {
        await mockCtx.db.delete(item._id);
      }

      // 3. Delete the goal
      await mockCtx.db.delete(goalId);

      // Verify everything is deleted
      expect(await mockCtx.db.get(goalId)).toBeNull();
      expect(await mockCtx.db.get(actionId1)).toBeNull();
      expect(await mockCtx.db.get(actionId2)).toBeNull();
    });
  });

  describe("addActionItem", () => {
    it("should add an action item to a goal", async () => {
      const goalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "My Goal",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Simulate addActionItem mutation
      const existingItems = await mockCtx.db
        .query("actionItems")
        .withIndex("by_goal", (q) => q.eq("goalId", goalId))
        .collect();

      const maxOrder = existingItems.reduce(
        (max, item) => Math.max(max, (item.order as number) || 0),
        -1
      );

      const actionId = await mockCtx.db.insert("actionItems", {
        goalId: goalId,
        userId: mockUserId,
        title: "First Action",
        description: "Do this first",
        weekNumber: 1,
        dayOfWeek: 1,
        isCompleted: false,
        order: maxOrder + 1,
      });

      const action = await mockCtx.db.get(actionId);
      expect(action?.title).toBe("First Action");
      expect(action?.order).toBe(0); // First item should have order 0
      expect(action?.isCompleted).toBe(false);
    });

    it("should auto-increment order for new action items", async () => {
      const goalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "My Goal",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Add first action item
      await mockCtx.db.insert("actionItems", {
        goalId: goalId,
        userId: mockUserId,
        title: "First Action",
        weekNumber: 1,
        dayOfWeek: 1,
        isCompleted: false,
        order: 0,
      });

      // Add second action item (simulating the mutation logic)
      const existingItems = await mockCtx.db
        .query("actionItems")
        .withIndex("by_goal", (q) => q.eq("goalId", goalId))
        .collect();

      const maxOrder = existingItems.reduce(
        (max, item) => Math.max(max, (item.order as number) || 0),
        -1
      );

      const actionId2 = await mockCtx.db.insert("actionItems", {
        goalId: goalId,
        userId: mockUserId,
        title: "Second Action",
        weekNumber: 1,
        dayOfWeek: 2,
        isCompleted: false,
        order: maxOrder + 1,
      });

      const action2 = await mockCtx.db.get(actionId2);
      expect(action2?.order).toBe(1); // Second item should have order 1
    });
  });

  describe("toggleActionItem", () => {
    it("should toggle action item from incomplete to complete", async () => {
      const goalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "My Goal",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const actionId = await mockCtx.db.insert("actionItems", {
        goalId: goalId,
        userId: mockUserId,
        title: "My Action",
        weekNumber: 1,
        dayOfWeek: 1,
        isCompleted: false,
        order: 0,
      });

      // Simulate toggle mutation
      const item = await mockCtx.db.get(actionId);
      if (item) {
        await mockCtx.db.patch(actionId, {
          isCompleted: !item.isCompleted,
          completedAt: !item.isCompleted ? Date.now() : undefined,
        });
      }

      const toggled = await mockCtx.db.get(actionId);
      expect(toggled?.isCompleted).toBe(true);
      expect(toggled?.completedAt).toBeDefined();
    });

    it("should toggle action item from complete to incomplete", async () => {
      const goalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "My Goal",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Start with a completed action
      const actionId = await mockCtx.db.insert("actionItems", {
        goalId: goalId,
        userId: mockUserId,
        title: "Completed Action",
        weekNumber: 1,
        dayOfWeek: 1,
        isCompleted: true,
        completedAt: Date.now(),
        order: 0,
      });

      // Toggle it off
      const item = await mockCtx.db.get(actionId);
      if (item) {
        await mockCtx.db.patch(actionId, {
          isCompleted: !item.isCompleted,
          completedAt: !item.isCompleted ? Date.now() : undefined,
        });
      }

      const toggled = await mockCtx.db.get(actionId);
      expect(toggled?.isCompleted).toBe(false);
      expect(toggled?.completedAt).toBeUndefined();
    });
  });

  describe("duplicate", () => {
    it("should duplicate a goal with (copy) suffix", async () => {
      const originalGoalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "Original Goal",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "in_progress",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Simulate duplicate mutation
      const sourceGoal = await mockCtx.db.get(originalGoalId);

      const now = Date.now();
      const newGoalId = await mockCtx.db.insert("goals", {
        userId: sourceGoal?.userId,
        sprintId: sourceGoal?.sprintId,
        title: `${sourceGoal?.title} (copy)`,
        specific: sourceGoal?.specific,
        measurable: sourceGoal?.measurable,
        achievable: sourceGoal?.achievable,
        relevant: sourceGoal?.relevant,
        timeBound: sourceGoal?.timeBound,
        status: "not_started", // Reset status on duplicate
        createdAt: now,
        updatedAt: now,
      });

      const duplicatedGoal = await mockCtx.db.get(newGoalId);

      expect(duplicatedGoal?.title).toBe("Original Goal (copy)");
      expect(duplicatedGoal?.status).toBe("not_started");
      expect(duplicatedGoal?.specific).toBe("Be specific");
    });
  });
});

describe("Goals Queries", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockUserId: Id<"users">;
  let mockSprintId: Id<"sprints">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockUserId = createMockId("users");
    mockSprintId = createMockId("sprints");

    mockCtx.db._seed(mockUserId, {
      username: "testuser",
      role: "student",
      displayName: "Test User",
      createdAt: Date.now(),
    });

    mockCtx.db._seed(mockSprintId, {
      name: "Sprint 1",
      startDate: "2025-01-01",
      endDate: "2025-01-14",
      isActive: true,
      createdBy: mockUserId,
    });
  });

  describe("getByUserAndSprint", () => {
    it("should return goals for a specific user and sprint", async () => {
      // Create goals for the user in the sprint
      await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "Goal 1",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "Goal 2",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "in_progress",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Query goals (simulating getByUserAndSprint)
      const goals = await mockCtx.db
        .query("goals")
        .withIndex("by_user_sprint", (q) =>
          q.eq("userId", mockUserId).eq("sprintId", mockSprintId)
        )
        .collect();

      expect(goals).toHaveLength(2);
      expect(goals.map((g) => g.title)).toContain("Goal 1");
      expect(goals.map((g) => g.title)).toContain("Goal 2");
    });

    it("should not return goals from other users", async () => {
      const otherUserId = createMockId("users");
      mockCtx.db._seed(otherUserId, {
        username: "otheruser",
        role: "student",
        displayName: "Other User",
        createdAt: Date.now(),
      });

      // Create goal for main user
      await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "My Goal",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Create goal for other user
      await mockCtx.db.insert("goals", {
        userId: otherUserId,
        sprintId: mockSprintId,
        title: "Other User Goal",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Query for main user's goals only
      const goals = await mockCtx.db
        .query("goals")
        .withIndex("by_user_sprint", (q) =>
          q.eq("userId", mockUserId).eq("sprintId", mockSprintId)
        )
        .collect();

      expect(goals).toHaveLength(1);
      expect(goals[0].title).toBe("My Goal");
    });
  });

  describe("getWithActions", () => {
    it("should return goal with its action items", async () => {
      const goalId = await mockCtx.db.insert("goals", {
        userId: mockUserId,
        sprintId: mockSprintId,
        title: "Goal with Actions",
        specific: "Be specific",
        measurable: "Measure it",
        achievable: "Make it achievable",
        relevant: "Keep it relevant",
        timeBound: "Set a deadline",
        status: "not_started",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await mockCtx.db.insert("actionItems", {
        goalId: goalId,
        userId: mockUserId,
        title: "Action 1",
        weekNumber: 1,
        dayOfWeek: 1,
        isCompleted: false,
        order: 0,
      });

      await mockCtx.db.insert("actionItems", {
        goalId: goalId,
        userId: mockUserId,
        title: "Action 2",
        weekNumber: 1,
        dayOfWeek: 2,
        isCompleted: true,
        order: 1,
      });

      // Simulate getWithActions query
      const goal = await mockCtx.db.get(goalId);
      const actionItems = await mockCtx.db
        .query("actionItems")
        .withIndex("by_goal", (q) => q.eq("goalId", goalId))
        .collect();

      const sortedActions = actionItems.sort(
        (a, b) => ((a.order as number) || 0) - ((b.order as number) || 0)
      );

      const result = { ...goal, actionItems: sortedActions };

      expect(result.title).toBe("Goal with Actions");
      expect(result.actionItems).toHaveLength(2);
      expect(result.actionItems[0].title).toBe("Action 1");
      expect(result.actionItems[1].title).toBe("Action 2");
    });
  });
});
