import { describe, expect, it } from "vitest";
import { packBoard, validateLayout } from "../packer";
import { MAX_STEP, MIN_STEP, clampStep, spanFor } from "../sizeLadder";
import { adaptLegacySize, resolveSizeStep } from "../adapter";
import type { BoardItem, SizeStep } from "../types";

const CARD_TYPES = [
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

/** Deterministic pseudo-random generator so property tests are replayable. */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBoard(seed: number, count: number): BoardItem[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, index) => ({
    id: `card_${index}`,
    cardType: CARD_TYPES[Math.floor(rand() * CARD_TYPES.length)],
    sizeStep: (1 + Math.floor(rand() * 4)) as SizeStep,
  }));
}

describe("packBoard", () => {
  it("returns an empty layout for an empty board", () => {
    const layout = packBoard([], 6);
    expect(layout.rows).toBe(0);
    expect(Object.keys(layout.items)).toHaveLength(0);
  });

  it("places a single card at the top-left", () => {
    const layout = packBoard(
      [{ id: "a", cardType: "counter", sizeStep: 2 }],
      6
    );
    expect(layout.items.a.colStart).toBe(1);
    expect(layout.items.a.rowStart).toBe(1);
    expect(validateLayout(layout).ok).toBe(true);
  });

  it("never overlaps, stays in bounds, and leaves no interior holes (property)", () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const cols of [2, 4, 6]) {
        const items = randomBoard(seed, 1 + (seed % 14));
        const layout = packBoard(items, cols);
        const result = validateLayout(layout);
        expect(
          result.ok,
          `seed=${seed} cols=${cols}: ${result.problems.join("; ")}`
        ).toBe(true);
        expect(Object.keys(layout.items)).toHaveLength(items.length);
      }
    }
  });

  it("is deterministic — same input twice gives identical output", () => {
    const items = randomBoard(42, 12);
    expect(packBoard(items, 6)).toEqual(packBoard(items, 6));
  });

  it("is stable — growing one card never moves the cards before it", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const items = randomBoard(seed, 10);
      const before = packBoard(items, 6);

      const target = 5; // grow the middle card
      const grown = items.map((item, index) =>
        index === target
          ? { ...item, sizeStep: clampStep(item.sizeStep + 1) }
          : item
      );
      const after = packBoard(grown, 6);

      // Cards in bands fully above the changed card's band must keep
      // their exact placement — the ripple is local by design.
      const changedBandTop = before.items[items[target].id].bandTop;
      for (let index = 0; index < target; index++) {
        const id = items[index].id;
        const prev = before.items[id];
        if (prev.bandTop < changedBandTop) {
          expect(after.items[id], `seed=${seed} card=${id}`).toEqual(prev);
        }
      }
    }
  });

  it("handles a 30-card stress board", () => {
    const layout = packBoard(randomBoard(7, 30), 6);
    expect(validateLayout(layout).ok).toBe(true);
  });
});

describe("sizeLadder", () => {
  it("resolves every type × step × breakpoint to a span within bounds", () => {
    for (const cardType of CARD_TYPES) {
      for (let step = MIN_STEP; step <= MAX_STEP; step++) {
        for (const cols of [2, 4, 6]) {
          const span = spanFor(cardType, step as SizeStep, cols);
          expect(span.colSpan).toBeGreaterThanOrEqual(1);
          expect(span.colSpan).toBeLessThanOrEqual(cols);
          expect(span.rowSpan).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it("ladders grow monotonically in area", () => {
    for (const cardType of CARD_TYPES) {
      let previousArea = 0;
      for (let step = MIN_STEP; step <= MAX_STEP; step++) {
        const span = spanFor(cardType, step as SizeStep, 6);
        const area = span.colSpan * span.rowSpan;
        expect(area).toBeGreaterThanOrEqual(previousArea);
        previousArea = area;
      }
    }
  });

  it("clamps steps into the 1..4 range", () => {
    expect(clampStep(0)).toBe(1);
    expect(clampStep(9)).toBe(4);
    expect(clampStep(2.4)).toBe(2);
  });
});

describe("adapter", () => {
  it("maps every legacy size into a valid step", () => {
    for (const size of ["sm", "md", "lg", "tall", "wide", "hero"]) {
      const step = adaptLegacySize(size);
      expect(step).toBeGreaterThanOrEqual(MIN_STEP);
      expect(step).toBeLessThanOrEqual(MAX_STEP);
    }
  });

  it("falls back to M for unknown or missing sizes", () => {
    expect(adaptLegacySize(undefined)).toBe(2);
    expect(adaptLegacySize("nonsense")).toBe(2);
  });

  it("prefers sizeStep over the legacy size", () => {
    expect(resolveSizeStep({ sizeStep: 4, size: "sm" })).toBe(4);
    expect(resolveSizeStep({ size: "hero" })).toBe(4);
    expect(resolveSizeStep({})).toBe(2);
  });
});
