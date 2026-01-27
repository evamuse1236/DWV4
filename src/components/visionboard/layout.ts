import type { CardSize, VisionBoardCard } from "@/hooks/useVisionBoard";
import { ALLOWED_SIZES } from "@/hooks/useVisionBoard";

export const GRID_COLS = 6;

interface SizeSpan {
  size: CardSize;
  colSpan: number;
  rowSpan: number;
  area: number;
}

const SIZE_SPANS: Record<CardSize, SizeSpan> = {
  sm: { size: "sm", colSpan: 1, rowSpan: 1, area: 1 },
  md: { size: "md", colSpan: 2, rowSpan: 1, area: 2 },
  lg: { size: "lg", colSpan: 2, rowSpan: 2, area: 4 },
  tall: { size: "tall", colSpan: 1, rowSpan: 2, area: 2 },
  wide: { size: "wide", colSpan: 3, rowSpan: 1, area: 3 },
  hero: { size: "hero", colSpan: 4, rowSpan: 2, area: 8 },
};

export interface LayoutItem {
  id: string;
  size: CardSize;
  colStart: number; // 1-based for CSS grid
  rowStart: number; // 1-based for CSS grid
  colSpan: number;
  rowSpan: number;
  changedFromPreferred: boolean;
}

export interface LayoutResult {
  items: Record<string, LayoutItem>;
  rows: number;
  cols: number;
  perfectFit: boolean;
}

interface SizeOption extends SizeSpan {
  penalty: number;
}

interface CandidatePlacement {
  cardIndex: number;
  option: SizeOption;
  row: number; // 0-based
  col: number; // 0-based
}

interface SolverResult {
  placements: LayoutItem[];
  rows: number;
  perfectFit: boolean;
}

function uniqueSizeOptions(card: VisionBoardCard): SizeOption[] {
  const allowed = ALLOWED_SIZES[card.cardType];
  const preferred = card.size;
  const preferredArea = SIZE_SPANS[preferred].area;

  const options = allowed.map((size) => {
    const span = SIZE_SPANS[size];
    const isPreferred = size === preferred;

    // Penalize deviations from the preferred size, and then penalize area drift.
    const penalty = (isPreferred ? 0 : 2) + Math.abs(span.area - preferredArea);

    return { ...span, penalty } satisfies SizeOption;
  });

  options.sort((a, b) => {
    if (a.penalty !== b.penalty) return a.penalty - b.penalty;
    if (a.area !== b.area) return b.area - a.area;
    return a.size.localeCompare(b.size);
  });

  return options;
}

function minArea(card: VisionBoardCard) {
  return Math.min(...ALLOWED_SIZES[card.cardType].map((s) => SIZE_SPANS[s].area));
}

function maxArea(card: VisionBoardCard) {
  return Math.max(...ALLOWED_SIZES[card.cardType].map((s) => SIZE_SPANS[s].area));
}

function findFirstEmpty(grid: Uint8Array): number | null {
  for (let i = 0; i < grid.length; i += 1) {
    if (grid[i] === 0) return i;
  }
  return null;
}

function canPlace(
  grid: Uint8Array,
  rows: number,
  cols: number,
  row: number,
  col: number,
  option: SizeSpan,
) {
  if (col + option.colSpan > cols) return false;
  if (row + option.rowSpan > rows) return false;

  for (let r = row; r < row + option.rowSpan; r += 1) {
    const rowOffset = r * cols;
    for (let c = col; c < col + option.colSpan; c += 1) {
      if (grid[rowOffset + c] === 1) return false;
    }
  }
  return true;
}

function place(grid: Uint8Array, cols: number, row: number, col: number, option: SizeSpan) {
  for (let r = row; r < row + option.rowSpan; r += 1) {
    const rowOffset = r * cols;
    for (let c = col; c < col + option.colSpan; c += 1) {
      grid[rowOffset + c] = 1;
    }
  }
}

function unplace(grid: Uint8Array, cols: number, row: number, col: number, option: SizeSpan) {
  for (let r = row; r < row + option.rowSpan; r += 1) {
    const rowOffset = r * cols;
    for (let c = col; c < col + option.colSpan; c += 1) {
      grid[rowOffset + c] = 0;
    }
  }
}

function buildCandidates(
  cards: VisionBoardCard[],
  used: boolean[],
  optionsByCard: SizeOption[][],
  row: number,
  col: number,
  rows: number,
  cols: number,
  grid: Uint8Array,
): CandidatePlacement[] {
  const candidates: CandidatePlacement[] = [];

  for (let i = 0; i < cards.length; i += 1) {
    if (used[i]) continue;

    for (const option of optionsByCard[i]) {
      if (!canPlace(grid, rows, cols, row, col, option)) continue;

      candidates.push({ cardIndex: i, option, row, col });
    }
  }

  candidates.sort((a, b) => {
    if (a.option.penalty !== b.option.penalty) return a.option.penalty - b.option.penalty;
    if (a.option.area !== b.option.area) return b.option.area - a.option.area;
    return cards[a.cardIndex].order - cards[b.cardIndex].order;
  });

  return candidates;
}

function solveWithRowLimit(cards: VisionBoardCard[], rowLimit: number): SolverResult | null {
  const cols = GRID_COLS;
  const totalCells = rowLimit * cols;
  const grid = new Uint8Array(totalCells);
  const used = new Array<boolean>(cards.length).fill(false);

  const optionsByCard = cards.map(uniqueSizeOptions);
  const minAreas = cards.map(minArea);
  const maxAreas = cards.map(maxArea);

  let remainingMin = minAreas.reduce((sum, v) => sum + v, 0);
  let remainingMax = maxAreas.reduce((sum, v) => sum + v, 0);

  const placements: LayoutItem[] = [];

  let iterations = 0;
  const ITERATION_LIMIT = 60_000;

  function backtrack(occupiedArea: number): boolean {
    iterations += 1;
    if (iterations > ITERATION_LIMIT) return false;

    const emptyIndex = findFirstEmpty(grid);

    // All cells filled. We succeed only if every card has been placed.
    if (emptyIndex === null) {
      return placements.length === cards.length;
    }

    // Quick feasibility pruning based on the remaining cell budget.
    const remainingCells = totalCells - occupiedArea;
    if (remainingCells < remainingMin) return false;
    if (remainingCells > remainingMax) return false;

    const row = Math.floor(emptyIndex / cols);
    const col = emptyIndex % cols;

    const candidates = buildCandidates(cards, used, optionsByCard, row, col, rowLimit, cols, grid);
    if (candidates.length === 0) return false;

    for (const candidate of candidates) {
      const { cardIndex, option } = candidate;
      const card = cards[cardIndex];

      used[cardIndex] = true;
      remainingMin -= minAreas[cardIndex];
      remainingMax -= maxAreas[cardIndex];

      place(grid, cols, row, col, option);

      placements.push({
        id: card.id,
        size: option.size,
        colStart: col + 1,
        rowStart: row + 1,
        colSpan: option.colSpan,
        rowSpan: option.rowSpan,
        changedFromPreferred: option.size !== card.size,
      });

      const nextOccupied = occupiedArea + option.area;
      const shouldContinue = backtrack(nextOccupied);
      if (shouldContinue) return true;

      placements.pop();
      unplace(grid, cols, row, col, option);

      used[cardIndex] = false;
      remainingMin += minAreas[cardIndex];
      remainingMax += maxAreas[cardIndex];
    }

    return false;
  }

  const solved = backtrack(0);
  if (!solved) return null;

  return {
    placements,
    rows: rowLimit,
    perfectFit: true,
  } satisfies SolverResult;
}

// Greedy fallback: place cards with minimal reshaping and grow rows as needed.
function greedyPack(cards: VisionBoardCard[]): SolverResult {
  const cols = GRID_COLS;
  const optionsByCard = cards.map(uniqueSizeOptions);

  // Sort by larger preferred area first to reduce fragmentation.
  const order = cards
    .map((card, index) => ({
      card,
      index,
      area: SIZE_SPANS[card.size].area,
    }))
    .sort((a, b) => {
      if (a.area !== b.area) return b.area - a.area;
      return a.card.order - b.card.order;
    });

  let rows = 6;
  let grid = new Uint8Array(rows * cols);

  function ensureRows(minRows: number) {
    if (minRows <= rows) return;
    const nextRows = Math.max(minRows, rows + 4);
    const nextGrid = new Uint8Array(nextRows * cols);
    nextGrid.set(grid);
    grid = nextGrid;
    rows = nextRows;
  }

  function canPlaceWithRows(row: number, col: number, option: SizeSpan) {
    ensureRows(row + option.rowSpan);
    return canPlace(grid, rows, cols, row, col, option);
  }

  function placeInFirstSpot(cardIndex: number): LayoutItem {
    const card = cards[cardIndex];
    const options = optionsByCard[cardIndex];

    for (let i = 0; i < grid.length; i += 1) {
      if (grid[i] === 1) continue;

      const row = Math.floor(i / cols);
      const col = i % cols;

      for (const option of options) {
        if (!canPlaceWithRows(row, col, option)) continue;
        place(grid, cols, row, col, option);
        return {
          id: card.id,
          size: option.size,
          colStart: col + 1,
          rowStart: row + 1,
          colSpan: option.colSpan,
          rowSpan: option.rowSpan,
          changedFromPreferred: option.size !== card.size,
        } satisfies LayoutItem;
      }
    }

    // As a last resort, append rows and try again from the new space.
    const lastRow = rows;
    ensureRows(rows + 6);

    for (let r = lastRow; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        for (const option of options) {
          if (!canPlace(grid, rows, cols, r, c, option)) continue;
          place(grid, cols, r, c, option);
          return {
            id: card.id,
            size: option.size,
            colStart: c + 1,
            rowStart: r + 1,
            colSpan: option.colSpan,
            rowSpan: option.rowSpan,
            changedFromPreferred: option.size !== card.size,
          } satisfies LayoutItem;
        }
      }
    }

    // This should be unreachable because the grid can always grow.
    const fallback = SIZE_SPANS[card.size];
    return {
      id: card.id,
      size: card.size,
      colStart: 1,
      rowStart: rows + 1,
      colSpan: fallback.colSpan,
      rowSpan: fallback.rowSpan,
      changedFromPreferred: false,
    } satisfies LayoutItem;
  }

  const placements: LayoutItem[] = [];
  for (const item of order) {
    placements.push(placeInFirstSpot(item.index));
  }

  // Trim unused rows.
  let lastUsedRow = 0;
  for (const placement of placements) {
    lastUsedRow = Math.max(lastUsedRow, placement.rowStart - 1 + placement.rowSpan);
  }

  return {
    placements,
    rows: Math.max(lastUsedRow, 1),
    perfectFit: false,
  } satisfies SolverResult;
}

export function computeVisionBoardLayout(cards: VisionBoardCard[]): LayoutResult {
  if (cards.length === 0) {
    return {
      items: {},
      rows: 0,
      cols: GRID_COLS,
      perfectFit: true,
    } satisfies LayoutResult;
  }

  // Keep a stable baseline order when solving.
  const sorted = [...cards].sort((a, b) => a.order - b.order);

  const minTotalArea = sorted.reduce((sum, card) => sum + minArea(card), 0);
  const maxTotalArea = sorted.reduce((sum, card) => sum + maxArea(card), 0);

  const minRows = Math.ceil(minTotalArea / GRID_COLS);
  const maxRows = Math.min(Math.ceil(maxTotalArea / GRID_COLS) + 2, minRows + 12);

  let solved: SolverResult | null = null;

  for (let rows = minRows; rows <= maxRows; rows += 1) {
    const totalCells = rows * GRID_COLS;
    if (totalCells < minTotalArea) continue;
    if (totalCells > maxTotalArea) continue;

    const attempt = solveWithRowLimit(sorted, rows);
    if (attempt) {
      solved = attempt;
      break;
    }
  }

  if (!solved) {
    solved = greedyPack(sorted);
  }

  const items = Object.fromEntries(solved.placements.map((p) => [p.id, p]));

  return {
    items,
    rows: solved.rows,
    cols: GRID_COLS,
    perfectFit: solved.perfectFit,
  } satisfies LayoutResult;
}

export function spanForSize(size: CardSize): SizeSpan {
  return SIZE_SPANS[size];
}
