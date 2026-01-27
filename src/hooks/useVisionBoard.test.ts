/**
 * Tests for the useVisionBoard hook.
 *
 * The backend logic (queries, mutations, atomic operations) is tested in
 * src/__tests__/convex/visionBoard.test.ts via the mock database.
 *
 * These tests verify:
 *  - Exported constants (ALLOWED_SIZES, DEFAULT_SIZE) are correct
 *  - The _id → id mapping logic
 *  - Type re-exports remain stable
 */

import { describe, it, expect } from "vitest";
import {
  ALLOWED_SIZES,
  DEFAULT_SIZE,
  type CardType,
  type CardSize,
  type ColorVariant,
  type VisionBoardCard,
  type VisionBoardArea,
} from "./useVisionBoard";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("ALLOWED_SIZES", () => {
  it("should define allowed sizes for every card type", () => {
    const cardTypes: CardType[] = [
      "image_hero", "counter", "progress", "streak",
      "habits", "mini_tile", "motivation", "journal",
    ];

    for (const ct of cardTypes) {
      expect(ALLOWED_SIZES[ct]).toBeDefined();
      expect(ALLOWED_SIZES[ct].length).toBeGreaterThan(0);
    }
  });

  it("image_hero allows hero, lg, wide", () => {
    expect(ALLOWED_SIZES.image_hero).toEqual(["hero", "lg", "wide"]);
  });

  it("counter allows sm, md", () => {
    expect(ALLOWED_SIZES.counter).toEqual(["sm", "md"]);
  });

  it("mini_tile only allows sm", () => {
    expect(ALLOWED_SIZES.mini_tile).toEqual(["sm"]);
  });

  it("habits allows tall, lg", () => {
    expect(ALLOWED_SIZES.habits).toEqual(["tall", "lg"]);
  });
});

describe("DEFAULT_SIZE", () => {
  it("should define a default size for every card type", () => {
    const cardTypes: CardType[] = [
      "image_hero", "counter", "progress", "streak",
      "habits", "mini_tile", "motivation", "journal",
    ];

    for (const ct of cardTypes) {
      expect(DEFAULT_SIZE[ct]).toBeDefined();
    }
  });

  it("each default should be within its allowed sizes", () => {
    for (const [ct, defaultSize] of Object.entries(DEFAULT_SIZE)) {
      const allowed = ALLOWED_SIZES[ct as CardType];
      expect(allowed).toContain(defaultSize);
    }
  });

  it("image_hero defaults to hero", () => {
    expect(DEFAULT_SIZE.image_hero).toBe("hero");
  });

  it("counter defaults to sm", () => {
    expect(DEFAULT_SIZE.counter).toBe("sm");
  });

  it("journal defaults to wide", () => {
    expect(DEFAULT_SIZE.journal).toBe("wide");
  });
});

// ---------------------------------------------------------------------------
// ID Mapping (unit test for the transform logic the hook applies)
// ---------------------------------------------------------------------------

describe("_id → id mapping", () => {
  it("should map a Convex area document to VisionBoardArea shape", () => {
    const rawArea = {
      _id: "mock_visionBoardAreas_1",
      _creationTime: Date.now(),
      userId: "mock_users_1",
      name: "Fun & Interests",
      emoji: "Sparkle",
      isPreset: true,
    };

    // This is the mapping the hook performs
    const mapped: VisionBoardArea = {
      id: rawArea._id as string,
      name: rawArea.name,
      emoji: rawArea.emoji,
      isPreset: rawArea.isPreset,
    };

    expect(mapped.id).toBe("mock_visionBoardAreas_1");
    expect(mapped.name).toBe("Fun & Interests");
    expect(mapped).not.toHaveProperty("_id");
    expect(mapped).not.toHaveProperty("userId");
  });

  it("should map a Convex card document to VisionBoardCard shape", () => {
    const rawCard = {
      _id: "mock_visionBoardCards_1",
      _creationTime: Date.now(),
      userId: "mock_users_1",
      areaId: "mock_visionBoardAreas_1",
      cardType: "counter" as const,
      title: "Books Read",
      subtitle: undefined,
      emoji: "BookOpen",
      colorVariant: "blue" as const,
      size: "sm" as const,
      order: 1000,
      currentCount: 8,
      targetCount: 12,
      countLabel: "Books read",
      createdAt: Date.now(),
    };

    const mapped: VisionBoardCard = {
      id: rawCard._id as string,
      areaId: rawCard.areaId as string,
      cardType: rawCard.cardType as CardType,
      title: rawCard.title,
      subtitle: rawCard.subtitle,
      emoji: rawCard.emoji,
      colorVariant: rawCard.colorVariant as ColorVariant,
      size: rawCard.size as CardSize,
      order: rawCard.order,
      currentCount: rawCard.currentCount,
      targetCount: rawCard.targetCount,
      countLabel: rawCard.countLabel,
      createdAt: rawCard.createdAt,
    };

    expect(mapped.id).toBe("mock_visionBoardCards_1");
    expect(mapped.areaId).toBe("mock_visionBoardAreas_1");
    expect(mapped.cardType).toBe("counter");
    expect(mapped.currentCount).toBe(8);
    expect(mapped).not.toHaveProperty("_id");
    expect(mapped).not.toHaveProperty("userId");
  });

  it("should preserve optional fields as undefined when not set", () => {
    const rawCard = {
      _id: "mock_visionBoardCards_2",
      _creationTime: Date.now(),
      userId: "mock_users_1",
      areaId: "mock_visionBoardAreas_1",
      cardType: "mini_tile" as const,
      title: "Garden",
      emoji: "Leaf",
      colorVariant: "green" as const,
      size: "sm" as const,
      order: 2000,
      createdAt: Date.now(),
    };

    const mapped: VisionBoardCard = {
      id: rawCard._id as string,
      areaId: rawCard.areaId as string,
      cardType: rawCard.cardType as CardType,
      title: rawCard.title,
      emoji: rawCard.emoji,
      colorVariant: rawCard.colorVariant as ColorVariant,
      size: rawCard.size as CardSize,
      order: rawCard.order,
      createdAt: rawCard.createdAt,
    };

    expect(mapped.subtitle).toBeUndefined();
    expect(mapped.imageUrl).toBeUndefined();
    expect(mapped.habits).toBeUndefined();
    expect(mapped.textContent).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// cycleSize logic (pure function test)
// ---------------------------------------------------------------------------

describe("cycleSize logic", () => {
  it("should cycle through allowed sizes for a card type", () => {
    const allowed = ALLOWED_SIZES.counter; // ["sm", "md"]

    let current: CardSize = "sm";
    const idx = allowed.indexOf(current);
    const next = allowed[(idx + 1) % allowed.length];
    expect(next).toBe("md");

    // Cycle again: md → sm (wraps around)
    current = "md";
    const idx2 = allowed.indexOf(current);
    const next2 = allowed[(idx2 + 1) % allowed.length];
    expect(next2).toBe("sm");
  });

  it("should stay the same if only one allowed size (mini_tile)", () => {
    const allowed = ALLOWED_SIZES.mini_tile; // ["sm"]
    const current: CardSize = "sm";
    const idx = allowed.indexOf(current);
    const next = allowed[(idx + 1) % allowed.length];
    expect(next).toBe("sm");
  });

  it("should cycle through 3 sizes for image_hero", () => {
    const allowed = ALLOWED_SIZES.image_hero; // ["hero", "lg", "wide"]

    // hero → lg
    expect(allowed[(allowed.indexOf("hero") + 1) % allowed.length]).toBe("lg");
    // lg → wide
    expect(allowed[(allowed.indexOf("lg") + 1) % allowed.length]).toBe("wide");
    // wide → hero (wrap)
    expect(allowed[(allowed.indexOf("wide") + 1) % allowed.length]).toBe("hero");
  });
});
