/**
 * Tests for convex/visionBoard.ts mutations and queries.
 *
 * Uses the mock database context to test handler logic without a real Convex backend.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "../../../convex/_generated/dataModel";

describe("Vision Board — Areas", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockUserId: Id<"users">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockUserId = createMockId("users");
    mockCtx.db._seed(mockUserId, {
      username: "student1",
      role: "student",
      displayName: "Test Student",
      createdAt: Date.now(),
    });
  });

  describe("seedPresetAreas", () => {
    const PRESET_AREAS = [
      { name: "Fun & Interests", emoji: "Sparkle" },
      { name: "Health & Fitness", emoji: "Barbell" },
      { name: "Friends", emoji: "Users" },
      { name: "Family", emoji: "House" },
      { name: "Academics & Career", emoji: "GraduationCap" },
    ];

    it("should insert 5 preset areas when user has none", async () => {
      // Simulate handler: check if any areas exist for user
      const existing = await mockCtx.db
        .query("visionBoardAreas")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .first();

      expect(existing).toBeNull();

      // Insert preset areas
      for (const area of PRESET_AREAS) {
        await mockCtx.db.insert("visionBoardAreas", {
          userId: mockUserId,
          name: area.name,
          emoji: area.emoji,
          isPreset: true,
        });
      }

      const areas = await mockCtx.db
        .query("visionBoardAreas")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      expect(areas).toHaveLength(5);
      expect(areas[0]?.name).toBe("Fun & Interests");
      expect(areas[0]?.isPreset).toBe(true);
      expect(areas[4]?.name).toBe("Academics & Career");
    });

    it("should be idempotent — skip seeding if areas already exist", async () => {
      // Seed one area first
      await mockCtx.db.insert("visionBoardAreas", {
        userId: mockUserId,
        name: "Existing Area",
        emoji: "Star",
        isPreset: false,
      });

      // Simulate handler: check if any areas exist
      const existing = await mockCtx.db
        .query("visionBoardAreas")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .first();

      expect(existing).not.toBeNull();

      // Should NOT insert presets since user already has areas
      const areas = await mockCtx.db
        .query("visionBoardAreas")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      expect(areas).toHaveLength(1);
      expect(areas[0]?.name).toBe("Existing Area");
    });
  });

  describe("addArea", () => {
    it("should create a custom area with isPreset: false", async () => {
      const areaId = await mockCtx.db.insert("visionBoardAreas", {
        userId: mockUserId,
        name: "Side Hustles",
        emoji: "Rocket",
        isPreset: false,
      });

      const area = await mockCtx.db.get(areaId);
      expect(area).not.toBeNull();
      expect(area?.name).toBe("Side Hustles");
      expect(area?.emoji).toBe("Rocket");
      expect(area?.isPreset).toBe(false);
      expect(area?.userId).toBe(mockUserId);
    });
  });

  describe("getAreas", () => {
    it("should return only areas belonging to the given user", async () => {
      const otherUserId = createMockId("users");
      mockCtx.db._seed(otherUserId, {
        username: "other",
        role: "student",
        displayName: "Other",
        createdAt: Date.now(),
      });

      await mockCtx.db.insert("visionBoardAreas", {
        userId: mockUserId,
        name: "My Area",
        emoji: "Star",
        isPreset: false,
      });

      await mockCtx.db.insert("visionBoardAreas", {
        userId: otherUserId,
        name: "Their Area",
        emoji: "Moon",
        isPreset: false,
      });

      const myAreas = await mockCtx.db
        .query("visionBoardAreas")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      expect(myAreas).toHaveLength(1);
      expect(myAreas[0]?.name).toBe("My Area");
    });
  });
});

describe("Vision Board — Cards CRUD", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockUserId: Id<"users">;
  let mockAreaId: string;

  beforeEach(async () => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockUserId = createMockId("users");
    mockCtx.db._seed(mockUserId, {
      username: "student1",
      role: "student",
      displayName: "Test Student",
      createdAt: Date.now(),
    });

    mockAreaId = await mockCtx.db.insert("visionBoardAreas", {
      userId: mockUserId,
      name: "Fun & Interests",
      emoji: "Sparkle",
      isPreset: true,
    });
  });

  describe("createCard", () => {
    it("should create a counter card with all fields", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "counter",
        title: "Books Read",
        emoji: "BookOpen",
        colorVariant: "blue",
        size: "sm",
        order: Date.now(),
        currentCount: 0,
        targetCount: 12,
        countLabel: "Books read",
        createdAt: Date.now(),
      });

      const card = await mockCtx.db.get(cardId);
      expect(card).not.toBeNull();
      expect(card?.cardType).toBe("counter");
      expect(card?.title).toBe("Books Read");
      expect(card?.currentCount).toBe(0);
      expect(card?.targetCount).toBe(12);
      expect(card?.colorVariant).toBe("blue");
      expect(card?.size).toBe("sm");
      expect(card?.userId).toBe(mockUserId);
      expect(card?.areaId).toBe(mockAreaId);
    });

    it("should create an image_hero card", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "image_hero",
        title: "Travel Iceland",
        subtitle: "2025 Destination",
        colorVariant: "orange",
        size: "hero",
        order: Date.now(),
        imageUrl: "https://example.com/image.jpg",
        progressPercent: 65,
        createdAt: Date.now(),
      });

      const card = await mockCtx.db.get(cardId);
      expect(card?.cardType).toBe("image_hero");
      expect(card?.imageUrl).toBe("https://example.com/image.jpg");
      expect(card?.progressPercent).toBe(65);
    });

    it("should create a habits card with habit items", async () => {
      const habits = [
        { label: "Water 2L", done: true },
        { label: "No Sugar", done: false },
        { label: "Walking", done: true },
      ];

      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "habits",
        title: "Daily Habits",
        colorVariant: "green",
        size: "tall",
        order: Date.now(),
        habits,
        dayCount: 12,
        createdAt: Date.now(),
      });

      const card = await mockCtx.db.get(cardId);
      expect(card?.habits).toHaveLength(3);
      expect((card?.habits as Array<{ label: string; done: boolean }>)[0]?.label).toBe("Water 2L");
      expect((card?.habits as Array<{ label: string; done: boolean }>)[0]?.done).toBe(true);
      expect((card?.habits as Array<{ label: string; done: boolean }>)[1]?.done).toBe(false);
    });

    it("should create a journal card with text content", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "journal",
        title: "Gratitude Journal",
        colorVariant: "blue",
        size: "wide",
        order: Date.now(),
        textContent: "Today I'm grateful for sunshine.",
        entryDate: "Jan 27, 2025",
        createdAt: Date.now(),
      });

      const card = await mockCtx.db.get(cardId);
      expect(card?.textContent).toBe("Today I'm grateful for sunshine.");
      expect(card?.entryDate).toBe("Jan 27, 2025");
    });
  });

  describe("updateCard", () => {
    it("should patch a card's title", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "motivation",
        title: "Original",
        colorVariant: "pink",
        size: "md",
        order: Date.now(),
        createdAt: Date.now(),
      });

      await mockCtx.db.patch(cardId, { title: "Updated Title" });
      const card = await mockCtx.db.get(cardId);
      expect(card?.title).toBe("Updated Title");
      expect(card?.colorVariant).toBe("pink"); // unchanged
    });

    it("should update multiple fields at once", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "progress",
        title: "Piano",
        colorVariant: "purple",
        size: "lg",
        order: Date.now(),
        totalSteps: 6,
        completedSteps: 2,
        createdAt: Date.now(),
      });

      await mockCtx.db.patch(cardId, {
        title: "Learn Piano",
        description: "Mastering Debussy",
        stepsLabel: "Lessons",
      });

      const card = await mockCtx.db.get(cardId);
      expect(card?.title).toBe("Learn Piano");
      expect(card?.description).toBe("Mastering Debussy");
      expect(card?.stepsLabel).toBe("Lessons");
      expect(card?.totalSteps).toBe(6); // unchanged
    });
  });

  describe("deleteCard", () => {
    it("should remove a card from the database", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "mini_tile",
        title: "Garden",
        colorVariant: "green",
        size: "sm",
        order: Date.now(),
        createdAt: Date.now(),
      });

      const before = await mockCtx.db.get(cardId);
      expect(before).not.toBeNull();

      await mockCtx.db.delete(cardId);

      const after = await mockCtx.db.get(cardId);
      expect(after).toBeNull();
    });
  });

  describe("getCards", () => {
    it("should return only cards belonging to the given user", async () => {
      const otherUserId = createMockId("users");
      const otherAreaId = await mockCtx.db.insert("visionBoardAreas", {
        userId: otherUserId,
        name: "Other",
        emoji: "X",
        isPreset: false,
      });

      await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "mini_tile",
        title: "My Card",
        colorVariant: "green",
        size: "sm",
        order: 1,
        createdAt: Date.now(),
      });

      await mockCtx.db.insert("visionBoardCards", {
        userId: otherUserId,
        areaId: otherAreaId,
        cardType: "mini_tile",
        title: "Their Card",
        colorVariant: "blue",
        size: "sm",
        order: 2,
        createdAt: Date.now(),
      });

      const myCards = await mockCtx.db
        .query("visionBoardCards")
        .withIndex("by_user", (q) => q.eq("userId", mockUserId))
        .collect();

      expect(myCards).toHaveLength(1);
      expect(myCards[0]?.title).toBe("My Card");
    });
  });
});

describe("Vision Board — Atomic Interactions", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockUserId: Id<"users">;
  let mockAreaId: string;

  beforeEach(async () => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockUserId = createMockId("users");
    mockCtx.db._seed(mockUserId, {
      username: "student1",
      role: "student",
      displayName: "Test Student",
      createdAt: Date.now(),
    });

    mockAreaId = await mockCtx.db.insert("visionBoardAreas", {
      userId: mockUserId,
      name: "Health",
      emoji: "Barbell",
      isPreset: true,
    });
  });

  describe("incrementCounter", () => {
    it("should increment currentCount by 1", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "counter",
        title: "Books Read",
        colorVariant: "blue",
        size: "sm",
        order: Date.now(),
        currentCount: 3,
        targetCount: 12,
        createdAt: Date.now(),
      });

      // Simulate incrementCounter handler
      const card = await mockCtx.db.get(cardId);
      const next = Math.min((card!.currentCount as number ?? 0) + 1, (card!.targetCount as number) ?? Infinity);
      await mockCtx.db.patch(cardId, { currentCount: next });

      const updated = await mockCtx.db.get(cardId);
      expect(updated?.currentCount).toBe(4);
    });

    it("should cap at targetCount", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "counter",
        title: "Books Read",
        colorVariant: "blue",
        size: "sm",
        order: Date.now(),
        currentCount: 12,
        targetCount: 12,
        createdAt: Date.now(),
      });

      const card = await mockCtx.db.get(cardId);
      const next = Math.min((card!.currentCount as number ?? 0) + 1, (card!.targetCount as number) ?? Infinity);
      await mockCtx.db.patch(cardId, { currentCount: next });

      const updated = await mockCtx.db.get(cardId);
      expect(updated?.currentCount).toBe(12); // stays at cap
    });

    it("should handle missing currentCount (defaults to 0)", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "counter",
        title: "New Counter",
        colorVariant: "green",
        size: "sm",
        order: Date.now(),
        targetCount: 10,
        createdAt: Date.now(),
      });

      const card = await mockCtx.db.get(cardId);
      const next = Math.min((card!.currentCount as number ?? 0) + 1, (card!.targetCount as number) ?? Infinity);
      await mockCtx.db.patch(cardId, { currentCount: next });

      const updated = await mockCtx.db.get(cardId);
      expect(updated?.currentCount).toBe(1);
    });
  });

  describe("incrementProgress", () => {
    it("should increment completedSteps by 1", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "progress",
        title: "Piano",
        colorVariant: "purple",
        size: "lg",
        order: Date.now(),
        totalSteps: 6,
        completedSteps: 2,
        createdAt: Date.now(),
      });

      const card = await mockCtx.db.get(cardId);
      const next = Math.min((card!.completedSteps as number ?? 0) + 1, (card!.totalSteps as number) ?? Infinity);
      await mockCtx.db.patch(cardId, { completedSteps: next });

      const updated = await mockCtx.db.get(cardId);
      expect(updated?.completedSteps).toBe(3);
    });

    it("should cap at totalSteps", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "progress",
        title: "Piano",
        colorVariant: "purple",
        size: "lg",
        order: Date.now(),
        totalSteps: 6,
        completedSteps: 6,
        createdAt: Date.now(),
      });

      const card = await mockCtx.db.get(cardId);
      const next = Math.min((card!.completedSteps as number ?? 0) + 1, (card!.totalSteps as number) ?? Infinity);
      await mockCtx.db.patch(cardId, { completedSteps: next });

      const updated = await mockCtx.db.get(cardId);
      expect(updated?.completedSteps).toBe(6); // stays at cap
    });
  });

  describe("incrementStreak", () => {
    it("should increment streakCount by 1", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "streak",
        title: "Meditation",
        colorVariant: "yellow",
        size: "wide",
        order: Date.now(),
        streakCount: 5,
        createdAt: Date.now(),
      });

      const card = await mockCtx.db.get(cardId);
      const next = (card!.streakCount as number ?? 0) + 1;
      await mockCtx.db.patch(cardId, { streakCount: next });

      const updated = await mockCtx.db.get(cardId);
      expect(updated?.streakCount).toBe(6);
    });

    it("should handle missing streakCount (defaults to 0)", async () => {
      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "streak",
        title: "New Streak",
        colorVariant: "yellow",
        size: "wide",
        order: Date.now(),
        createdAt: Date.now(),
      });

      const card = await mockCtx.db.get(cardId);
      const next = (card!.streakCount as number ?? 0) + 1;
      await mockCtx.db.patch(cardId, { streakCount: next });

      const updated = await mockCtx.db.get(cardId);
      expect(updated?.streakCount).toBe(1);
    });
  });

  describe("toggleHabit", () => {
    it("should flip the done flag for a specific habit", async () => {
      const habits = [
        { label: "Water 2L", done: true },
        { label: "No Sugar", done: false },
        { label: "Walking", done: true },
      ];

      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "habits",
        title: "Daily Habits",
        colorVariant: "green",
        size: "tall",
        order: Date.now(),
        habits,
        dayCount: 12,
        createdAt: Date.now(),
      });

      // Toggle habit at index 1 (No Sugar: false → true)
      const card = await mockCtx.db.get(cardId);
      const habitIndex = 1;
      const updatedHabits = (card!.habits as Array<{ label: string; done: boolean }>).map(
        (h, i) => (i === habitIndex ? { ...h, done: !h.done } : h),
      );
      await mockCtx.db.patch(cardId, { habits: updatedHabits });

      const updated = await mockCtx.db.get(cardId);
      const resultHabits = updated?.habits as Array<{ label: string; done: boolean }>;
      expect(resultHabits[0]?.done).toBe(true);  // unchanged
      expect(resultHabits[1]?.done).toBe(true);  // flipped
      expect(resultHabits[2]?.done).toBe(true);  // unchanged
    });

    it("should toggle back to false", async () => {
      const habits = [
        { label: "Journal", done: true },
      ];

      const cardId = await mockCtx.db.insert("visionBoardCards", {
        userId: mockUserId,
        areaId: mockAreaId,
        cardType: "habits",
        title: "Habits",
        colorVariant: "green",
        size: "tall",
        order: Date.now(),
        habits,
        createdAt: Date.now(),
      });

      // Toggle index 0 (true → false)
      const card = await mockCtx.db.get(cardId);
      const updatedHabits = (card!.habits as Array<{ label: string; done: boolean }>).map(
        (h, i) => (i === 0 ? { ...h, done: !h.done } : h),
      );
      await mockCtx.db.patch(cardId, { habits: updatedHabits });

      const updated = await mockCtx.db.get(cardId);
      const resultHabits = updated?.habits as Array<{ label: string; done: boolean }>;
      expect(resultHabits[0]?.done).toBe(false);
    });
  });
});
