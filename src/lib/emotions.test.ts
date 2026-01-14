import { describe, expect, it, vi } from "vitest";
import {
  emotionData,
  primaryEmotions,
  getEmotionCategory,
  getSubEmotion,
  journalPrompts,
  getRandomPrompt,
} from "./emotions";

describe("emotionData", () => {
  it("contains all 5 primary emotion categories", () => {
    const categories = Object.keys(emotionData);
    expect(categories).toHaveLength(5);
    expect(categories).toContain("happy");
    expect(categories).toContain("sad");
    expect(categories).toContain("angry");
    expect(categories).toContain("scared");
    expect(categories).toContain("surprised");
  });

  it("each category has required properties", () => {
    Object.values(emotionData).forEach((category) => {
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("emoji");
      expect(category).toHaveProperty("color");
      expect(category).toHaveProperty("description");
      expect(category).toHaveProperty("subcategories");
      expect(Array.isArray(category.subcategories)).toBe(true);
      expect(category.subcategories.length).toBeGreaterThan(0);
    });
  });

  it("each subcategory has name and emoji", () => {
    Object.values(emotionData).forEach((category) => {
      category.subcategories.forEach((sub) => {
        expect(sub).toHaveProperty("name");
        expect(sub).toHaveProperty("emoji");
        expect(typeof sub.name).toBe("string");
        expect(typeof sub.emoji).toBe("string");
      });
    });
  });
});

describe("primaryEmotions", () => {
  it("returns all categories as an array with ids", () => {
    expect(Array.isArray(primaryEmotions)).toBe(true);
    expect(primaryEmotions).toHaveLength(5);

    primaryEmotions.forEach((emotion) => {
      expect(emotion).toHaveProperty("id");
      expect(emotion).toHaveProperty("name");
      expect(emotion).toHaveProperty("emoji");
    });
  });

  it("includes happy emotion with correct structure", () => {
    const happy = primaryEmotions.find((e) => e.id === "happy");
    expect(happy).toBeDefined();
    expect(happy?.name).toBe("Happy");
    expect(happy?.emoji).toBe("😊");
  });
});

describe("getEmotionCategory", () => {
  it("returns the correct category for valid id", () => {
    const happy = getEmotionCategory("happy");
    expect(happy).toBeDefined();
    expect(happy?.name).toBe("Happy");
    expect(happy?.color).toBe("#FFD93D");
  });

  it("returns undefined for invalid id", () => {
    expect(getEmotionCategory("nonexistent")).toBeUndefined();
    expect(getEmotionCategory("")).toBeUndefined();
  });
});

describe("getSubEmotion", () => {
  it("returns the correct sub-emotion for valid category and name", () => {
    const excited = getSubEmotion("happy", "Excited");
    expect(excited).toBeDefined();
    expect(excited?.name).toBe("Excited");
    expect(excited?.emoji).toBe("🤩");
  });

  it("returns undefined for invalid category", () => {
    expect(getSubEmotion("nonexistent", "Excited")).toBeUndefined();
  });

  it("returns undefined for invalid sub-emotion name", () => {
    expect(getSubEmotion("happy", "Nonexistent")).toBeUndefined();
  });

  it("is case-sensitive for sub-emotion names", () => {
    // "Excited" exists, but "excited" (lowercase) should not match
    expect(getSubEmotion("happy", "excited")).toBeUndefined();
  });
});

describe("journalPrompts", () => {
  it("has prompts for all 5 emotion categories", () => {
    expect(Object.keys(journalPrompts)).toHaveLength(5);
    expect(journalPrompts).toHaveProperty("happy");
    expect(journalPrompts).toHaveProperty("sad");
    expect(journalPrompts).toHaveProperty("angry");
    expect(journalPrompts).toHaveProperty("scared");
    expect(journalPrompts).toHaveProperty("surprised");
  });

  it("each category has at least one prompt", () => {
    Object.values(journalPrompts).forEach((prompts) => {
      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts.length).toBeGreaterThan(0);
    });
  });
});

describe("getRandomPrompt", () => {
  it("returns a prompt from the correct category", () => {
    // Mock Math.random to get predictable results
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0);

    const happyPrompt = getRandomPrompt("happy");
    expect(journalPrompts.happy).toContain(happyPrompt);

    const sadPrompt = getRandomPrompt("sad");
    expect(journalPrompts.sad).toContain(sadPrompt);

    mockRandom.mockRestore();
  });

  it("falls back to happy prompts for invalid category", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0);

    const prompt = getRandomPrompt("nonexistent");
    expect(journalPrompts.happy).toContain(prompt);

    mockRandom.mockRestore();
  });

  it("returns different prompts based on Math.random", () => {
    const mockRandom = vi.spyOn(Math, "random");

    // First prompt (index 0)
    mockRandom.mockReturnValue(0);
    const firstPrompt = getRandomPrompt("happy");

    // Last prompt (index = length - 1)
    mockRandom.mockReturnValue(0.99);
    const lastPrompt = getRandomPrompt("happy");

    // These should be different (assuming there's more than one prompt)
    if (journalPrompts.happy.length > 1) {
      expect(firstPrompt).not.toBe(lastPrompt);
    }

    mockRandom.mockRestore();
  });
});
