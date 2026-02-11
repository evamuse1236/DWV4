import { describe, expect, it } from "vitest";
import {
  applyLevelUps,
  domainStatLevel,
  domainStatLevelForDomain,
  xpNeeded,
} from "../../../convex/characterAwards";

describe("characterAwards helpers", () => {
  it("uses the gentle XP curve", () => {
    expect(xpNeeded(1)).toBe(100);
    expect(xpNeeded(2)).toBe(125);
    expect(xpNeeded(5)).toBe(200);
  });

  it("supports multi-level jumps in a single XP award", () => {
    const next = applyLevelUps(
      {
        level: 1,
        totalXp: 0,
        xpIntoLevel: 0,
        xpNeededForNextLevel: 100,
      },
      260
    );

    expect(next.level).toBe(3);
    expect(next.xpIntoLevel).toBe(35); // 260 - 100 - 125
    expect(next.xpNeededForNextLevel).toBe(150);
    expect(next.totalXp).toBe(260);
  });

  it("derives domain stat levels from domain XP", () => {
    expect(domainStatLevel(0)).toBe(1);
    expect(domainStatLevel(119)).toBe(1);
    expect(domainStatLevel(120)).toBe(2);
    expect(domainStatLevel(360)).toBe(4);
  });

  it("uses slower level scaling for Momentum", () => {
    expect(domainStatLevelForDomain(2016, "Momentum")).toBe(10);
    expect(domainStatLevelForDomain(2016, "Math")).toBe(17);
  });
});
