import { describe, expect, it } from "vitest";
import { normalizeCharacterDomainLabel, rarityTone } from "./character-utils";

describe("character-utils", () => {
  it("normalizes known domain labels", () => {
    expect(normalizeCharacterDomainLabel("Mathematics")).toBe("Math");
    expect(normalizeCharacterDomainLabel("Creative Writing")).toBe("English");
    expect(normalizeCharacterDomainLabel("Reading Lab")).toBe("Reading");
    expect(normalizeCharacterDomainLabel("Coding Fundamentals")).toBe("Coding");
    expect(normalizeCharacterDomainLabel("Code Studio")).toBe("Coding");
  });

  it("falls back to original domain name when no mapping exists", () => {
    expect(normalizeCharacterDomainLabel("Science")).toBe("Science");
  });

  it("returns a rarity tone class for each rarity", () => {
    expect(rarityTone("common")).toContain("stone");
    expect(rarityTone("rare")).toContain("sky");
    expect(rarityTone("epic")).toContain("violet");
    expect(rarityTone("legendary")).toContain("amber");
  });
});
