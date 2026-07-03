import type { Shape, SizeStep, Span } from "./types";

/**
 * Size ladder: how a card's S/M/L/XL step resolves to a grid span,
 * shaped per card type. Spans clamp to the current column count so the
 * same board reads well at 6, 4, and 2 columns.
 */

export const SHAPE_BY_TYPE: Record<string, Shape> = {
  image_hero: "hero",
  counter: "default",
  progress: "default",
  mini_tile: "default",
  streak: "wide",
  motivation: "wide",
  journal: "wide",
  countdown: "wide",
  habits: "tall",
  photo_strip: "tall",
};

const LADDERS: Record<Shape, Span[]> = {
  default: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 2, rowSpan: 2 },
    { colSpan: 3, rowSpan: 2 },
  ],
  wide: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 3, rowSpan: 1 },
    { colSpan: 4, rowSpan: 2 },
  ],
  tall: [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 1, rowSpan: 2 },
    { colSpan: 2, rowSpan: 2 },
    { colSpan: 2, rowSpan: 3 },
  ],
  hero: [
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 2, rowSpan: 2 },
    { colSpan: 3, rowSpan: 2 },
    { colSpan: 4, rowSpan: 2 },
  ],
};

export const MIN_STEP: SizeStep = 1;
export const MAX_STEP: SizeStep = 4;

export const STEP_LABELS: Record<SizeStep, string> = {
  1: "S",
  2: "M",
  3: "L",
  4: "XL",
};

export function shapeFor(cardType: string): Shape {
  return SHAPE_BY_TYPE[cardType] ?? "default";
}

export function clampStep(step: number): SizeStep {
  return Math.min(MAX_STEP, Math.max(MIN_STEP, Math.round(step))) as SizeStep;
}

/** Resolve a card's step to a span, clamped to the available columns. */
export function spanFor(cardType: string, step: SizeStep, cols: number): Span {
  const ladder = LADDERS[shapeFor(cardType)];
  const raw = ladder[clampStep(step) - 1];
  return {
    colSpan: Math.min(raw.colSpan, cols),
    rowSpan: raw.rowSpan,
  };
}
