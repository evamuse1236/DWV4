/**
 * Collage engine types (vision board v2).
 *
 * Cards live on a discrete grid (2/4/6 columns by breakpoint). Each card has
 * a `sizeStep` 1..4 (S/M/L/XL) that resolves to a col×row span through the
 * size ladder, shaped per card type. The packer lays cards out in priority
 * order into horizontal bands and heals every gap by stretching neighbours,
 * so the collage is always hole-free.
 */

export type SizeStep = 1 | 2 | 3 | 4;

export interface Span {
  colSpan: number;
  rowSpan: number;
}

/** Visual shape family a card type belongs to (drives its size ladder). */
export type Shape = "default" | "wide" | "tall" | "hero";

/** Minimal input the packer needs per card. */
export interface BoardItem {
  id: string;
  cardType: string;
  sizeStep: SizeStep;
}

export interface PlacedItem extends Span {
  id: string;
  /** 1-based CSS grid coordinates */
  colStart: number;
  rowStart: number;
  /** 1-based top row of the band this card belongs to. */
  bandTop: number;
  /** True when healing stretched this card beyond its ladder span. */
  stretched: boolean;
}

export interface BoardLayout {
  items: Record<string, PlacedItem>;
  rows: number;
  cols: number;
}
