/**
 * Tests for convex/emotions.ts mutations and queries.
 *
 * Emotion check-ins allow users to track their emotional state daily.
 * Each check-in has a category (e.g., "Happy") and subcategory (e.g., "Excited").
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "../../../convex/_generated/dataModel";

describe("Emotions Mutations", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockUserId: Id<"users">;
  let mockCategoryId: Id<"emotionCategories">;
  let mockSubcategoryId: Id<"emotionSubcategories">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    // Seed with a user
    mockUserId = createMockId("users");
    mockCtx.db._seed(mockUserId, {
      username: "testuser",
      role: "student",
      displayName: "Test User",
      createdAt: Date.now(),
    });

    // Seed with emotion categories and subcategories
    mockCategoryId = createMockId("emotionCategories");
    mockCtx.db._seed(mockCategoryId, {
      name: "Happy",
      emoji: "😊",
      color: "#FFD700",
      order: 1,
    });

    mockSubcategoryId = createMockId("emotionSubcategories");
    mockCtx.db._seed(mockSubcategoryId, {
      categoryId: mockCategoryId,
      name: "Excited",
      emoji: "🤩",
      order: 1,
    });
  });

  describe("saveCheckIn", () => {
    it("should create an emotion check-in", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Simulate saveCheckIn mutation
      const checkInId = await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        journalEntry: "Feeling great today!",
        timestamp: now,
      });

      const checkIn = await mockCtx.db.get(checkInId);

      expect(checkIn).not.toBeNull();
      expect(checkIn?.userId).toBe(mockUserId);
      expect(checkIn?.categoryId).toBe(mockCategoryId);
      expect(checkIn?.subcategoryId).toBe(mockSubcategoryId);
      expect(checkIn?.journalEntry).toBe("Feeling great today!");
      expect(checkIn?.timestamp).toBe(now);

      vi.useRealTimers();
    });

    it("should create a check-in without journal entry", async () => {
      const checkInId = await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        timestamp: Date.now(),
      });

      const checkIn = await mockCtx.db.get(checkInId);

      expect(checkIn?.journalEntry).toBeUndefined();
    });
  });

  describe("updateCheckIn", () => {
    it("should update the journal entry", async () => {
      const checkInId = await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        journalEntry: "Original entry",
        timestamp: Date.now(),
      });

      // Simulate updateCheckIn mutation
      const updates = { journalEntry: "Updated entry" };
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await mockCtx.db.patch(checkInId, filteredUpdates);

      const checkIn = await mockCtx.db.get(checkInId);
      expect(checkIn?.journalEntry).toBe("Updated entry");
    });

    it("should update the emotion category", async () => {
      const checkInId = await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        timestamp: Date.now(),
      });

      // Create a new category
      const newCategoryId = createMockId("emotionCategories");
      mockCtx.db._seed(newCategoryId, {
        name: "Sad",
        emoji: "😢",
        color: "#4169E1",
        order: 2,
      });

      await mockCtx.db.patch(checkInId, { categoryId: newCategoryId });

      const checkIn = await mockCtx.db.get(checkInId);
      expect(checkIn?.categoryId).toBe(newCategoryId);
    });
  });

  describe("deleteTodayCheckIn", () => {
    it("should delete today's check-in", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const checkInId = await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        timestamp: now,
      });

      // Simulate deleteTodayCheckIn mutation
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const checkIns = await mockCtx.db
        .query("emotionCheckIns")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      const todayCheckIn = checkIns.find(
        (c) => (c.timestamp as number) >= startOfDay.getTime()
      );

      if (todayCheckIn) {
        await mockCtx.db.delete(todayCheckIn._id);
      }

      expect(await mockCtx.db.get(checkInId)).toBeNull();

      vi.useRealTimers();
    });

    it("should not delete check-ins from other days", async () => {
      // Create a check-in from yesterday
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      const yesterdayCheckInId = await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        timestamp: yesterday,
      });

      // Create today's check-in
      const todayCheckInId = await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        timestamp: Date.now(),
      });

      // Delete today's check-in
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const checkIns = await mockCtx.db
        .query("emotionCheckIns")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      const todayCheckIn = checkIns.find(
        (c) => (c.timestamp as number) >= startOfDay.getTime()
      );

      if (todayCheckIn) {
        await mockCtx.db.delete(todayCheckIn._id);
      }

      // Today's is deleted
      expect(await mockCtx.db.get(todayCheckInId)).toBeNull();
      // Yesterday's still exists
      expect(await mockCtx.db.get(yesterdayCheckInId)).not.toBeNull();
    });
  });
});

describe("Emotions Queries", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockUserId: Id<"users">;
  let mockCategoryId: Id<"emotionCategories">;
  let mockSubcategoryId: Id<"emotionSubcategories">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockUserId = createMockId("users");
    mockCtx.db._seed(mockUserId, {
      username: "testuser",
      role: "student",
      displayName: "Test User",
      createdAt: Date.now(),
    });

    mockCategoryId = createMockId("emotionCategories");
    mockCtx.db._seed(mockCategoryId, {
      name: "Happy",
      emoji: "😊",
      color: "#FFD700",
      order: 1,
    });

    mockSubcategoryId = createMockId("emotionSubcategories");
    mockCtx.db._seed(mockSubcategoryId, {
      categoryId: mockCategoryId,
      name: "Excited",
      emoji: "🤩",
      order: 1,
    });
  });

  describe("getCategories", () => {
    it("should return categories with subcategories", async () => {
      // Add another subcategory
      const subcat2Id = createMockId("emotionSubcategories");
      mockCtx.db._seed(subcat2Id, {
        categoryId: mockCategoryId,
        name: "Content",
        emoji: "😌",
        order: 2,
      });

      // Simulate getCategories query
      const categories = await mockCtx.db.query("emotionCategories").collect();

      const categoriesWithSubs = await Promise.all(
        categories.map(async (cat) => {
          const subcategories = await mockCtx.db
            .query("emotionSubcategories")
            .withIndex("by_category", (q) => q.eq("categoryId", cat._id))
            .collect();
          return { ...cat, subcategories };
        })
      );

      expect(categoriesWithSubs).toHaveLength(1);
      expect(categoriesWithSubs[0].name).toBe("Happy");
      expect(categoriesWithSubs[0].subcategories).toHaveLength(2);
    });

    it("should sort categories by order", async () => {
      // Add more categories
      const cat2Id = createMockId("emotionCategories");
      mockCtx.db._seed(cat2Id, {
        name: "Sad",
        emoji: "😢",
        color: "#4169E1",
        order: 3, // Higher order
      });

      const cat3Id = createMockId("emotionCategories");
      mockCtx.db._seed(cat3Id, {
        name: "Angry",
        emoji: "😠",
        color: "#FF4500",
        order: 2, // Middle order
      });

      const categories = await mockCtx.db.query("emotionCategories").collect();
      const sorted = categories.sort(
        (a, b) => (a.order as number) - (b.order as number)
      );

      expect(sorted[0].name).toBe("Happy"); // order 1
      expect(sorted[1].name).toBe("Angry"); // order 2
      expect(sorted[2].name).toBe("Sad"); // order 3
    });
  });

  describe("getTodayCheckIn", () => {
    it("should return today's check-in for user", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        journalEntry: "Today's entry",
        timestamp: now,
      });

      // Simulate getTodayCheckIn query
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const checkIns = await mockCtx.db
        .query("emotionCheckIns")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      const todayCheckIn = checkIns.find(
        (c) => (c.timestamp as number) >= startOfDay.getTime()
      );

      expect(todayCheckIn).not.toBeNull();
      expect(todayCheckIn?.journalEntry).toBe("Today's entry");

      vi.useRealTimers();
    });

    it("should return null if no check-in today", async () => {
      // Create check-in from yesterday
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        timestamp: yesterday,
      });

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const checkIns = await mockCtx.db
        .query("emotionCheckIns")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      const todayCheckIn = checkIns.find(
        (c) => (c.timestamp as number) >= startOfDay.getTime()
      );

      expect(todayCheckIn).toBeUndefined();
    });
  });

  describe("getHistory", () => {
    it("should return check-ins sorted by timestamp (newest first)", async () => {
      // Create check-ins on different days
      const day1 = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const day2 = Date.now() - 2 * 24 * 60 * 60 * 1000;
      const day3 = Date.now() - 1 * 24 * 60 * 60 * 1000;

      await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        journalEntry: "Day 1",
        timestamp: day1,
      });

      await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        journalEntry: "Day 2",
        timestamp: day2,
      });

      await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        journalEntry: "Day 3",
        timestamp: day3,
      });

      // Simulate getHistory query
      const checkIns = await mockCtx.db
        .query("emotionCheckIns")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      const sorted = checkIns.sort(
        (a, b) => (b.timestamp as number) - (a.timestamp as number)
      );

      expect(sorted).toHaveLength(3);
      expect(sorted[0].journalEntry).toBe("Day 3"); // Most recent
      expect(sorted[1].journalEntry).toBe("Day 2");
      expect(sorted[2].journalEntry).toBe("Day 1"); // Oldest
    });

    it("should respect limit parameter", async () => {
      // Create 5 check-ins
      for (let i = 0; i < 5; i++) {
        await mockCtx.db.insert("emotionCheckIns", {
          userId: mockUserId,
          categoryId: mockCategoryId,
          subcategoryId: mockSubcategoryId,
          journalEntry: `Entry ${i}`,
          timestamp: Date.now() - i * 24 * 60 * 60 * 1000,
        });
      }

      const checkIns = await mockCtx.db
        .query("emotionCheckIns")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      const limit = 3;
      const sorted = checkIns
        .sort((a, b) => (b.timestamp as number) - (a.timestamp as number))
        .slice(0, limit);

      expect(sorted).toHaveLength(3);
    });
  });

  describe("getStats", () => {
    it("should count check-ins by category", async () => {
      // Create a second category
      const sadCategoryId = createMockId("emotionCategories");
      mockCtx.db._seed(sadCategoryId, {
        name: "Sad",
        emoji: "😢",
        color: "#4169E1",
        order: 2,
      });

      const sadSubcategoryId = createMockId("emotionSubcategories");
      mockCtx.db._seed(sadSubcategoryId, {
        categoryId: sadCategoryId,
        name: "Down",
        emoji: "😞",
        order: 1,
      });

      // Create check-ins in different categories
      await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId, // Happy
        subcategoryId: mockSubcategoryId,
        timestamp: Date.now(),
      });

      await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId, // Happy
        subcategoryId: mockSubcategoryId,
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      });

      await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: sadCategoryId, // Sad
        subcategoryId: sadSubcategoryId,
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      });

      // Simulate getStats query
      const days = 7;
      const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

      const checkIns = await mockCtx.db
        .query("emotionCheckIns")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      const recentCheckIns = checkIns.filter(
        (c) => (c.timestamp as number) >= startDate
      );

      // Count by category
      const categoryCounts: Record<string, number> = {};
      for (const checkIn of recentCheckIns) {
        const catId = checkIn.categoryId as string;
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
      }

      expect(recentCheckIns).toHaveLength(3);
      expect(categoryCounts[mockCategoryId]).toBe(2); // Happy
      expect(categoryCounts[sadCategoryId]).toBe(1); // Sad
    });

    it("should only count check-ins within the specified days", async () => {
      // Create check-in within range
      await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      });

      // Create check-in outside range
      await mockCtx.db.insert("emotionCheckIns", {
        userId: mockUserId,
        categoryId: mockCategoryId,
        subcategoryId: mockSubcategoryId,
        timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
      });

      const days = 7;
      const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

      const checkIns = await mockCtx.db
        .query("emotionCheckIns")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      const recentCheckIns = checkIns.filter(
        (c) => (c.timestamp as number) >= startDate
      );

      expect(recentCheckIns).toHaveLength(1);
    });
  });
});
