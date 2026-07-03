import type { BoardItem, BoardLayout, PlacedItem, Span } from "./types";
import { spanFor } from "./sizeLadder";

/**
 * Band packer — deterministic, stable, hole-free.
 *
 * Cards flow in priority order into horizontal bands (shelves). The first
 * card in a band sets the band height; following cards sit beside it, and a
 * shorter card opens a "stack slot" a same-width card can drop into. When a
 * band closes, healing stretches cards over any leftover space:
 *   - stack slots left half-filled → the bottom card stretches down
 *   - leftover width on the right → the band's last column group stretches
 * The final band skips the horizontal stretch so the collage keeps an
 * organic, ragged bottom edge (never an interior hole).
 *
 * Stability: a change to card K can only affect K's band and later bands —
 * everything placed before stays exactly where it was.
 */

interface StackSlot {
  col: number; // 0-based
  colSpan: number;
  rowOffset: number; // rows already used within the band
  itemIds: string[]; // cards stacked in this column group, top → bottom
}

export function packBoard(items: BoardItem[], cols: number): BoardLayout {
  const placed: Record<string, PlacedItem> = {};
  if (items.length === 0) return { items: placed, rows: 0, cols };

  let bandTop = 0; // 0-based row where the current band starts
  let bandHeight = 0;
  let cursor = 0; // next free column in the band
  let slots: StackSlot[] = [];
  let bandGroups: StackSlot[] = []; // every column group in the band (for healing)

  const place = (id: string, col: number, row: number, span: Span) => {
    placed[id] = {
      id,
      colStart: col + 1,
      rowStart: row + 1,
      bandTop: bandTop + 1,
      colSpan: span.colSpan,
      rowSpan: span.rowSpan,
      stretched: false,
    };
  };

  const healBand = (isLast: boolean) => {
    // Fill unfinished stacks: the deepest card in each group stretches down.
    for (const group of bandGroups) {
      if (group.rowOffset < bandHeight && group.itemIds.length > 0) {
        const bottomId = group.itemIds[group.itemIds.length - 1];
        const item = placed[bottomId];
        item.rowSpan += bandHeight - group.rowOffset;
        item.stretched = true;
        group.rowOffset = bandHeight;
      }
    }
    // Fill leftover width by stretching the last column group (skip on the
    // final band so the bottom edge can sit ragged).
    const leftover = cols - cursor;
    if (!isLast && leftover > 0 && bandGroups.length > 0) {
      const lastGroup = bandGroups[bandGroups.length - 1];
      for (const id of lastGroup.itemIds) {
        placed[id].colSpan += leftover;
        placed[id].stretched = true;
      }
      lastGroup.colSpan += leftover;
    }
  };

  const openBand = (height: number) => {
    bandTop += bandHeight;
    bandHeight = height;
    cursor = 0;
    slots = [];
    bandGroups = [];
  };

  for (const item of items) {
    const span = spanFor(item.cardType, item.sizeStep, cols);

    // 1) Drop into an open stack slot when the width matches and it fits.
    const slot = slots.find(
      (s) => s.colSpan === span.colSpan && s.rowOffset + span.rowSpan <= bandHeight
    );
    if (slot) {
      place(item.id, slot.col, bandTop + slot.rowOffset, span);
      slot.rowOffset += span.rowSpan;
      slot.itemIds.push(item.id);
      if (slot.rowOffset >= bandHeight) {
        slots = slots.filter((s) => s !== slot);
      }
      continue;
    }

    // 2) Start a new column group; close the band first if it can't fit.
    const needsNewBand =
      bandHeight === 0 ||
      cursor + span.colSpan > cols ||
      (span.rowSpan > bandHeight && cursor > 0);
    if (needsNewBand && bandHeight !== 0) {
      healBand(false);
    }
    if (needsNewBand) {
      openBand(span.rowSpan);
    } else if (span.rowSpan > bandHeight && cursor === 0) {
      // First real group can still raise the band.
      bandHeight = span.rowSpan;
    }

    place(item.id, cursor, bandTop, span);
    const group: StackSlot = {
      col: cursor,
      colSpan: span.colSpan,
      rowOffset: span.rowSpan,
      itemIds: [item.id],
    };
    bandGroups.push(group);
    if (span.rowSpan < bandHeight) {
      slots.push(group);
    }
    cursor += span.colSpan;
  }

  healBand(true);

  const rows = bandTop + bandHeight;
  return { items: placed, rows, cols };
}

/** Test helper: true when no two placed items overlap and all are in bounds. */
export function validateLayout(layout: BoardLayout): {
  ok: boolean;
  problems: string[];
} {
  const problems: string[] = [];
  const grid = new Map<string, string>();

  for (const item of Object.values(layout.items)) {
    if (item.colStart < 1 || item.colStart + item.colSpan - 1 > layout.cols) {
      problems.push(`${item.id} out of horizontal bounds`);
    }
    if (item.rowStart < 1 || item.rowSpan < 1) {
      problems.push(`${item.id} has an invalid row placement`);
    }
    for (let r = item.rowStart; r < item.rowStart + item.rowSpan; r++) {
      for (let c = item.colStart; c < item.colStart + item.colSpan; c++) {
        const key = `${r}:${c}`;
        const existing = grid.get(key);
        if (existing) {
          problems.push(`${item.id} overlaps ${existing} at ${key}`);
        }
        grid.set(key, item.id);
      }
    }
  }

  // Interior holes: every cell above the last band must be covered.
  // The last band itself may sit ragged on the right by design.
  const lastBandTop = Math.max(
    0,
    ...Object.values(layout.items).map((item) => item.bandTop)
  );
  for (let r = 1; r < lastBandTop; r++) {
    for (let c = 1; c <= layout.cols; c++) {
      if (!grid.has(`${r}:${c}`)) {
        problems.push(`interior hole at ${r}:${c}`);
      }
    }
  }

  return { ok: problems.length === 0, problems };
}
