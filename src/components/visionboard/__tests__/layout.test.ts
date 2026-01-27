import { describe, expect, it } from "vitest";
import type { VisionBoardCard, CardType, CardSize, ColorVariant } from "@/hooks/useVisionBoard";
import { ALLOWED_SIZES } from "@/hooks/useVisionBoard";
import { computeVisionBoardLayout, GRID_COLS, spanForSize } from "@/components/visionboard/layout";

function makeCard(
  id: string,
  cardType: CardType,
  size: CardSize,
  order: number,
  colorVariant: ColorVariant = "blue",
): VisionBoardCard {
  return {
    id,
    areaId: "area-test",
    cardType,
    title: id,
    colorVariant,
    size,
    order,
    createdAt: order,
  } satisfies VisionBoardCard;
}

function validateLayout(cards: VisionBoardCard[], layout: ReturnType<typeof computeVisionBoardLayout>) {
  const rows = layout.rows;
  const cols = layout.cols;
  const totalCells = rows * cols;
  const grid = new Uint8Array(totalCells);

  for (const card of cards) {
    const placement = layout.items[card.id];
    expect(placement, `missing placement for ${card.id}`).toBeTruthy();
    if (!placement) continue;

    // Placement sizes must remain within the allowed set.
    expect(ALLOWED_SIZES[card.cardType]).toContain(placement.size);

    const span = spanForSize(placement.size);

    const rowStart = placement.rowStart - 1;
    const colStart = placement.colStart - 1;

    expect(colStart + span.colSpan).toBeLessThanOrEqual(cols);
    expect(rowStart + span.rowSpan).toBeLessThanOrEqual(rows);

    for (let r = rowStart; r < rowStart + span.rowSpan; r += 1) {
      const rowOffset = r * cols;
      for (let c = colStart; c < colStart + span.colSpan; c += 1) {
        const idx = rowOffset + c;
        expect(grid[idx], `overlap at cell ${r},${c}`).toBe(0);
        grid[idx] = 1;
      }
    }
  }

  if (layout.perfectFit) {
    const filled = grid.reduce((sum, v) => sum + v, 0);
    expect(filled).toBe(rows * cols);
  }

  expect(layout.cols).toBe(GRID_COLS);
}

describe("computeVisionBoardLayout", () => {
  it("finds a perfect fit for a tileable board", () => {
    const cards: VisionBoardCard[] = [
      makeCard("hero", "image_hero", "hero", 1, "orange"),
      makeCard("md", "motivation", "md", 2, "pink"),
      makeCard("sm-1", "counter", "sm", 3, "green"),
      makeCard("sm-2", "mini_tile", "sm", 4, "yellow"),
    ];

    const layout = computeVisionBoardLayout(cards);
    validateLayout(cards, layout);

    expect(layout.perfectFit).toBe(true);
    expect(layout.rows).toBe(2);
  });

  it("produces a valid layout even when a perfect tiling is unlikely", () => {
    const cards: VisionBoardCard[] = [
      makeCard("hero", "image_hero", "hero", 1, "orange"),
      makeCard("wide-1", "streak", "wide", 2, "yellow"),
      makeCard("wide-2", "journal", "wide", 3, "blue"),
      makeCard("lg", "progress", "lg", 4, "purple"),
      makeCard("tall", "habits", "tall", 5, "green"),
    ];

    const layout = computeVisionBoardLayout(cards);
    validateLayout(cards, layout);

    expect(layout.rows).toBeGreaterThan(0);
  });
});
