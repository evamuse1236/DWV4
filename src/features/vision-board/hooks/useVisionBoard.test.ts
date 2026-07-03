/**
 * Tests for the useVisionBoard hook (collage v2).
 *
 * The backend logic (queries, mutations, atomic operations) is tested in
 * src/__tests__/convex/visionBoard.test.ts via the mock database. The
 * packing engine has its own suite under ../engine/__tests__.
 *
 * These tests verify:
 *  - DEFAULT_STEP covers every card type with a valid step
 *  - The _id → id mapping logic, including legacy size adaptation
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_STEP,
  MIN_STEP,
  MAX_STEP,
  type CardType,
  type ColorVariant,
  type VisionBoardCard,
  type VisionBoardArea,
} from "./useVisionBoard";
import { resolveSizeStep } from "@/features/vision-board/engine/adapter";

const ALL_CARD_TYPES: CardType[] = [
  "image_hero",
  "counter",
  "progress",
  "streak",
  "habits",
  "mini_tile",
  "motivation",
  "journal",
  "countdown",
  "photo_strip",
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("DEFAULT_STEP", () => {
  it("defines a valid step for every card type", () => {
    for (const ct of ALL_CARD_TYPES) {
      expect(DEFAULT_STEP[ct]).toBeGreaterThanOrEqual(MIN_STEP);
      expect(DEFAULT_STEP[ct]).toBeLessThanOrEqual(MAX_STEP);
    }
  });

  it("hero images start large, tiles start small", () => {
    expect(DEFAULT_STEP.image_hero).toBe(3);
    expect(DEFAULT_STEP.mini_tile).toBe(1);
    expect(DEFAULT_STEP.counter).toBe(1);
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

  it("should map a Convex card document, resolving its size step", () => {
    const rawCard = {
      _id: "mock_visionBoardCards_1",
      _creationTime: Date.now(),
      userId: "mock_users_1",
      areaId: "mock_visionBoardAreas_1",
      cardType: "counter" as const,
      title: "Books Read",
      emoji: "BookOpen",
      colorVariant: "blue" as const,
      sizeStep: 2,
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
      emoji: rawCard.emoji,
      colorVariant: rawCard.colorVariant as ColorVariant,
      sizeStep: resolveSizeStep(rawCard),
      order: rawCard.order,
      currentCount: rawCard.currentCount,
      targetCount: rawCard.targetCount,
      countLabel: rawCard.countLabel,
      createdAt: rawCard.createdAt,
    };

    expect(mapped.id).toBe("mock_visionBoardCards_1");
    expect(mapped.sizeStep).toBe(2);
    expect(mapped).not.toHaveProperty("_id");
    expect(mapped).not.toHaveProperty("userId");
  });

  it("adapts unmigrated legacy cards through their named size", () => {
    // A v1 row that has never been migrated: no sizeStep, legacy `size`.
    expect(resolveSizeStep({ size: "hero" })).toBe(4);
    expect(resolveSizeStep({ size: "sm" })).toBe(1);
    expect(resolveSizeStep({ size: "wide" })).toBe(3);
    // And a fully missing size falls back to M.
    expect(resolveSizeStep({})).toBe(2);
  });
});
