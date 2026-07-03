import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { VisionBoardCard } from "@/features/vision-board/hooks/useVisionBoard";
import { packBoard } from "@/features/vision-board/engine/packer";
import type { BoardItem } from "@/features/vision-board/engine/types";
import { BoardCard } from "./BoardCard";

const ROW_HEIGHT = 160;
const GAP = 16;

function colsForWidth(width: number): number {
  if (width < 560) return 2;
  if (width < 920) return 4;
  return 6;
}

interface BoardCanvasProps {
  cards: VisionBoardCard[];
  onOpen: (card: VisionBoardCard) => void;
  onStep: (id: string, next: number) => void;
  onReorder: (id: string, beforeOrder: number | null, afterOrder: number | null) => void;
  onIncrement: (id: string) => void;
  onIncrementProgress: (id: string) => void;
  onIncrementStreak: (id: string) => void;
  onToggleHabit: (cardId: string, index: number) => void;
}

/**
 * The collage. Measures its own width to pick a column count, packs the
 * cards with the band packer, and renders them on a CSS grid with FLIP
 * spring animations so every reflow reads as a calm glide.
 */
export function BoardCanvas({
  cards,
  onOpen,
  onStep,
  onReorder,
  onIncrement,
  onIncrementProgress,
  onIncrementStreak,
  onToggleHabit,
}: BoardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(6);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) setCols(colsForWidth(width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Deselect on Escape or when tapping outside the board.
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const layout = useMemo(() => {
    const items: BoardItem[] = cards.map((card) => ({
      id: card.id,
      cardType: card.cardType,
      sizeStep: card.sizeStep,
    }));
    return packBoard(items, cols);
  }, [cards, cols]);

  const handleMove = useCallback(
    (id: string, direction: -1 | 1) => {
      const index = cards.findIndex((card) => card.id === id);
      if (index < 0) return;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= cards.length) return;
      // Move past the neighbour: land between it and the card beyond it.
      const neighbour = cards[targetIndex];
      const beyond = cards[targetIndex + direction] ?? null;
      if (direction === -1) {
        onReorder(id, beyond ? beyond.order : null, neighbour.order);
      } else {
        onReorder(id, neighbour.order, beyond ? beyond.order : null);
      }
    },
    [cards, onReorder]
  );

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full"
      onClick={() => setSelectedId(null)}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridAutoRows: `${ROW_HEIGHT}px`,
          gap: GAP,
        }}
      >
        {cards.map((card) => {
          const placement = layout.items[card.id];
          if (!placement) return null;
          return (
            <BoardCard
              key={card.id}
              card={card}
              placement={placement}
              selected={selectedId === card.id}
              onSelect={setSelectedId}
              onOpen={onOpen}
              onStep={onStep}
              onMove={handleMove}
              onIncrement={onIncrement}
              onIncrementProgress={onIncrementProgress}
              onIncrementStreak={onIncrementStreak}
              onToggleHabit={onToggleHabit}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

export default BoardCanvas;
