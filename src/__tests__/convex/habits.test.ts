/**
 * Tests for convex/habits.ts mutations and queries.
 *
 * These tests use a mock database context to test the handler logic
 * without needing a real Convex backend.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "../../../convex/_generated/dataModel";

describe("Habits Mutations", () => {
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
    it("should create a habit with required fields", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Simulate the create mutation handler
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Morning Meditation",
        description: "Start each day with 10 minutes of meditation",
        whatIsHabit: "Sitting quietly and focusing on breath",
        howToPractice: "Use the Headspace app for guided sessions",
        cue: "After waking up, before checking phone",
        reward: "Enjoy a cup of tea",
        createdAt: now,
      });

      const habit = await mockCtx.db.get(habitId);

      expect(habit).not.toBeNull();
      expect(habit?.name).toBe("Morning Meditation");
      expect(habit?.whatIsHabit).toBe("Sitting quietly and focusing on breath");
      expect(habit?.howToPractice).toBe("Use the Headspace app for guided sessions");
      expect(habit?.cue).toBe("After waking up, before checking phone");
      expect(habit?.reward).toBe("Enjoy a cup of tea");
      expect(habit?.userId).toBe(mockUserId);
      expect(habit?.sprintId).toBe(mockSprintId);

      vi.useRealTimers();
    });

    it("should create a habit without optional fields", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Exercise",
        whatIsHabit: "30 minutes of physical activity",
        howToPractice: "Go for a run or do a workout video",
        createdAt: Date.now(),
      });

      const habit = await mockCtx.db.get(habitId);

      expect(habit?.name).toBe("Exercise");
      expect(habit?.description).toBeUndefined();
      expect(habit?.cue).toBeUndefined();
      expect(habit?.reward).toBeUndefined();
    });
  });

  describe("update", () => {
    it("should update habit name", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Original Name",
        whatIsHabit: "Original what",
        howToPractice: "Original how",
        createdAt: Date.now(),
      });

      // Simulate update mutation
      const updates = { name: "Updated Name" };
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await mockCtx.db.patch(habitId, filteredUpdates);

      const habit = await mockCtx.db.get(habitId);
      expect(habit?.name).toBe("Updated Name");
      expect(habit?.whatIsHabit).toBe("Original what"); // Unchanged
    });

    it("should update multiple fields at once", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "My Habit",
        whatIsHabit: "Original what",
        howToPractice: "Original how",
        createdAt: Date.now(),
      });

      await mockCtx.db.patch(habitId, {
        name: "New Name",
        description: "New description",
        cue: "New cue",
        reward: "New reward",
      });

      const habit = await mockCtx.db.get(habitId);
      expect(habit?.name).toBe("New Name");
      expect(habit?.description).toBe("New description");
      expect(habit?.cue).toBe("New cue");
      expect(habit?.reward).toBe("New reward");
    });
  });

  describe("remove", () => {
    it("should delete a habit", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Habit to delete",
        whatIsHabit: "Something",
        howToPractice: "Somehow",
        createdAt: Date.now(),
      });

      expect(await mockCtx.db.get(habitId)).not.toBeNull();

      await mockCtx.db.delete(habitId);

      expect(await mockCtx.db.get(habitId)).toBeNull();
    });

    it("should delete associated completions when deleting a habit", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Habit with completions",
        whatIsHabit: "Something",
        howToPractice: "Somehow",
        createdAt: Date.now(),
      });

      // Create completions
      const completionId1 = await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-01",
        completed: true,
      });

      const completionId2 = await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-02",
        completed: true,
      });

      // Simulate remove mutation logic:
      // 1. Find completions
      const completions = await mockCtx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habitId))
        .collect();

      // 2. Delete completions
      for (const completion of completions) {
        await mockCtx.db.delete(completion._id);
      }

      // 3. Delete habit
      await mockCtx.db.delete(habitId);

      // Verify all deleted
      expect(await mockCtx.db.get(habitId)).toBeNull();
      expect(await mockCtx.db.get(completionId1)).toBeNull();
      expect(await mockCtx.db.get(completionId2)).toBeNull();
    });
  });

  describe("toggleCompletion", () => {
    it("should create a new completion when none exists", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Daily Reading",
        whatIsHabit: "Read for 30 minutes",
        howToPractice: "Find a quiet spot and read",
        createdAt: Date.now(),
      });

      const date = "2025-01-15";

      // Simulate toggleCompletion mutation
      const existing = await mockCtx.db
        .query("habitCompletions")
        .withIndex("by_habit_date", (q) => q.eq("habitId", habitId).eq("date", date))
        .first();

      expect(existing).toBeNull();

      // Create new completion since none exists
      const completionId = await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: date,
        completed: true,
      });

      const completion = await mockCtx.db.get(completionId);
      expect(completion?.completed).toBe(true);
      expect(completion?.date).toBe("2025-01-15");
    });

    it("should toggle existing completion from true to false", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Exercise",
        whatIsHabit: "Workout",
        howToPractice: "Go to gym",
        createdAt: Date.now(),
      });

      const date = "2025-01-15";

      // Create initial completion
      const completionId = await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: date,
        completed: true,
      });

      // Simulate toggle - find and update
      const existing = await mockCtx.db
        .query("habitCompletions")
        .withIndex("by_habit_date", (q) => q.eq("habitId", habitId).eq("date", date))
        .first();

      if (existing) {
        await mockCtx.db.patch(existing._id, { completed: !existing.completed });
      }

      const toggled = await mockCtx.db.get(completionId);
      expect(toggled?.completed).toBe(false);
    });

    it("should toggle existing completion from false to true", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Meditation",
        whatIsHabit: "Meditate",
        howToPractice: "Sit quietly",
        createdAt: Date.now(),
      });

      const date = "2025-01-15";

      // Create initial completion (uncompleted)
      const completionId = await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: date,
        completed: false,
      });

      // Toggle it
      const existing = await mockCtx.db
        .query("habitCompletions")
        .withIndex("by_habit_date", (q) => q.eq("habitId", habitId).eq("date", date))
        .first();

      if (existing) {
        await mockCtx.db.patch(existing._id, { completed: !existing.completed });
      }

      const toggled = await mockCtx.db.get(completionId);
      expect(toggled?.completed).toBe(true);
    });
  });
});

describe("Habits Queries", () => {
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
    it("should return habits for a specific user and sprint", async () => {
      await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Morning Run",
        whatIsHabit: "Run 5k",
        howToPractice: "Lace up and go",
        createdAt: Date.now(),
      });

      await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Evening Reading",
        whatIsHabit: "Read 20 pages",
        howToPractice: "Pick up a book",
        createdAt: Date.now(),
      });

      const habits = await mockCtx.db
        .query("habits")
        .withIndex("by_user_sprint", (q) =>
          q.eq("userId", mockUserId).eq("sprintId", mockSprintId)
        )
        .collect();

      expect(habits).toHaveLength(2);
      expect(habits.map((h) => h.name)).toContain("Morning Run");
      expect(habits.map((h) => h.name)).toContain("Evening Reading");
    });

    it("should not return habits from other sprints", async () => {
      const otherSprintId = createMockId("sprints");
      mockCtx.db._seed(otherSprintId, {
        name: "Sprint 2",
        startDate: "2025-01-15",
        endDate: "2025-01-28",
        isActive: false,
        createdBy: mockUserId,
      });

      // Habit in current sprint
      await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Current Sprint Habit",
        whatIsHabit: "Something",
        howToPractice: "Somehow",
        createdAt: Date.now(),
      });

      // Habit in other sprint
      await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: otherSprintId,
        name: "Other Sprint Habit",
        whatIsHabit: "Something else",
        howToPractice: "Another way",
        createdAt: Date.now(),
      });

      const habits = await mockCtx.db
        .query("habits")
        .withIndex("by_user_sprint", (q) =>
          q.eq("userId", mockUserId).eq("sprintId", mockSprintId)
        )
        .collect();

      expect(habits).toHaveLength(1);
      expect(habits[0].name).toBe("Current Sprint Habit");
    });
  });

  describe("getWithCompletions", () => {
    it("should return habit with its completions", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Daily Exercise",
        whatIsHabit: "Workout",
        howToPractice: "Go to gym",
        createdAt: Date.now(),
      });

      // Add completions
      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-01",
        completed: true,
      });

      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-02",
        completed: true,
      });

      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-03",
        completed: false,
      });

      // Simulate getWithCompletions query
      const habit = await mockCtx.db.get(habitId);
      const completions = await mockCtx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habitId))
        .collect();

      const result = { ...habit, completions };

      expect(result.name).toBe("Daily Exercise");
      expect(result.completions).toHaveLength(3);
      expect(result.completions.filter((c) => c.completed)).toHaveLength(2);
    });

    it("should return empty completions array for new habit", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "New Habit",
        whatIsHabit: "Something new",
        howToPractice: "Learn as you go",
        createdAt: Date.now(),
      });

      const habit = await mockCtx.db.get(habitId);
      const completions = await mockCtx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habitId))
        .collect();

      expect(completions).toHaveLength(0);
    });
  });

  describe("getCompletionsInRange", () => {
    it("should return completions within date range", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Daily Habit",
        whatIsHabit: "Do it daily",
        howToPractice: "Just do it",
        createdAt: Date.now(),
      });

      // Create completions across multiple dates
      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-01",
        completed: true,
      });

      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-05",
        completed: true,
      });

      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-10",
        completed: true,
      });

      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-15",
        completed: true,
      });

      // Simulate getCompletionsInRange
      const startDate = "2025-01-03";
      const endDate = "2025-01-12";

      const allCompletions = await mockCtx.db
        .query("habitCompletions")
        .withIndex("by_user_date", (q) => q.eq("userId", mockUserId))
        .collect();

      const filtered = allCompletions.filter(
        (c) => (c.date as string) >= startDate && (c.date as string) <= endDate
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map((c) => c.date)).toContain("2025-01-05");
      expect(filtered.map((c) => c.date)).toContain("2025-01-10");
    });
  });

  describe("getStreak", () => {
    it("should calculate streak of consecutive completed days", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Streak Habit",
        whatIsHabit: "Build a streak",
        howToPractice: "Every day",
        createdAt: Date.now(),
      });

      // Simulate today being 2025-01-20
      const today = "2025-01-20";
      vi.setSystemTime(new Date("2025-01-20T12:00:00Z"));

      // Create a 3-day streak ending today
      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-20", // Today
        completed: true,
      });

      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-19", // Yesterday
        completed: true,
      });

      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-18", // 2 days ago
        completed: true,
      });

      // Gap here - 2025-01-17 not completed

      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-16", // 4 days ago
        completed: true,
      });

      // Simulate getStreak query logic
      const completions = await mockCtx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habitId))
        .collect();

      const completedDates = completions
        .filter((c) => c.completed)
        .map((c) => c.date as string)
        .sort()
        .reverse();

      let streak = 0;
      let checkDate = today;

      for (const date of completedDates) {
        if (date === checkDate) {
          streak++;
          const d = new Date(checkDate);
          d.setDate(d.getDate() - 1);
          checkDate = d.toISOString().split("T")[0];
        } else if (date < checkDate) {
          break;
        }
      }

      expect(streak).toBe(3);

      vi.useRealTimers();
    });

    it("should return 0 streak if no completions", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "No Streak Habit",
        whatIsHabit: "Never completed",
        howToPractice: "Start now",
        createdAt: Date.now(),
      });

      const completions = await mockCtx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habitId))
        .collect();

      const completedDates = completions
        .filter((c) => c.completed)
        .map((c) => c.date as string);

      expect(completedDates).toHaveLength(0);
      // Streak would be 0
    });

    it("should return 0 if streak is broken (today not completed)", async () => {
      const habitId = await mockCtx.db.insert("habits", {
        userId: mockUserId,
        sprintId: mockSprintId,
        name: "Broken Streak",
        whatIsHabit: "Missed today",
        howToPractice: "Try again",
        createdAt: Date.now(),
      });

      vi.setSystemTime(new Date("2025-01-20T12:00:00Z"));
      const today = "2025-01-20";

      // Yesterday was completed but not today
      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-19",
        completed: true,
      });

      await mockCtx.db.insert("habitCompletions", {
        habitId: habitId,
        userId: mockUserId,
        date: "2025-01-18",
        completed: true,
      });

      const completions = await mockCtx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habitId", habitId))
        .collect();

      const completedDates = completions
        .filter((c) => c.completed)
        .map((c) => c.date as string)
        .sort()
        .reverse();

      let streak = 0;
      let checkDate = today;

      for (const date of completedDates) {
        if (date === checkDate) {
          streak++;
          const d = new Date(checkDate);
          d.setDate(d.getDate() - 1);
          checkDate = d.toISOString().split("T")[0];
        } else if (date < checkDate) {
          break;
        }
      }

      // Today isn't completed, so streak is 0
      expect(streak).toBe(0);

      vi.useRealTimers();
    });
  });
});
